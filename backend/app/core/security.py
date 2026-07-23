from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.info(f"Token decoded successfully: sub={payload.get('sub')}")
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    """Get the current authenticated user from the token."""
    from app.core.supabase import supabase, run_query
    from app.models.user import User
    import logging
    logger = logging.getLogger(__name__)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        logger.error("Token decode failed - invalid token")
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    token_type: str = payload.get("type")
    
    logger.info(f"Token payload: user_id={user_id}, token_type={token_type}")
    
    if user_id is None or token_type != "access":
        logger.error(f"Invalid token payload: user_id={user_id}, token_type={token_type}")
        raise credentials_exception
    
    try:
        
        logger.info(f"Fetching user from database: {user_id}")
        response = await run_query(supabase.table("users").select("*").eq("id", user_id).single())
        user_data = response.data
        
        if not user_data:
            logger.error(f"User not found in database: {user_id}")
            raise credentials_exception
        
        logger.info(f"User found: {user_data.get('email')}")
            
        
        user = User(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth Error fetching user: {e}")
        import traceback
        traceback.print_exc()
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_active_admin(
    current_user = Depends(get_current_user),
):
    """Get the current user and verify they are an admin."""
    from app.models.user import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_contributor(
    current_user = Depends(get_current_user),
):
    """Get the current user and verify they are a contributor (non-admin)."""
    from app.models.user import UserRole
    if current_user.role != UserRole.CONTRIBUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contributor access required"
        )
    return current_user


async def get_current_recipient(
    current_user = Depends(get_current_user),
):
    """Get the current user and verify they are a recipient (non-admin)."""
    from app.models.user import UserRole
    if current_user.role != UserRole.RECIPIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recipient access required"
        )
    return current_user


async def get_current_volunteer(
    current_user = Depends(get_current_user),
):
    """Get the current user and verify they are a volunteer (non-admin)."""
    from app.models.user import UserRole
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Volunteer access required"
        )
    return current_user


def require_roles(*roles):
    """
    Dependency factory to require specific roles.
    Usage: @router.get("/", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.CONTRIBUTOR))])
    """
    async def role_checker(current_user = Depends(get_current_user)):
        from app.models.user import UserRole
        
        if current_user.role == UserRole.ADMIN:
            return current_user
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join([r.value for r in roles])}"
            )
        return current_user
    return role_checker
