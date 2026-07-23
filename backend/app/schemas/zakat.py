from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserPublicResponse
from app.models.zakat import ZakatRecipientType, ZakatStatus


class ZakatDonationCreate(BaseModel):
    """Create a new zakat donation record"""
    amount: float = Field(..., gt=0, description="Donation amount")
    currency: str = Field(default="USD", max_length=10)
    recipient_type: ZakatRecipientType = ZakatRecipientType.HOPEBITE
    recipient_id: Optional[str] = None  
    recipient_name: Optional[str] = Field(None, max_length=255)
    recipient_description: Optional[str] = None
    food_request_id: Optional[int] = None  
    transaction_id: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class ZakatDonationResponse(BaseModel):
    id: int
    donor_id: str  
    donor: Optional[UserPublicResponse] = None
    amount: float
    currency: str
    recipient_type: ZakatRecipientType
    recipient_id: Optional[str]  
    recipient_name: Optional[str]
    recipient_description: Optional[str]
    food_request_id: Optional[int]
    status: ZakatStatus
    transaction_id: Optional[str]
    payment_method: Optional[str]
    notes: Optional[str]
    is_verified: bool
    donated_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class ZakatDonationListResponse(BaseModel):
    items: List[ZakatDonationResponse]
    total: int
    total_amount: float
    page: int
    size: int
    pages: int


class ZakatStats(BaseModel):
    """Statistics for zakat donations"""
    total_donations: int
    total_amount: float
    currency: str
    total_distributed: float = 0.0
    pending_amount: float = 0.0



class ZakatRequestCreate(BaseModel):
    """Create a new zakat request"""
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    amount_needed: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=10)
    purpose: Optional[str] = Field(None, max_length=255)
    beneficiaries_count: int = Field(default=1, ge=1)
    supporting_documents: Optional[List[str]] = None


class ZakatRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    amount_needed: Optional[float] = Field(None, gt=0)
    purpose: Optional[str] = None
    beneficiaries_count: Optional[int] = Field(None, ge=1)
    supporting_documents: Optional[List[str]] = None
    status: Optional[ZakatStatus] = None


class ZakatRequestResponse(BaseModel):
    id: int
    requester_id: str  
    requester: Optional[UserPublicResponse] = None  
    title: str
    description: str
    amount_needed: float
    amount_received: float
    currency: str
    purpose: Optional[str]
    beneficiaries_count: int
    status: ZakatStatus
    is_verified: bool
    supporting_documents: Optional[str]
    created_at: datetime
    updated_at: datetime
    fulfilled_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ZakatRequestListResponse(BaseModel):
    items: List[ZakatRequestResponse]
    total: int
    total_amount_needed: float
    total_amount_received: float
    page: int
    size: int
    pages: int
