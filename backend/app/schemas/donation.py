from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.donation import FoodCategory, DonationStatus
from app.schemas.user import UserPublicResponse


class DonationBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: FoodCategory = FoodCategory.OTHER
    quantity: int = Field(..., gt=0)
    quantity_unit: str = Field(default="servings", max_length=50)
    
    
    pickup_address: str = Field(..., min_length=5, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    
    pickup_time_start: datetime
    pickup_time_end: datetime
    expiry_date: datetime
    
    
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_halal: bool = False
    allergens: Optional[str] = None
    
    
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    special_instructions: Optional[str] = None


class DonationCreate(DonationBase):
    image_url: Optional[str] = None


class DonationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[FoodCategory] = None
    quantity: Optional[int] = Field(None, gt=0)
    quantity_unit: Optional[str] = None
    
    pickup_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    pickup_time_start: Optional[datetime] = None
    pickup_time_end: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    
    is_vegetarian: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_halal: Optional[bool] = None
    allergens: Optional[str] = None
    
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    
    status: Optional[DonationStatus] = None
    image_url: Optional[str] = None


class DonationResponse(DonationBase):
    id: int
    image_url: Optional[str] = None
    status: DonationStatus = DonationStatus.AVAILABLE
    donor_id: str  
    donor: Optional[UserPublicResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    
    pickup_time_start: Optional[datetime] = None
    pickup_time_end: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DonationListResponse(BaseModel):
    items: List[DonationResponse]
    total: int
    page: int
    size: int
    pages: int


class DonationFilter(BaseModel):
    category: Optional[FoodCategory] = None
    city: Optional[str] = None
    status: Optional[DonationStatus] = None
    is_vegetarian: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_halal: Optional[bool] = None
    search: Optional[str] = None
