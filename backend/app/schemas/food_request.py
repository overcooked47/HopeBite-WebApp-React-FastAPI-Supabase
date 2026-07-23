from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.food_request import FoodRequestStatus, FoodRequestUrgency
from app.models.donation import FoodCategory
from app.schemas.user import UserPublicResponse


class FoodRequestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[FoodCategory] = None
    quantity_needed: int = Field(..., gt=0)
    unit: str = Field(default="servings", max_length=50)
    
    
    delivery_address: str = Field(..., min_length=5, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    
    needed_by: Optional[datetime] = None
    urgency: FoodRequestUrgency = FoodRequestUrgency.MEDIUM
    
    
    beneficiaries_count: int = Field(default=1, ge=1)
    requires_vegetarian: bool = False
    requires_vegan: bool = False
    requires_halal: bool = False
    requires_gluten_free: bool = False


class FoodRequestCreate(FoodRequestBase):
    images: Optional[List[str]] = None


class FoodRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[FoodCategory] = None
    quantity_needed: Optional[int] = Field(None, gt=0)
    unit: Optional[str] = None
    
    delivery_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    needed_by: Optional[datetime] = None
    urgency: Optional[FoodRequestUrgency] = None
    
    beneficiaries_count: Optional[int] = Field(None, ge=1)
    requires_vegetarian: Optional[bool] = None
    requires_vegan: Optional[bool] = None
    requires_halal: Optional[bool] = None
    requires_gluten_free: Optional[bool] = None
    
    images: Optional[List[str]] = None
    status: Optional[FoodRequestStatus] = None


class FoodRequestResponse(FoodRequestBase):
    id: int
    requester_id: str  
    requester: Optional[UserPublicResponse] = None
    images: Optional[str] = None  
    status: FoodRequestStatus = FoodRequestStatus.PENDING
    quantity_fulfilled: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    fulfilled_at: Optional[datetime] = None
    expired_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FoodRequestListResponse(BaseModel):
    items: List[FoodRequestResponse]
    total: int
    page: int
    size: int
    pages: int
