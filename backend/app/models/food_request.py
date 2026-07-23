from enum import Enum
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.donation import FoodCategory

class FoodRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    FULFILLED = "fulfilled"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class FoodRequestUrgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FoodRequest(BaseModel):
    id: int
    requester_id: str  
    title: str
    description: Optional[str] = None
    category: Optional[FoodCategory] = None
    quantity_needed: int = 1
    unit: str = "servings"
    
    
    delivery_address: str = ""
    city: str = ""
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    
    needed_by: Optional[datetime] = None
    urgency: FoodRequestUrgency = FoodRequestUrgency.MEDIUM
    
    
    beneficiaries_count: int = 1
    requires_vegetarian: bool = False
    requires_vegan: bool = False
    requires_halal: bool = False
    requires_gluten_free: bool = False
    
    images: Optional[str] = None  
    status: FoodRequestStatus = FoodRequestStatus.PENDING
    quantity_fulfilled: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    fulfilled_at: Optional[datetime] = None
    expired_at: Optional[datetime] = None

    
    requester: Optional[Any] = None

    class Config:
        from_attributes = True
        extra = "ignore"
