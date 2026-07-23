from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_volunteer
from app.services.volunteer_delivery_service import VolunteerDeliveryService
from app.services.donation_service import DonationService
import app.services.user_service as user_service
from app.schemas.volunteer_delivery import (
    DeliveryResponse,
    DeliveryListResponse,
    DeliveryStatusUpdate,
    DeliveryLocationUpdate,
    DeliveryPickupConfirmation,
    DeliveryConfirmation,
    VolunteerStats,
)
from app.schemas.user import VolunteerLocationUpdate
from app.models.user import User
from app.models.donation import DonationStatus
from app.models.volunteer_delivery import DeliveryStatus

router = APIRouter(tags=["Volunteer"])


@router.get("/deliveries", response_model=DeliveryListResponse)
async def get_my_deliveries(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    delivery_status: Optional[DeliveryStatus] = None,
    current_user: User = Depends(get_current_volunteer),
):
    """Get deliveries assigned to current volunteer."""
    delivery_service = VolunteerDeliveryService()
    
    deliveries, total = await delivery_service.get_volunteer_deliveries(
        volunteer_id=current_user.id,
        page=page,
        size=size,
        status=delivery_status,
    )
    
    return DeliveryListResponse(
        items=deliveries,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/deliveries/active", response_model=list)
async def get_active_deliveries(
    current_user: User = Depends(get_current_volunteer),
):
    """Get active (in-progress) deliveries for current volunteer."""
    delivery_service = VolunteerDeliveryService()
    
    deliveries = await delivery_service.get_active_deliveries(current_user.id)
    return [DeliveryResponse.model_validate(d) for d in deliveries]


@router.get("/deliveries/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery_detail(
    delivery_id: int,
    current_user: User = Depends(get_current_volunteer),
):
    """Get details of a specific delivery."""
    delivery_service = VolunteerDeliveryService()
    
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    
    if delivery.volunteer_id != current_user.id and not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this delivery"
        )
    
    return delivery


@router.put("/deliveries/{delivery_id}/status", response_model=DeliveryResponse)
async def update_delivery_status(
    delivery_id: int,
    status_update: DeliveryStatusUpdate,
    current_user: User = Depends(get_current_volunteer),
):
    """Update delivery status (picked_up, in_transit, delivered, etc.)."""
    delivery_service = VolunteerDeliveryService()
    donation_service = DonationService()
    
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this delivery"
        )
    
    
    updated_delivery = await delivery_service.update_status(delivery, status_update)
    
    
    donation = await donation_service.get_by_id(delivery.donation_id)
    if donation:
        if status_update.status == DeliveryStatus.IN_TRANSIT:
            await donation_service.update_status(donation, DonationStatus.IN_TRANSIT)
        elif status_update.status == DeliveryStatus.DELIVERED:
            await donation_service.update_status(donation, DonationStatus.DELIVERED)
            
            await delivery_service.notify_contributor_delivery_complete(updated_delivery, donation)
    
    return updated_delivery


@router.post("/deliveries/{delivery_id}/location", response_model=DeliveryResponse)
async def update_location(
    delivery_id: int,
    location: DeliveryLocationUpdate,
    current_user: User = Depends(get_current_volunteer),
):
    """Update current location during delivery."""
    delivery_service = VolunteerDeliveryService()

    
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this delivery"
        )
    
    
    updated_delivery = await delivery_service.update_location(
        delivery,
        location.latitude,
        location.longitude,
    )
    
    
    await user_service.update_location(current_user, location.latitude, location.longitude)
    
    return updated_delivery


@router.post("/deliveries/{delivery_id}/pickup-confirmation", response_model=DeliveryResponse)
async def confirm_pickup(
    delivery_id: int,
    confirmation: DeliveryPickupConfirmation,
    current_user: User = Depends(get_current_volunteer),
):
    """Confirm pickup with image."""
    delivery_service = VolunteerDeliveryService()
    
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this delivery"
        )
    
    updated_delivery = await delivery_service.confirm_pickup(delivery, confirmation)
    return updated_delivery


@router.post("/deliveries/{delivery_id}/delivery-confirmation", response_model=DeliveryResponse)
async def confirm_delivery(
    delivery_id: int,
    confirmation: DeliveryConfirmation,
    current_user: User = Depends(get_current_volunteer),
):
    """Confirm delivery with image (required)."""
    delivery_service = VolunteerDeliveryService()
    donation_service = DonationService()

    
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    if delivery.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this delivery"
        )
    
    
    updated_delivery = await delivery_service.confirm_delivery(delivery, confirmation)
    
    
    donation = await donation_service.get_by_id(delivery.donation_id)
    if donation:
        donation.delivery_confirmation_image = confirmation.delivery_confirmation_image
        donation.delivered_at = updated_delivery.delivered_at
        await donation_service.update_status(donation, DonationStatus.DELIVERED)
        
        
        await delivery_service.notify_contributor_delivery_complete(updated_delivery, donation)
    
    
    await user_service.increment_delivery_stats(current_user, count=1, points=50)
    
    return updated_delivery


@router.post("/location", response_model=dict)
async def update_my_location(
    location: VolunteerLocationUpdate,
    current_user: User = Depends(get_current_volunteer),
):
    """Update volunteer's current location."""

    
    await user_service.update_location(current_user, location.latitude, location.longitude)
    
    return {"message": "Location updated successfully"}


@router.get("/stats", response_model=VolunteerStats)
async def get_my_stats(
    current_user: User = Depends(get_current_volunteer),
):
    """Get delivery statistics for current volunteer."""
    delivery_service = VolunteerDeliveryService()
    
    stats = await delivery_service.get_delivery_stats(current_user.id)
    
    return VolunteerStats(
        total_deliveries=stats["total_deliveries"],
        completed_deliveries=stats["completed_deliveries"],
        in_progress_deliveries=stats["in_progress_deliveries"],
        average_delivery_time_minutes=None,  
    )
