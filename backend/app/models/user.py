from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    VOLUNTEER = "volunteer"
    CONTRIBUTOR = "contributor"
    RECIPIENT = "recipient"

class UserType(str, Enum):
    INDIVIDUAL = "individual"
    NGO = "ngo"
    COMPANY = "company"

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: str  
    email: str
    full_name: str
    role: UserRole
    user_type: UserType
    is_active: bool = True
    is_verified: bool = False
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    organization_name: Optional[str] = None
    organization_registration_number: Optional[str] = None
    organization_description: Optional[str] = None
    organization_website: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    
    total_donations: int = 0
    total_meals_donated: int = 0
    donation_points: int = 0
    total_claims: int = 0
    total_deliveries: int = 0
    total_zakat_donated: float = 0.0
    total_zakat_received: float = 0.0
    points: int = 0
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    class Config:
        extra = "ignore" 
