from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from app.models.user import UserRole, UserType


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")


class AdminLoginRequest(BaseModel):
    """Fixed admin login request"""
    email: EmailStr = Field(..., description="Admin email")
    password: str = Field(..., description="Admin password")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token")


class RoleOption(BaseModel):
    """Role option for signup"""
    role: UserRole
    label: str
    description: str


class SignupOptions(BaseModel):
    """Available signup options"""
    roles: List[RoleOption] = [
        RoleOption(
            role=UserRole.CONTRIBUTOR,
            label="Join as Contributor",
            description="Donate food, zakat, and help those in need"
        ),
        RoleOption(
            role=UserRole.RECIPIENT,
            label="Join as Recipient",
            description="Request food assistance and receive donations"
        ),
        RoleOption(
            role=UserRole.VOLUNTEER,
            label="Join as Volunteer",
            description="Help deliver food donations to recipients"
        ),
    ]
    admin_login_available: bool = True


class UserTypeOption(BaseModel):
    """User type option for signup"""
    type: UserType
    label: str
    description: str


class ContributorTypeOptions(BaseModel):
    """Available contributor type options"""
    types: List[UserTypeOption] = [
        UserTypeOption(
            type=UserType.INDIVIDUAL,
            label="Join as an Individual",
            description="Personal account for individual donors"
        ),
        UserTypeOption(
            type=UserType.NGO,
            label="Join as an NGO/Humanitarian Organization",
            description="Organization account for NGOs and humanitarian groups"
        ),
        UserTypeOption(
            type=UserType.COMPANY,
            label="Join as a Company",
            description="Corporate account for business donations"
        ),
    ]


class RecipientTypeOptions(BaseModel):
    """Available recipient type options"""
    types: List[UserTypeOption] = [
        UserTypeOption(
            type=UserType.NGO,
            label="Join as an Organization / NGO",
            description="Organization account to receive assistance for beneficiaries"
        ),
    ]


class TokenWithUser(Token):
    """Token response with user info"""
    user_id: str
    role: UserRole
    user_type: UserType
    full_name: str
