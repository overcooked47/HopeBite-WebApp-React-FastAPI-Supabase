from enum import Enum
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class FoodClaim(BaseModel):
    id: int
    donation_id: int
    claimer_id: str  
    quantity_claimed: int = 1
    notes: Optional[str] = None
    status: ClaimStatus = ClaimStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    pickup_scheduled_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    pickup_confirmation_image: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    
    donation: Optional[Any] = None 
    claimer: Optional[Any] = None

    class Config:
        from_attributes = True
