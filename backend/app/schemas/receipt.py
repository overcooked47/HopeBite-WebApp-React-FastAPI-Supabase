from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.receipt import ReceiptType


class ReceiptCreate(BaseModel):
    receipt_type: ReceiptType
    donation_id: Optional[int] = None
    zakat_donation_id: Optional[int] = None
    description: str
    amount: Optional[float] = None
    currency: str = "USD"
    food_items: Optional[str] = None
    quantity: Optional[int] = None
    quantity_unit: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_type: Optional[str] = None


class ReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    donor_id: str  
    receipt_type: ReceiptType
    donation_id: Optional[int]
    zakat_donation_id: Optional[int]
    description: str
    amount: Optional[float]
    currency: str
    food_items: Optional[str]
    quantity: Optional[int]
    quantity_unit: Optional[str]
    recipient_name: Optional[str]
    recipient_type: Optional[str]
    issuer_name: str
    issuer_address: Optional[str]
    is_verified: bool
    verified_at: Optional[datetime]
    receipt_pdf_url: Optional[str]
    donation_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReceiptListResponse(BaseModel):
    items: List[ReceiptResponse]
    total: int
    page: int
    size: int
    pages: int
