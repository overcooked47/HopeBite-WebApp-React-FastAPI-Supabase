from enum import Enum

class FoodCategory(str, Enum):
    
    COOKED_MEALS = "cooked_meals"
    RAW_INGREDIENTS = "raw_ingredients"
    PACKAGED_FOOD = "packaged_food"
    BEVERAGES = "beverages"
    BAKERY = "bakery"
    FRUITS_VEGETABLES = "fruits_vegetables"
    DAIRY = "dairy"
    OTHER = "other"

class DonationStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    CLAIMED = "claimed"
    ASSIGNED_TO_VOLUNTEER = "assigned_to_volunteer"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FoodDonation(BaseModel):
    id: int
    donor_id: str  
    title: str
    description: Optional[str] = None
    category: FoodCategory
    quantity: int
    quantity_unit: str = "servings"
    
    
    pickup_address: str
    city: str
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    
    pickup_time_start: Optional[datetime] = None
    pickup_time_end: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    
    
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_halal: bool = False
    allergens: Optional[str] = None
    
    
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    
    status: DonationStatus = DonationStatus.AVAILABLE
    image_url: Optional[str] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        extra = "ignore" 
