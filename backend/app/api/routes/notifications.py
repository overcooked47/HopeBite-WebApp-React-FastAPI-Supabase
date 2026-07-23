from fastapi import APIRouter, Depends, HTTPException, status, Query
import math


from app.core.security import get_current_user
from app.services.notification_service import NotificationService
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationMarkRead,
)
from app.models.user import User

router = APIRouter(tags=["Notifications"])


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """List user's notifications."""
    notification_service = NotificationService()
    
    notifications, total, unread_count = await notification_service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        page=page,
        size=size,
    )
    
    return NotificationListResponse(
        items=notifications,
        total=total,
        unread_count=unread_count,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
):
    """Get count of unread notifications."""
    notification_service = NotificationService()
    
    _, _, unread_count = await notification_service.get_user_notifications(
        user_id=current_user.id,
        page=1,
        size=1,
    )
    
    return {"unread_count": unread_count}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a specific notification."""
    notification_service = NotificationService()
    
    notification = await notification_service.get_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
  
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this notification"
        )
    
    return notification


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notification_service = NotificationService()
    
    notification = await notification_service.get_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
   
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this notification"
        )
    
    notification = await notification_service.mark_as_read(notification)
    
    return notification


@router.post("/mark-read")
async def mark_multiple_read(
    mark_data: NotificationMarkRead,
    current_user: User = Depends(get_current_user),
):
    """Mark multiple notifications as read."""
    notification_service = NotificationService()
    
    count = await notification_service.mark_multiple_as_read(
        notification_ids=mark_data.notification_ids,
        user_id=current_user.id,
    )
    
    return {"marked_count": count}


@router.post("/mark-all-read")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    notification_service = NotificationService()
    
    count = await notification_service.mark_all_as_read(current_user.id)
    
    return {"marked_count": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a notification."""
    notification_service = NotificationService()
    
    notification = await notification_service.get_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
   
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )
    
    await notification_service.delete(notification)
