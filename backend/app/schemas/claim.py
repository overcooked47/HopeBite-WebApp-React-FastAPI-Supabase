from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.claim import ClaimStatus
from app.schemas.user import UserPublicResponse


class DonationSummary(BaseModel):
    """Summary of donation for claim responses"""
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    quantity_unit: str = "servings"
    city: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class ClaimBase(BaseModel):
    quantity_claimed: int = Field(..., gt=0, alias="quantity_requested")
    notes: Optional[str] = Field(None, alias="message")
    
    class Config:
        populate_by_name = True


class ClaimCreate(BaseModel):
    donation_id: int
    quantity_claimed: int = Field(default=1, gt=0, alias="quantity_requested")
    notes: Optional[str] = Field(None, alias="message")
    
    class Config:
        populate_by_name = True
    
    def to_db_dict(self):
        """Convert to database column names"""
        return {
            "donation_id": self.donation_id,
            "quantity_claimed": self.quantity_claimed,
            "notes": self.notes,
        }


class ClaimUpdate(BaseModel):
    status: Optional[ClaimStatus] = None
    pickup_time: Optional[datetime] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None


class ClaimResponse(BaseModel):
    id: int
    donation_id: int
    claimer_id: str  
    claimer: Optional[UserPublicResponse] = None
    donation: Optional[Any] = None  
    quantity_claimed: int = 1
    notes: Optional[str] = None
    status: ClaimStatus = ClaimStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    pickup_scheduled_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ClaimListResponse(BaseModel):
    items: List[ClaimResponse]
    total: int
    page: int
    size: int
    pages: int


class ClaimApproval(BaseModel):
    approved: bool
    message: Optional[str] = None


class ClaimPickupConfirmation(BaseModel):
    confirmed: bool
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None
