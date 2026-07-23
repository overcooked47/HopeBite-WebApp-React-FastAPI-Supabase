from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user
import app.services.user_service as user_service
from app.services.donation_service import DonationService
from app.services.food_request_service import FoodRequestService
from app.services.zakat_service import ZakatService
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.schemas.donation import DonationListResponse
from app.schemas.food_request import FoodRequestListResponse
from app.schemas.zakat import ZakatDonationListResponse, ZakatRequestResponse
from app.models.user import User

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update current user profile."""
    updated_user = await user_service.update(current_user, user_data)
    return updated_user


@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
):
    """Change current user password."""
    
   
    if not await user_service.verify_password(current_user, password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    
    await user_service.update_password(current_user, password_data.new_password)
    
    return {"message": "Password updated successfully"}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str, 
    current_user: User = Depends(get_current_user),
):
    """Get user by ID (public profile info)."""
    
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/me")
async def deactivate_account(
    current_user: User = Depends(get_current_user),
):
    """Deactivate current user account."""
    await user_service.deactivate(current_user)
    
    return {"message": "Account deactivated successfully"}




@router.get("/me/donation-history", response_model=DonationListResponse)
async def get_my_donation_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get current user's donation history (for contributors)."""
    donation_service = DonationService()
    
    donations, total = await donation_service.get_user_donations(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return DonationListResponse(
        items=donations,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/me/food-request-history", response_model=FoodRequestListResponse)
async def get_my_food_request_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get current user's food request history (for recipients)."""
    food_request_service = FoodRequestService()
    
    requests, total = await food_request_service.get_user_requests(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return FoodRequestListResponse(
        items=requests,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/me/zakat-donation-history", response_model=ZakatDonationListResponse)
async def get_my_zakat_donation_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get current user's zakat donation history."""
    zakat_service = ZakatService()
    
    donations, total, total_amount = await zakat_service.get_user_donations(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return ZakatDonationListResponse(
        items=donations,
        total=total,
        total_amount=total_amount,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )
