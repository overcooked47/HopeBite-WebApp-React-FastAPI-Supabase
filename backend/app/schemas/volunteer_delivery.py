from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.volunteer_delivery import DeliveryStatus


class DeliveryBase(BaseModel):
    donation_id: int
    food_request_id: Optional[int] = None
    
    
    pickup_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_notes: Optional[str] = None
    
    
    delivery_address: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_notes: Optional[str] = None
    
    
    estimated_delivery_time: Optional[datetime] = None


class DeliveryCreate(DeliveryBase):
    volunteer_id: Optional[int] = None  


class DeliveryAssign(BaseModel):
    """Schema for admin to assign delivery to a volunteer"""
    donation_id: int
    volunteer_id: str  
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    notes: Optional[str] = None


class DeliveryLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class DeliveryPickupConfirmation(BaseModel):
    pickup_confirmation_image: str
    notes: Optional[str] = None


class DeliveryConfirmation(BaseModel):
    delivery_confirmation_image: str
    additional_images: Optional[List[str]] = None
    notes: Optional[str] = None


class DeliveryResponse(BaseModel):
    id: int
    volunteer_id: str  
    donation_id: int
    food_request_id: Optional[int]
    status: DeliveryStatus
    
    
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    last_location_update: Optional[datetime]
    
    
    pickup_address: Optional[str]
    pickup_latitude: Optional[float]
    pickup_longitude: Optional[float]
    picked_up_at: Optional[datetime]
    pickup_confirmation_image: Optional[str]
    pickup_notes: Optional[str]
    
    
    delivery_address: Optional[str]
    delivery_latitude: Optional[float]
    delivery_longitude: Optional[float]
    delivered_at: Optional[datetime]
    delivery_confirmation_image: Optional[str]
    delivery_notes: Optional[str]
    
    
    recipient_confirmed: bool
    recipient_confirmation_at: Optional[datetime]
    
    
    estimated_delivery_time: Optional[datetime]
    assigned_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DeliveryListResponse(BaseModel):
    items: List[DeliveryResponse]
    total: int
    page: int
    size: int
    pages: int


class VolunteerStats(BaseModel):
    total_deliveries: int
    completed_deliveries: int
    in_progress_deliveries: int
    average_delivery_time_minutes: Optional[float]
