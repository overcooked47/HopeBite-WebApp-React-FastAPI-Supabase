from typing import Optional
import math
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query


from app.core.security import get_current_user, get_current_contributor
from app.services.donation_service import DonationService
import app.services.user_service as user_service
from app.services.notification_service import NotificationService
from app.services.receipt_service import ReceiptService
from app.schemas.donation import (
    DonationCreate,
    DonationUpdate,
    DonationResponse,
    DonationListResponse,
    DonationFilter,
)
from app.models.user import User, UserRole
from app.models.donation import DonationStatus, FoodCategory

router = APIRouter(tags=["Donations"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
    donation_data: DonationCreate,
    current_user: User = Depends(get_current_contributor),
):
    """Create a new food donation. Contributors only."""
    logger.info(f"Creating donation for user {current_user.id}")
    donation_service = DonationService()

    try:
        donation = await donation_service.create(donation_data, current_user.id)
        logger.info(f"Donation created with ID: {donation.id}")
        
        await user_service.increment_donation_stats(
            current_user,
            donations_count=1,
            meals_count=donation_data.quantity,
            points=donation_data.quantity * 10,
        )
        
        
        await donation_service.notify_admins_and_recipients_donation_created(
            donation,
            current_user.full_name,
        )
        
        
        donation = await donation_service.get_by_id(donation.id)
        logger.info(f"Returning donation: {donation}")
        
        return donation
    except Exception as e:
        logger.error(f"Error creating donation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create donation: {str(e)}"
        )


@router.get("/", response_model=DonationListResponse)
async def list_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category: Optional[FoodCategory] = None,
    city: Optional[str] = None,
    status: Optional[DonationStatus] = None,
    is_vegetarian: Optional[bool] = None,
    is_vegan: Optional[bool] = None,
    is_halal: Optional[bool] = None,
    search: Optional[str] = None,
):
    """List all donations with filters."""
    donation_service = DonationService()
    
    filters = DonationFilter(
        category=category,
        city=city,
        status=status,
        is_vegetarian=is_vegetarian,
        is_vegan=is_vegan,
        is_halal=is_halal,
        search=search,
    )
    
    donations, total = await donation_service.get_list(
        filters=filters,
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


@router.get("/available", response_model=DonationListResponse)
async def list_available_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    city: Optional[str] = None,
    category: Optional[FoodCategory] = None,
):
    """List available donations for recipients."""
    donation_service = DonationService()
    
    donations, total = await donation_service.get_available_donations(
        city=city,
        category=category,
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


@router.get("/my", response_model=DonationListResponse)
async def list_my_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[DonationStatus] = None,
    current_user: User = Depends(get_current_contributor),
):
    """List current contributor's donations."""
    donation_service = DonationService()
    
    donations, total = await donation_service.get_user_donations(
        user_id=current_user.id,
        status=status,
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


@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(
    donation_id: int,
):
    """Get a specific donation by ID."""
    donation_service = DonationService()
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    return donation


@router.put("/{donation_id}", response_model=DonationResponse)
async def update_donation(
    donation_id: int,
    donation_data: DonationUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a donation."""
    donation_service = DonationService()
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    if current_user.role != UserRole.ADMIN and donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this donation"
        )
    
    updated_donation = await donation_service.update(donation, donation_data)
    
    return updated_donation


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donation(
    donation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a donation."""
    donation_service = DonationService()
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    if current_user.role != UserRole.ADMIN and donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this donation"
        )

    if donation.status in [DonationStatus.RESERVED, DonationStatus.CLAIMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete donation with active claims"
        )
    
    await donation_service.delete(donation)


@router.post("/{donation_id}/cancel", response_model=DonationResponse)
async def cancel_donation(
    donation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Cancel a donation."""
    donation_service = DonationService()
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    if current_user.role != UserRole.ADMIN and donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this donation"
        )
    
    updated_donation = await donation_service.update_status(donation, DonationStatus.CANCELLED)
    
    return updated_donation


@router.get("/{donation_id}/stats")
async def get_donation_stats(
    donation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get donation statistics."""
    donation_service = DonationService()
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    if current_user.role != UserRole.ADMIN and donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view stats for this donation"
        )
    
    return await donation_service.get_donation_stats(current_user.id)
