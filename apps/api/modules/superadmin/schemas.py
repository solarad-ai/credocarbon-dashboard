from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class AdminPermissionLevel(str, Enum):
    READ_ONLY = "READ_ONLY"
    EDITOR = "EDITOR"
    FULL_ACCESS = "FULL_ACCESS"


# Dashboard Stats
class DashboardStats(BaseModel):
    total_users: int
    total_developers: int
    total_buyers: int
    total_admins: int
    total_projects: int
    active_projects: int
    total_credits_issued: int
    total_credits_retired: int
    total_transactions: int
    marketplace_volume: int
    recent_signups: int
    pending_projects: int


class ActivityItem(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: str
    actor_email: Optional[str] = None
    timestamp: datetime
    details: Optional[dict] = None


# User Management
class UserListItem(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None
    profile_data: Optional[dict] = None

    class Config:
        from_attributes = True


class UserDetail(UserListItem):
    projects_count: int = 0
    transactions_count: int = 0
    holdings_count: int = 0


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    profile_data: Optional[dict] = None


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    permission_level: AdminPermissionLevel = AdminPermissionLevel.READ_ONLY
    profile_data: Optional[dict] = None


class AdminUpdate(BaseModel):
    permission_level: Optional[AdminPermissionLevel] = None
    is_active: Optional[bool] = None


# Project Management
class ProjectListItem(BaseModel):
    id: int
    name: Optional[str] = None
    code: Optional[str] = None
    project_type: Optional[str] = None
    status: str
    developer_id: int
    developer_email: Optional[str] = None
    country: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# Transaction Management
class TransactionListItem(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    type: str
    status: str
    quantity: int
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    amount_cents: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Marketplace Management
class ListingListItem(BaseModel):
    id: int
    seller_id: int
    seller_email: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    vintage: int
    quantity: int
    quantity_sold: int
    price_per_ton_cents: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Retirement Management
class RetirementListItem(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    certificate_id: Optional[str] = None
    quantity: int
    vintage: int
    beneficiary: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Audit Logs
class AuditLogItem(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    details: Optional[dict] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# API Health
class HealthStatus(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    database: str
    uptime_seconds: float
    response_time_ms: float
    timestamp: str  # ISO format with timezone


# Notifications
class BroadcastNotification(BaseModel):
    title: str
    message: str
    target_roles: Optional[List[str]] = None  # None = all users


# Analytics
class PlatformAnalytics(BaseModel):
    user_growth: List[dict]
    transaction_trends: List[dict]
    project_type_breakdown: List[dict]
    geographic_distribution: List[dict]
    revenue_metrics: dict


# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


# Task Management
class TaskCreate(BaseModel):
    type: str  # feature, registry, methodology, other
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    priority: str = "medium"  # low, medium, high


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None


class TaskListItem(BaseModel):
    id: int
    type: str
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    status: str
    priority: str
    documents: List[str] = []
    created_by: Optional[int] = None
    creator_email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Platform Configuration Schemas ============

# Registry
class RegistryCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    requirements: Optional[dict] = {}
    is_active: bool = True
    display_order: int = 0


class RegistryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    requirements: Optional[dict] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class RegistryItem(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    requirements: dict = {}
    is_active: bool
    display_order: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Project Type
class ProjectTypeCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    applicable_registries: List[str] = []
    is_active: bool = True
    display_order: int = 0


class ProjectTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    applicable_registries: Optional[List[str]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ProjectTypeItem(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    applicable_registries: List[str] = []
    is_active: bool
    display_order: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Feature Flag
class FeatureFlagCreate(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    is_enabled: bool = False
    target_roles: List[str] = []
    metadata: Optional[dict] = {}


class FeatureFlagUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    target_roles: Optional[List[str]] = None
    metadata: Optional[dict] = None


class FeatureFlagItem(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str] = None
    is_enabled: bool
    target_roles: List[str] = []
    metadata: dict = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Announcement
class AnnouncementCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    target_roles: List[str] = []
    is_active: bool = True
    is_dismissible: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None
    target_roles: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_dismissible: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None


class AnnouncementItem(BaseModel):
    id: int
    title: str
    message: str
    type: str
    target_roles: List[str] = []
    is_active: bool
    is_dismissible: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Platform Fee
class PlatformFeeCreate(BaseModel):
    fee_type: str
    name: str
    description: Optional[str] = None
    percentage: int = 0
    flat_amount_cents: int = 0
    min_amount_cents: int = 0
    max_amount_cents: Optional[int] = None
    is_active: bool = True


class PlatformFeeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    percentage: Optional[int] = None
    flat_amount_cents: Optional[int] = None
    min_amount_cents: Optional[int] = None
    max_amount_cents: Optional[int] = None
    is_active: Optional[bool] = None


class PlatformFeeItem(BaseModel):
    id: int
    fee_type: str
    name: str
    description: Optional[str] = None
    percentage: int
    flat_amount_cents: int
    min_amount_cents: int
    max_amount_cents: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Email Template
class EmailTemplateCreate(BaseModel):
    key: str
    name: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []
    is_active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class EmailTemplateItem(BaseModel):
    id: int
    key: str
    name: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
