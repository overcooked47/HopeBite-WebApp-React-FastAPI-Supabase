from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user, get_current_recipient
from app.services.award_service import AwardService
import app.services.user_service as user_service
from app.schemas.award import AwardCreate, AwardResponse, AwardListResponse
from app.models.user import User, UserRole

router = APIRouter(tags=["Awards"])


@router.post("/", response_model=AwardResponse, status_code=status.HTTP_201_CREATED)
async def create_award(
    award_data: AwardCreate,
    current_user: User = Depends(get_current_recipient),
):
    """
    Give an award to a contributor or volunteer (Recipient only).
    Recipients can give points/awards to thank donors.
    """
    award_service = AwardService()

    
    
    receiver = await user_service.get_by_id(award_data.receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    
    if receiver.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot give award to yourself"
        )
    
    
    award = await award_service.create(award_data, current_user.id)
    
    
    if award_data.points > 0:
        await user_service.add_points(receiver, award_data.points)
    
    
    await award_service.notify_award_received(award, current_user.full_name)
    
    return award


@router.get("/received", response_model=AwardListResponse)
async def get_my_received_awards(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get awards received by current user."""
    award_service = AwardService()
    
    awards, total = await award_service.get_user_received_awards(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return AwardListResponse(
        items=awards,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/given", response_model=AwardListResponse)
async def get_my_given_awards(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get awards given by current user."""
    award_service = AwardService()
    
    awards, total = await award_service.get_user_given_awards(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return AwardListResponse(
        items=awards,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/public", response_model=AwardListResponse)
async def get_public_awards(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    """Get all public awards (visible to everyone)."""
    award_service = AwardService()
    
    awards, total = await award_service.get_public_awards(
        page=page,
        size=size,
    )
    
    return AwardListResponse(
        items=awards,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/user/{user_id}", response_model=AwardListResponse)
async def get_user_awards(
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    """Get awards received by a specific user (public awards only)."""
    award_service = AwardService()

    
    
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    awards, total = await award_service.get_user_received_awards(
        user_id=user_id,
        page=page,
        size=size,
    )
    
    
    public_awards = [a for a in awards if a.is_public]
    
    return AwardListResponse(
        items=public_awards,
        total=len(public_awards),
        page=page,
        size=size,
        pages=math.ceil(len(public_awards) / size) if public_awards else 0,
    )


@router.get("/{award_id}", response_model=AwardResponse)
async def get_award(
    award_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific award."""
    award_service = AwardService()
    
    award = await award_service.get_by_id(award_id)
    
    if not award:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Award not found"
        )
    
    
    if not award.is_public:
        if award.giver_id != current_user.id and award.receiver_id != current_user.id:
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this award"
                )
    
    return award
