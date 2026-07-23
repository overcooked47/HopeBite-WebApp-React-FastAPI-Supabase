from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
import app.services.user_service as user_service
from app.schemas.auth import (
    Token,
    RefreshTokenRequest,
    LoginRequest,
    AdminLoginRequest,
    SignupOptions,
    ContributorTypeOptions,
    RecipientTypeOptions,
    TokenWithUser,
)
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User, UserRole, UserType

router = APIRouter(tags=["Authentication"])


@router.get("/signup-options", response_model=SignupOptions)
async def get_signup_options():
    """
    Get available signup options.
    Returns the 4 role options:
    - Join as Contributor
    - Join as Recipient
    - Join as Volunteer
    - Admin Login (fixed credentials)
    """
    return SignupOptions()


@router.get("/contributor-types", response_model=ContributorTypeOptions)
async def get_contributor_types():
    """
    Get available contributor type options:
    - Join as an Individual
    - Join as an NGO/Humanitarian Organization
    - Join as a Company
    """
    return ContributorTypeOptions()


@router.get("/recipient-types", response_model=RecipientTypeOptions)
async def get_recipient_types():
    """
    Get available recipient type options:
    - Join as an Individual
    - Join as an Organization
    """
    return RecipientTypeOptions()


@router.post("/register", response_model=TokenWithUser, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
):
    """
    Register a new user.
    Role must be one of: contributor, recipient, volunteer.
    Admin accounts cannot be created through registration.
    
    For Contributors:
    - If user_type is NGO/COMPANY, organization_name and organization_registration_number are required
    - If user_type is INDIVIDUAL, only basic info is needed
    
    Returns TokenWithUser for immediate login after registration.
    """
    
    
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be created through registration. Use admin login."
        )
    
    
    existing_user = await user_service.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    
    if user_data.role == UserRole.CONTRIBUTOR:
        if user_data.user_type in [UserType.NGO, UserType.COMPANY]:
            if not user_data.organization_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization name is required for NGO/Company accounts"
                )
    
    
    try:
        user, supabase_token = await user_service.create(user_data)
        
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenWithUser(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user_id=user.id,
            role=user.role,
            user_type=user.user_type,
            full_name=user.full_name,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e).lower()
        
        if "already registered" in error_msg or "already been registered" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered. Please try logging in instead."
            )
        elif "IntegrityError" in type(e).__name__ or "unique constraint" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered (Duplicate Entry)"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/admin-login", response_model=TokenWithUser)
async def admin_login(
    login_data: AdminLoginRequest,
):
    """
    Admin login with secure credentials.
    """
    
    
    if not await user_service.verify_admin_credentials(login_data.email, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    
    admin = await user_service.create_admin_if_not_exists()
    
    
    await user_service.update_last_login(admin)
    
    
    access_token = create_access_token(data={"sub": str(admin.id)})
    refresh_token = create_refresh_token(data={"sub": str(admin.id)})
    
    return TokenWithUser(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=admin.id,
        role=admin.role,
        user_type=admin.user_type,
        full_name=admin.full_name,
    )


@router.post("/login", response_model=TokenWithUser)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Login and get access token."""
    
    user = await user_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    await user_service.update_last_login(user)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenWithUser(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        user_type=user.user_type,
        full_name=user.full_name,
    )


@router.post("/login/json", response_model=TokenWithUser)
async def login_json(
    login_data: LoginRequest,
):
    """Login with JSON body and get access token."""
    
    user = await user_service.authenticate(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    await user_service.update_last_login(user)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenWithUser(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        user_type=user.user_type,
        full_name=user.full_name,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
):
    """Refresh access token using refresh token."""
    
    try:
        payload = decode_token(token_data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    

    user = await user_service.get_by_id(user_id) 
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
 
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current user information."""
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
):
    """Logout user (client should discard tokens)."""
    return {"message": "Successfully logged out"}
