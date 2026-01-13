"""
Subscription Module Schemas
Pydantic models for API request/response
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class SubscriptionTierEnum(str, Enum):
    """Subscription tier packages (mirrors SQLAlchemy enum)"""
    FREE_ANALYSIS = "PKG_0"
    BUYER_SOURCING = "PKG_1"
    DEV_REGISTRATION = "PKG_2"
    DEV_MRV = "PKG_3"
    REC = "PKG_4"
    COMPLIANCE = "PKG_5"
    ADDON = "PKG_6"
    FULL_ACCESS = "PKG_FULL"


# ============ Request Schemas ============

class SubscriptionAssign(BaseModel):
    """Assign subscription tier to user"""
    tier: SubscriptionTierEnum
    custom_limits: Optional[Dict[str, Any]] = None
    addons: Optional[List[str]] = None
    billing_cycle: Optional[str] = None
    valid_until: Optional[datetime] = None


class SubscriptionUpdate(BaseModel):
    """Update subscription"""
    tier: Optional[SubscriptionTierEnum] = None
    custom_limits: Optional[Dict[str, Any]] = None
    addons: Optional[List[str]] = None
    billing_cycle: Optional[str] = None
    valid_until: Optional[datetime] = None


class FeatureCheckRequest(BaseModel):
    """Check if user has access to a feature"""
    feature_key: str


class TierFeatureCreate(BaseModel):
    """Create a tier feature"""
    tier: SubscriptionTierEnum
    feature_key: str
    feature_name: str
    feature_description: Optional[str] = None
    is_included: bool = True
    limits: Optional[Dict[str, Any]] = None


class TierFeatureUpdate(BaseModel):
    """Update a tier feature"""
    feature_name: Optional[str] = None
    feature_description: Optional[str] = None
    is_included: Optional[bool] = None
    limits: Optional[Dict[str, Any]] = None


# ============ Response Schemas ============

class SubscriptionResponse(BaseModel):
    """Subscription details response"""
    id: int
    user_id: int
    tier: SubscriptionTierEnum
    tier_name: str  # Human readable
    custom_limits: Dict[str, Any]
    addons: List[str]
    billing_cycle: Optional[str]
    valid_until: Optional[datetime]
    assigned_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TierFeatureResponse(BaseModel):
    """Feature details for a tier"""
    id: int
    tier: SubscriptionTierEnum
    feature_key: str
    feature_name: str
    feature_description: Optional[str]
    is_included: bool
    limits: Dict[str, Any]
    
    class Config:
        from_attributes = True


class FeatureCheckResponse(BaseModel):
    """Response for feature access check"""
    feature_key: str
    has_access: bool
    tier: SubscriptionTierEnum
    limits: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class TierDefinition(BaseModel):
    """Tier definition with all features"""
    tier: SubscriptionTierEnum
    tier_name: str
    tier_description: str
    features: List[TierFeatureResponse]
    feature_count: int


class UserSubscriptionSummary(BaseModel):
    """Summary of user's subscription for list views"""
    user_id: int
    user_email: str
    user_name: Optional[str]
    role: str
    tier: SubscriptionTierEnum
    tier_name: str
    valid_until: Optional[datetime]
    created_at: datetime


class SubscriptionListResponse(BaseModel):
    """Paginated list of subscriptions"""
    items: List[UserSubscriptionSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


# Tier name mapping
TIER_NAMES = {
    SubscriptionTierEnum.FREE_ANALYSIS: "Free Analysis",
    SubscriptionTierEnum.BUYER_SOURCING: "Buyer: Sourcing & Execution",
    SubscriptionTierEnum.DEV_REGISTRATION: "Developer: Project Registration",
    SubscriptionTierEnum.DEV_MRV: "Developer: MRV & Issuance",
    SubscriptionTierEnum.REC: "Renewable Energy Certificates",
    SubscriptionTierEnum.COMPLIANCE: "Compliance & ETS Support",
    SubscriptionTierEnum.ADDON: "Optional Add-ons",
    SubscriptionTierEnum.FULL_ACCESS: "Full Access",
}

TIER_DESCRIPTIONS = {
    SubscriptionTierEnum.FREE_ANALYSIS: "Pre-engagement analysis including project intake, eligibility screening, and credit estimation.",
    SubscriptionTierEnum.BUYER_SOURCING: "Supply discovery, transaction tracking, and retirement coordination for buyers.",
    SubscriptionTierEnum.DEV_REGISTRATION: "Registry onboarding, PDD structuring, and submission coordination for developers.",
    SubscriptionTierEnum.DEV_MRV: "Recurring MRV, verification coordination, and issuance tracking for developers.",
    SubscriptionTierEnum.REC: "Generator onboarding, issuance coordination, and tracking for RECs.",
    SubscriptionTierEnum.COMPLIANCE: "ETS assessment, emissions reporting, and compliance calendar management.",
    SubscriptionTierEnum.ADDON: "Optional add-on features available for separate purchase.",
    SubscriptionTierEnum.FULL_ACCESS: "Complete access to all platform features across all packages.",
}
