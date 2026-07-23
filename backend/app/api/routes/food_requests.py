
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import math
import logging


from app.core.security import get_current_user, get_current_recipient
from app.services.food_request_service import FoodRequestService
from app.schemas.food_request import (
    FoodRequestCreate,
    FoodRequestUpdate,
    FoodRequestResponse,
    FoodRequestListResponse,
)
from app.models.user import User, UserRole
from app.models.food_request import FoodRequestStatus, FoodRequestUrgency

router = APIRouter(tags=["Food Requests"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=FoodRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_food_request(
    request_data: FoodRequestCreate,
    current_user: User = Depends(get_current_recipient),
):
    """
    Create a new food request (Recipient only).
    When created, notifications are sent to Admin and Contributors.
    """
    logger.info(f"Creating food request for user {current_user.id} ({current_user.email})")
    
    food_request_service = FoodRequestService()
    
    try:
        
        food_request = await food_request_service.create(request_data, current_user.id)
        logger.info(f"Successfully created food request {food_request.id}")
        
        
        await food_request_service.notify_requester_submitted(food_request)
        
        
        await food_request_service.notify_admins_and_contributors(
            food_request,
            current_user.full_name,
        )
        
        
        food_request = await food_request_service.get_by_id(food_request.id)
        
        return food_request
        
    except Exception as e:
        logger.error(f"Error creating food request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create food request: {str(e)}"
        )


@router.get("/my", response_model=FoodRequestListResponse)
async def list_my_requests(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    request_status: Optional[FoodRequestStatus] = None,
    current_user: User = Depends(get_current_user),
):
    """Get current user's food requests."""
    logger.info(f"Fetching requests for user {current_user.id} ({current_user.email})")
    logger.info(f"Parameters - page: {page}, size: {size}, status: {request_status}")
    
    food_request_service = FoodRequestService()
    
    try:
        requests, total = await food_request_service.get_user_requests(
            user_id=current_user.id,
            page=page,
            size=size,
            status=request_status,
        )
        
        logger.info(f"Found {total} total requests, returning {len(requests)} for page {page}")
        
        
        request_ids = [r.id for r in requests]
        logger.info(f"Request IDs: {request_ids}")
        
        pages = math.ceil(total / size) if total > 0 else 0
        
        return FoodRequestListResponse(
            items=requests,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )
        
    except Exception as e:
        logger.error(f"Error fetching user requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch requests: {str(e)}"
        )


@router.get("/", response_model=FoodRequestListResponse)
async def list_food_requests(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    request_status: Optional[FoodRequestStatus] = None,
    city: Optional[str] = None,
    urgency: Optional[FoodRequestUrgency] = None,
    current_user: User = Depends(get_current_user),
):
    """
    List all food requests.
    Contributors can see where food is needed.
    """
    food_request_service = FoodRequestService()
    
    requests, total = await food_request_service.get_all_requests(
        page=page,
        size=size,
        status=request_status,
        city=city,
        urgency=urgency.value if urgency else None,
    )
    
    return FoodRequestListResponse(
        items=requests,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/pending", response_model=FoodRequestListResponse)
async def list_pending_requests(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    city: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    List pending food requests (for Contributors to see where food is needed).
    """
    food_request_service = FoodRequestService()
    
    requests, total = await food_request_service.get_pending_requests(
        page=page,
        size=size,
        city=city,
    )
    
    return FoodRequestListResponse(
        items=requests,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/{request_id}", response_model=FoodRequestResponse)
async def get_food_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific food request by ID."""
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    return food_request


@router.put("/{request_id}", response_model=FoodRequestResponse)
async def update_food_request(
    request_id: int,
    request_data: FoodRequestUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a food request (owner or admin only)."""
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    
    if food_request.requester_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this food request"
        )
    
    updated_request = await food_request_service.update(food_request, request_data)
    return updated_request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a food request (owner or admin only)."""
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    
    if food_request.requester_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this food request"
        )
    
    await food_request_service.delete(food_request)


@router.post("/{request_id}/cancel", response_model=FoodRequestResponse)
async def cancel_food_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Cancel a food request."""
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    
    if food_request.requester_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this food request"
        )
    
    updated_request = await food_request_service.update_status(
        food_request,
        FoodRequestStatus.CANCELLED
    )
    return updated_request


@router.post("/{request_id}/approve", response_model=FoodRequestResponse)
async def approve_food_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Approve a food request (Contributor only)."""
    logger.info(f"Approve endpoint called for request {request_id} by user {current_user.id} (role: {current_user.role})")
    
    
    if current_user.role != UserRole.CONTRIBUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only contributors can approve food requests"
        )
    
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    logger.info(f"Fetched food request: {food_request}")
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    if food_request.status != FoodRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Food request is already {food_request.status.value}"
        )
    
    logger.info(f"Updating status for request {request_id}, requester_id: {food_request.requester_id}")
    
    updated_request = await food_request_service.update_status(
        food_request,
        FoodRequestStatus.APPROVED
    )
    
    logger.info(f"Updated request status. Now calling notify_requester_approved for request {request_id}")
    
    
    await food_request_service.notify_requester_approved(
        updated_request,
        current_user.full_name
    )
    
    logger.info(f"Food request {request_id} approved by contributor {current_user.id}. Notification sent.")
    return updated_request


@router.post("/{request_id}/reject", response_model=FoodRequestResponse)
async def reject_food_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
):
    """Reject/Decline a food request (Contributor only)."""
    logger.info(f"Reject endpoint called for request {request_id} by user {current_user.id} (role: {current_user.role})")
    
    
    if current_user.role != UserRole.CONTRIBUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only contributors can reject food requests"
        )
    
    food_request_service = FoodRequestService()
    
    food_request = await food_request_service.get_by_id(request_id)
    
    if not food_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food request not found"
        )
    
    if food_request.status != FoodRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Food request is already {food_request.status.value}"
        )
    
    logger.info(f"Updating status for request {request_id} to REJECTED, requester_id: {food_request.requester_id}")
    
    updated_request = await food_request_service.update_status(
        food_request,
        FoodRequestStatus.REJECTED
    )
    
    
    await food_request_service.notify_requester_rejected(
        updated_request,
        current_user.full_name
    )
    
    logger.info(f"Food request {request_id} rejected by contributor {current_user.id}. Notification sent.")
    return updated_request