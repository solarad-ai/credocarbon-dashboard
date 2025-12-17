from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from enum import Enum

class UserRole(str, Enum):
    DEVELOPER = "DEVELOPER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"
    VVB = "VVB"
    REGISTRY = "REGISTRY"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    # Additional profile fields
    name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    # For developer specific
    developer_type: Optional[str] = None
    # For buyer specific
    industry_sector: Optional[str] = None
    intended_usage: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    profile_data: Any # JSON
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class ProfileUpdate(BaseModel):
    """Schema for updating user profile data"""
    name: Optional[str] = None
    phone: Optional[str] = None
    companyName: Optional[str] = None
    company_name: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    developerType: Optional[str] = None
    developer_type: Optional[str] = None
    # KYC fields
    panNumber: Optional[str] = None
    gstNumber: Optional[str] = None
    # Notification preferences
    emailNotifications: Optional[bool] = None
    smsNotifications: Optional[bool] = None
    lifecycleAlerts: Optional[bool] = None
    marketAlerts: Optional[bool] = None
    documentReminders: Optional[bool] = None
    # Profile photo (base64 encoded)
    profilePhoto: Optional[str] = None
    # For buyer
    industrySector: Optional[str] = None
    intendedUsage: Optional[str] = None
