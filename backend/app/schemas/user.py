from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserType


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    
    @validator('email', pre=True)
    def sanitize_email(cls, v):
        if isinstance(v, str):
            
            return v.strip().lower().replace('\n', '').replace('\r', '')
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.CONTRIBUTOR
    user_type: UserType = UserType.INDIVIDUAL
    organization_name: Optional[str] = Field(None, max_length=255)
    organization_registration_number: Optional[str] = Field(None, max_length=100)
    organization_description: Optional[str] = None
    organization_website: Optional[str] = Field(None, max_length=500)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('organization_name', always=True)
    def validate_organization_name(cls, v, values):
        user_type = values.get('user_type')
        if user_type in [UserType.NGO, UserType.COMPANY] and not v:
            raise ValueError('Organization name is required for NGO/Company accounts')
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organization_name: Optional[str] = Field(None, max_length=255)
    organization_description: Optional[str] = None
    organization_website: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    id: str
    role: UserRole
    user_type: UserType
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    bio: Optional[str]
    organization_name: Optional[str]
    organization_description: Optional[str]
    organization_website: Optional[str]
    total_donations: int
    total_meals_donated: int
    donation_points: int
    total_claims: int
    total_deliveries: int
    total_zakat_donated: float
    total_zakat_received: float
    points: int
    created_at: datetime
    last_login_at: Optional[datetime]
    latitude: Optional[float]
    longitude: Optional[float]
    
    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    id: str
    full_name: str
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    user_type: UserType
    organization_name: Optional[str] = None
    total_donations: int = 0
    total_meals_donated: int = 0
    donation_points: int = 0
    
    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class AdminUserUpdate(BaseModel):
    """Schema for admin to update user details"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    role: Optional[UserRole] = None
    user_type: Optional[UserType] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class VolunteerLocationUpdate(BaseModel):
    """Schema for volunteer to update their location"""
    latitude: float
    longitude: float
