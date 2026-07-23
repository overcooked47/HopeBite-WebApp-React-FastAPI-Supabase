from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user
from app.services.claim_service import ClaimService
from app.services.donation_service import DonationService
from app.services.notification_service import NotificationService
import app.services.user_service as user_service
from app.schemas.claim import (
    ClaimCreate,
    ClaimResponse,
    ClaimListResponse,
    ClaimApproval,
    ClaimPickupConfirmation,
)
from app.models.user import User
from app.models.donation import DonationStatus
from app.models.claim import ClaimStatus

router = APIRouter(tags=["Claims"])


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new claim for a food donation."""
    claim_service = ClaimService()
    donation_service = DonationService()
    notification_service = NotificationService()
    
   
    donation = await donation_service.get_by_id(claim_data.donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
 
    if donation.status != DonationStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donation is not available for claiming"
        )
    
    
    if donation.donor_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot claim your own donation"
        )
    
 
    if await claim_service.has_user_claimed_donation(current_user.id, claim_data.donation_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already claimed this donation"
        )
    
 
    if claim_data.quantity_claimed > donation.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity exceeds available quantity ({donation.quantity})"
        )
    
   
    claim = await claim_service.create(claim_data, current_user.id)
    
 
    await donation_service.update_status(donation, DonationStatus.RESERVED)
    
    
    await notification_service.notify_contributors_food_requested(
        donation_title=donation.title or "Food Donation",
        requester_name=current_user.full_name or "A recipient",
        claim_id=claim.id,
        donor_id=donation.donor_id,
    )
    
    
    await notification_service.notify_admins_food_requested(
        donation_title=donation.title or "Food Donation",
        requester_name=current_user.full_name or "A recipient",
        claim_id=claim.id,
    )
    
   
    claim = await claim_service.get_by_id(claim.id)
    
    return claim


@router.get("/my", response_model=ClaimListResponse)
async def list_my_claims(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[ClaimStatus] = None,
    current_user: User = Depends(get_current_user),
):
    """List claims made by the current user."""
    claim_service = ClaimService()
    
    claims, total = await claim_service.get_user_claims(
        user_id=current_user.id,
        status=status,
        page=page,
        size=size,
    )
    
    return ClaimListResponse(
        items=claims,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/pending", response_model=ClaimListResponse)
async def list_pending_claims(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """List pending claims for the current user's donations."""
    claim_service = ClaimService()
    
    claims, total = await claim_service.get_pending_claims_for_donor(
        donor_id=current_user.id,
        page=page,
        size=size,
    )
    
    return ClaimListResponse(
        items=claims,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/donation/{donation_id}", response_model=ClaimListResponse)
async def list_claims_for_donation(
    donation_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """List claims for a specific donation (donor only)."""
    claim_service = ClaimService()
    donation_service = DonationService()
    
    
    donation = await donation_service.get_by_id(donation_id)
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
 
    if donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view claims for this donation"
        )
    
    claims, total = await claim_service.get_claims_for_donation(
        donation_id=donation_id,
        page=page,
        size=size,
    )
    
    return ClaimListResponse(
        items=claims,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific claim."""
    claim_service = ClaimService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
   
    if claim.claimer_id != current_user.id and claim.donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this claim"
        )
    
    return claim


@router.post("/{claim_id}/approve", response_model=ClaimResponse)
async def approve_claim(
    claim_id: int,
    approval: ClaimApproval,
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a claim (donor only)."""
    claim_service = ClaimService()
    donation_service = DonationService()
    notification_service = NotificationService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
   
    if claim.donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the donor can approve/reject claims"
        )
    

    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim is not in pending status"
        )
    
    if approval.approved:
      
        claim = await claim_service.approve(claim)
        await donation_service.update_status(claim.donation, DonationStatus.CLAIMED)
        
     
        await notification_service.notify_claim_approved(
            claimer_id=claim.claimer_id,
            donation_title=claim.donation.title,
            claim_id=claim.id,
        )
    else:
      
        claim = await claim_service.reject(claim)
        
       
        pending_claims, _ = await claim_service.get_claims_for_donation(
            donation_id=claim.donation_id,
            status=ClaimStatus.PENDING,
        )
        if not pending_claims:
            await donation_service.update_status(claim.donation, DonationStatus.AVAILABLE)
        
        await notification_service.notify_claim_rejected(
            claimer_id=claim.claimer_id,
            donation_title=claim.donation.title,
            claim_id=claim.id,
        )
    
    return claim


@router.post("/{claim_id}/confirm-pickup", response_model=ClaimResponse)
async def confirm_pickup(
    claim_id: int,
    confirmation: ClaimPickupConfirmation,
    current_user: User = Depends(get_current_user),
):
    """Confirm pickup of claimed food."""
    claim_service = ClaimService()
    donation_service = DonationService()

    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
   
    if claim.claimer_id != current_user.id and claim.donation.donor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to confirm pickup"
        )
    

    if claim.status != ClaimStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim must be approved before pickup can be confirmed"
        )
    
    if confirmation.confirmed:
       
        claim = await claim_service.confirm_pickup(
            claim,
            rating=confirmation.rating,
            feedback=confirmation.feedback,
        )
        
  
        await donation_service.update_status(claim.donation, DonationStatus.COMPLETED)
    
    return claim


@router.post("/{claim_id}/cancel", response_model=ClaimResponse)
async def cancel_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
):
    """Cancel a claim (claimer only)."""
    claim_service = ClaimService()
    donation_service = DonationService()
    
    claim = await claim_service.get_by_id(claim_id)
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
  
    if claim.claimer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the claimer can cancel their claim"
        )
    
   
    if claim.status not in [ClaimStatus.PENDING, ClaimStatus.APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel claim in current status"
        )

    claim = await claim_service.cancel(claim)
    
    
    pending_claims, _ = await claim_service.get_claims_for_donation(
        donation_id=claim.donation_id,
        status=ClaimStatus.PENDING,
    )
    approved_claims, _ = await claim_service.get_claims_for_donation(
        donation_id=claim.donation_id,
        status=ClaimStatus.APPROVED,
    )
    
    if not pending_claims and not approved_claims:
        await donation_service.update_status(claim.donation, DonationStatus.AVAILABLE)
    
    return claim
