from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user, get_current_contributor, get_current_recipient
from app.services.zakat_service import ZakatService
from app.services.receipt_service import ReceiptService
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType
from app.schemas.zakat import (
    ZakatDonationCreate,
    ZakatDonationResponse,
    ZakatDonationListResponse,
    ZakatStats,
    ZakatRequestCreate,
    ZakatRequestUpdate,
    ZakatRequestResponse,
)
from app.schemas.user import UserPublicResponse
from app.models.user import User, UserRole

router = APIRouter(tags=["Zakat Donations"])


@router.post("/donate", response_model=ZakatDonationResponse)
async def create_zakat_donation(
    donation_data: ZakatDonationCreate,
    current_user: User = Depends(get_current_contributor),
):
    """Create a new zakat donation record. Contributors only."""
    zakat_service = ZakatService()
    
    donation = await zakat_service.create(donation_data, current_user.id)
    
    
    if donation_data.recipient_id:
        notification_service = NotificationService()
        donor_name = current_user.full_name or current_user.email or "A generous donor"
        await notification_service.create_notification(
            user_id=donation_data.recipient_id,
            notification_type=NotificationType.ZAKAT_RECEIVED,
            title="You have received Zakat! 🎉",
            message=f"{donor_name} has donated {donation_data.amount} {donation_data.currency} zakat to you. May Allah bless you.",
            related_type="zakat_donation",
            related_id=donation.id,
            action_url="/zakat",
            is_urgent=True
        )
    
    return donation


@router.get("/my-donations", response_model=ZakatDonationListResponse)
async def get_my_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_contributor),
):
    """Get current contributor's zakat donation history."""
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


@router.get("/received", response_model=ZakatDonationListResponse)
async def get_received_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_recipient),
):
    """Get zakat donations received by the current recipient."""
    zakat_service = ZakatService()
    
    donations, total, total_amount = await zakat_service.get_received_donations(
        recipient_id=current_user.id,
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


@router.get("/my-stats", response_model=ZakatStats)
async def get_my_stats(
    current_user: User = Depends(get_current_contributor),
):
    """Get current contributor's zakat donation statistics."""
    zakat_service = ZakatService()
    return await zakat_service.get_user_stats(current_user.id)


@router.get("/stats", response_model=ZakatStats)
async def get_platform_stats(
):
    """Get overall platform zakat donation statistics (public)."""
    zakat_service = ZakatService()
    return await zakat_service.get_platform_stats()


@router.get("/available-recipients", response_model=list)
async def get_available_recipients(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get list of approved zakat applicants (recipients who have admin-approved zakat requests)."""
    
    if current_user.role not in [UserRole.CONTRIBUTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only contributors and admins can view zakat applicants"
        )
    
    zakat_service = ZakatService()
    
    
    approved_requests, _ = await zakat_service.get_approved_zakat_requests(page=page, size=size)
    
    
    applicants = []
    seen_ids = set()
    for req in approved_requests:
        requester = req.get("requester")
        if requester and requester.get("id") not in seen_ids:
            seen_ids.add(requester.get("id"))
            applicants.append({
                "id": requester.get("id"),
                "full_name": requester.get("full_name") or "Zakat Applicant",
                "email": requester.get("email"),
                "organization_name": requester.get("organization_name"),
                "request_title": req.get("title"),
                "amount_needed": req.get("amount_needed"),
                "status": req.get("status"),
            })
    
    return applicants



@router.post("/requests", response_model=ZakatRequestResponse)
async def create_zakat_request(
    request_data: ZakatRequestCreate,
    current_user: User = Depends(get_current_recipient),
):
    """Create a new zakat request. Recipients only."""
    zakat_service = ZakatService()
    
    zakat_request = await zakat_service.create_zakat_request(
        request_data=request_data,
        requester_id=current_user.id,
    )
    
    
    await zakat_service.notify_admins_and_contributors_zakat_request(
        zakat_request=zakat_request,
        requester_name=current_user.full_name,
    )
    
    return zakat_request


@router.get("/requests/{request_id}", response_model=ZakatRequestResponse)
async def get_zakat_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific zakat request."""
    zakat_service = ZakatService()
    
    zakat_request = await zakat_service.get_zakat_request_by_id(request_id)
    
    if not zakat_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zakat request not found"
        )
    
    return zakat_request


@router.get("/{donation_id}", response_model=ZakatDonationResponse)
async def get_donation(
    donation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific zakat donation."""
    zakat_service = ZakatService()
    
    donation = await zakat_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    if current_user.role != UserRole.ADMIN and donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this donation"
        )
    
    return donation


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donation(
    donation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a zakat donation record."""
    zakat_service = ZakatService()
    
    donation = await zakat_service.get_by_id(donation_id)
    
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
    
    await zakat_service.delete(donation)
