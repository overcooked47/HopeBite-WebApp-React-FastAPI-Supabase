from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType


class NotificationCreate(BaseModel):
    user_id: str  
    type: NotificationType
    title: str
    message: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    action_url: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: str  
    type: NotificationType
    title: str
    message: str
    related_type: Optional[str]
    related_id: Optional[int]
    is_read: bool
    read_at: Optional[datetime]
    action_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    size: int
    pages: int


class NotificationMarkRead(BaseModel):
    notification_ids: List[int]
