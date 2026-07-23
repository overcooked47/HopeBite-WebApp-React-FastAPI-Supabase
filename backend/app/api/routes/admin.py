from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_active_admin
import app.services.user_service as user_service
from app.services.donation_service import DonationService
from app.services.zakat_service import ZakatService
from app.services.food_request_service import FoodRequestService
from app.services.volunteer_delivery_service import VolunteerDeliveryService
from app.services.receipt_service import ReceiptService
from app.services.claim_service import ClaimService
from app.services.notification_service import NotificationService
from app.schemas.user import UserResponse, AdminUserUpdate
from app.schemas.donation import DonationListResponse
from app.schemas.zakat import ZakatDonationListResponse, ZakatStats
from app.schemas.volunteer_delivery import DeliveryListResponse, DeliveryAssign, DeliveryResponse
from app.schemas.receipt import ReceiptListResponse
from app.schemas.claim import ClaimListResponse, ClaimResponse
from app.models.user import User, UserRole, UserType
from app.models.donation import DonationStatus
from app.models.volunteer_delivery import DeliveryStatus
from app.models.claim import ClaimStatus
from app.models.zakat import ZakatStatus
from app.models.notification import NotificationType

router = APIRouter(tags=["Admin"])




@router.get("/users", response_model=dict)
async def list_all_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    role: Optional[UserRole] = None,
    user_type: Optional[UserType] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """List all users with filters (Admin only)."""

    
    users, total = await user_service.get_all_users(
        page=page,
        size=size,
        role=role,
        user_type=user_type,
        is_active=is_active,
        search=search,
    )
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
    }


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get a specific user by ID (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: AdminUserUpdate,
    current_admin: User = Depends(get_current_active_admin),
):
    """Update a user (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated_user = await user_service.admin_update(user, user_data)
    return updated_user


@router.post("/users/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
):
    """Activate a user account (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    activated_user = await user_service.activate(user)
    return activated_user


@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
):
    """Deactivate a user account (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    deactivated_user = await user_service.deactivate(user)
    return deactivated_user


@router.post("/users/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
):
    """Verify a user's email/account (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    verified_user = await user_service.verify_email(user)
    return verified_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
):
    """Delete a user (Admin only)."""

    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        await user_service.delete_user(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )




@router.get("/zakat/all", response_model=ZakatDonationListResponse)
async def list_all_zakat_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_active_admin),
):
    """Get all zakat donations (Admin only)."""
    zakat_service = ZakatService()
    
    donations, total, total_amount = await zakat_service.get_all_donations(
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


@router.get("/zakat/stats", response_model=ZakatStats)
async def get_zakat_stats(
    current_admin: User = Depends(get_current_active_admin),
):
    """Get zakat collection statistics (Admin only)."""
    zakat_service = ZakatService()
    return await zakat_service.get_platform_stats()




@router.get("/deliveries", response_model=DeliveryListResponse)
async def list_all_deliveries(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[DeliveryStatus] = None,
    volunteer_id: Optional[int] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get all deliveries (Admin only)."""
    delivery_service = VolunteerDeliveryService()
    
    deliveries, total = await delivery_service.get_all_deliveries(
        page=page,
        size=size,
        status=status,
        volunteer_id=volunteer_id,
    )
    
    return DeliveryListResponse(
        items=deliveries,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.post("/deliveries/assign", response_model=DeliveryResponse)
async def assign_delivery_to_volunteer(
    assign_data: DeliveryAssign,
    current_admin: User = Depends(get_current_active_admin),
):
    """Assign a delivery to a volunteer (Admin only)."""
    delivery_service = VolunteerDeliveryService()
    donation_service = DonationService()

    
    
    volunteer = await user_service.get_by_id(assign_data.volunteer_id)
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )
    if volunteer.role != UserRole.VOLUNTEER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a volunteer"
        )
    
    
    donation = await donation_service.get_by_id(assign_data.donation_id)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    
    existing_delivery = await delivery_service.get_by_donation_id(assign_data.donation_id)
    if existing_delivery:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery already assigned for this donation"
        )
    
    
    delivery = await delivery_service.assign_delivery(assign_data)
    
    
    await donation_service.update_status(donation, DonationStatus.ASSIGNED_TO_VOLUNTEER)
    
    
    await delivery_service.notify_volunteer_new_assignment(delivery, donation)
    
    return delivery


@router.get("/deliveries/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery(
    delivery_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get a specific delivery (Admin only)."""
    delivery_service = VolunteerDeliveryService()
    delivery = await delivery_service.get_by_id(delivery_id)
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    return delivery




@router.get("/food-listings", response_model=DonationListResponse)
async def list_all_food_donations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[DonationStatus] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get all food donations/listings (Admin only)."""
    donation_service = DonationService()
    
    donations, total = await donation_service.get_list(
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




@router.get("/receipts", response_model=ReceiptListResponse)
async def list_all_receipts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    is_verified: Optional[bool] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get all donation receipts (Admin only)."""
    receipt_service = ReceiptService()
    
    receipts, total = await receipt_service.get_all_receipts(
        page=page,
        size=size,
        is_verified=is_verified,
    )
    
    return ReceiptListResponse(
        items=receipts,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.post("/receipts/{receipt_id}/verify")
async def verify_receipt(
    receipt_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Verify a donation receipt (Admin only)."""
    receipt_service = ReceiptService()
    receipt = await receipt_service.get_by_id(receipt_id)
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    verified_receipt = await receipt_service.verify_receipt(receipt, current_admin.id)
    return verified_receipt




@router.get("/dashboard")
async def get_admin_dashboard(
    current_admin: User = Depends(get_current_active_admin),
):
    """Get admin dashboard statistics."""

    zakat_service = ZakatService()
    donation_service = DonationService()
    
    
    contributors, contrib_total = await user_service.get_contributors(page=1, size=1)
    recipients, recip_total = await user_service.get_recipients(page=1, size=1)
    volunteers, vol_total = await user_service.get_volunteers(page=1, size=1)
    
    
    zakat_stats = await zakat_service.get_platform_stats()
    
    return {
        "users": {
            "total_contributors": contrib_total,
            "total_recipients": recip_total,
            "total_volunteers": vol_total,
        },
        "zakat": {
            "total_donations": zakat_stats.total_donations,
            "total_amount": zakat_stats.total_amount,
            "currency": zakat_stats.currency,
        },
    }




@router.get("/food-requests", response_model=ClaimListResponse)
async def list_all_food_requests(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[ClaimStatus] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """
    Get all food requests (claims) with recipient and donation details (Admin only).
    Shows recipient name, organization, and requested food.
    """
    claim_service = ClaimService()
    
    claims, total = await claim_service.get_all_claims(
        page=page,
        size=size,
        status=status,
    )
    
    return ClaimListResponse(
        items=claims,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/food-requests/{claim_id}", response_model=ClaimResponse)
async def get_food_request_detail(
    claim_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get detailed food request information (Admin only)."""
    claim_service = ClaimService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    return claim


@router.post("/food-requests/{claim_id}/approve", response_model=ClaimResponse)
async def admin_approve_food_request(
    claim_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """
    Approve a food request (Admin only).
    Sends notification to recipient saying their request was approved.
    """
    claim_service = ClaimService()
    donation_service = DonationService()
    notification_service = NotificationService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Food request is not in pending status"
        )
    
    
    claim = await claim_service.approve(claim)
    
    
    await donation_service.update_status(claim.donation, DonationStatus.CLAIMED)
    
    
    await notification_service.notify_food_request_approved(
        recipient_id=claim.claimer_id,
        donation_title=claim.donation.title if claim.donation else "food",
        claim_id=claim.id,
    )
    
    return claim


@router.post("/food-requests/{claim_id}/reject", response_model=ClaimResponse)
async def admin_reject_food_request(
    claim_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Reject a food request (Admin only)."""
    claim_service = ClaimService()
    donation_service = DonationService()
    notification_service = NotificationService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Food request is not in pending status"
        )
    
    
    claim = await claim_service.reject(claim)
    
    
    pending_claims, _ = await claim_service.get_claims_for_donation(
        donation_id=claim.donation_id,
        status=ClaimStatus.PENDING,
    )
    if not pending_claims:
        await donation_service.update_status(claim.donation, DonationStatus.AVAILABLE)
    
    
    await notification_service.notify_claim_rejected(
        claimer_id=claim.claimer_id,
        donation_title=claim.donation.title if claim.donation else "food",
        claim_id=claim.id,
    )
    
    return claim




@router.get("/zakat-requests", response_model=dict)
async def list_all_zakat_requests(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get all zakat requests with requester info (Admin only)."""
    zakat_service = ZakatService()
    
    requests, total, total_needed, total_received = await zakat_service.get_all_zakat_requests(
        page=page,
        size=size,
        status=status,
    )
    
    return {
        "items": requests,
        "total": total,
        "total_amount_needed": total_needed,
        "total_amount_received": total_received,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
    }


@router.get("/zakat-requests/{request_id}")
async def get_zakat_request_by_id(
    request_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Get a specific zakat request by ID (Admin only)."""
    zakat_service = ZakatService()
    
    request = await zakat_service.get_zakat_request_with_requester(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zakat request not found"
        )
    
    return request


@router.post("/zakat-requests/{request_id}/approve")
async def admin_approve_zakat_request(
    request_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """
    Approve a zakat request (Admin only).
    Once approved, the request becomes visible to contributors in Donate Zakat.
    """
    zakat_service = ZakatService()
    notification_service = NotificationService()
    
    request = await zakat_service.get_zakat_request_by_id(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zakat request not found"
        )
    
    if request.status != ZakatStatus.PENDING.value and request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zakat request is not in pending status"
        )
    
    
    updated_request = await zakat_service.approve_zakat_request(request_id)
    
    
    await notification_service.create_notification(
        user_id=request.requester_id,
        notification_type=NotificationType.ZAKAT_REQUEST_APPROVED,
        title="Your zakat request was approved.",
        message=f"Your zakat request '{request.title}' has been approved. Contributors can now see your request and donate.",
        related_type="zakat_request",
        related_id=request_id,
        action_url="/zakat",
    )
    
    return updated_request


@router.post("/zakat-requests/{request_id}/reject")
async def admin_reject_zakat_request(
    request_id: int,
    current_admin: User = Depends(get_current_active_admin),
):
    """Reject a zakat request (Admin only)."""
    zakat_service = ZakatService()
    notification_service = NotificationService()
    
    request = await zakat_service.get_zakat_request_by_id(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zakat request not found"
        )
    
    if request.status != ZakatStatus.PENDING.value and request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zakat request is not in pending status"
        )
    
    
    updated_request = await zakat_service.reject_zakat_request(request_id)
    
    
    await notification_service.create_notification(
        user_id=request.requester_id,
        notification_type=NotificationType.CLAIM_REJECTED,
        title="Zakat request not approved",
        message=f"Your zakat request '{request.title}' was not approved at this time.",
        related_type="zakat_request",
        related_id=request_id,
        action_url="/zakat",
    )
    
    return updated_request
