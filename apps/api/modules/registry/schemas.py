"""
Registry System Schemas
Pydantic models for API request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class RegistryReviewStatusEnum(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    CLARIFICATIONS_REQUESTED = "CLARIFICATIONS_REQUESTED"
    APPROVED = "APPROVED"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    REJECTED = "REJECTED"


class IssuanceStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    ISSUED = "ISSUED"
    FAILED = "FAILED"


class CreditStatusEnum(str, Enum):
    OWNED = "OWNED"
    LISTED = "LISTED"
    LOCKED = "LOCKED"
    TRANSFERRED = "TRANSFERRED"
    RETIRED = "RETIRED"


class CreditTypeEnum(str, Enum):
    VER = "VER"
    VCU = "VCU"
    REC = "REC"
    ACR = "ACR"
    GCC = "GCC"
    ART = "ART"


# ===== Review Schemas =====

class RegistryReviewCreate(BaseModel):
    project_id: int
    registry_user_id: int
    registry_name: str


class RegistryReviewUpdate(BaseModel):
    status: Optional[RegistryReviewStatusEnum] = None
    checklist: Optional[Dict[str, Any]] = None
    conditions: Optional[str] = None
    rejection_reason: Optional[str] = None
    decision_notes: Optional[str] = None


class RegistryReviewResponse(BaseModel):
    id: int
    project_id: int
    registry_user_id: int
    registry_name: Optional[str]
    status: str
    checklist: Optional[Dict[str, Any]]
    conditions: Optional[str]
    rejection_reason: Optional[str]
    decision_notes: Optional[str]
    submitted_at: Optional[datetime]
    review_started_at: Optional[datetime]
    decision_at: Optional[datetime]

    class Config:
        from_attributes = True


class RegistryReviewWithProject(RegistryReviewResponse):
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    project_type: Optional[str] = None
    developer_name: Optional[str] = None


# ===== Query Schemas =====

class RegistryQueryCreate(BaseModel):
    review_id: int
    category: Optional[str] = "OTHER"
    query_text: str


class RegistryQueryResponse(BaseModel):
    id: int
    review_id: int
    category: Optional[str]
    query_text: str
    status: str
    created_by: int
    response_text: Optional[str]
    response_attachments: Optional[List[str]]
    responded_by: Optional[int]
    responded_at: Optional[datetime]
    created_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class QueryResponseSubmit(BaseModel):
    response_text: str
    attachments: Optional[List[str]] = []


# ===== Issuance Schemas =====

class IssuanceRequest(BaseModel):
    project_id: int
    review_id: Optional[int] = None
    total_credits: int
    vintage_year: int
    credit_type: CreditTypeEnum = CreditTypeEnum.VER
    registry_name: str


class IssuanceUpdate(BaseModel):
    status: Optional[IssuanceStatusEnum] = None
    registry_reference_id: Optional[str] = None
    certificate_url: Optional[str] = None


class IssuanceResponse(BaseModel):
    id: int
    project_id: int
    review_id: Optional[int]
    registry_name: Optional[str]
    total_credits: int
    vintage_year: Optional[int]
    credit_type: str
    status: str
    registry_reference_id: Optional[str]
    issued_by: Optional[int]
    certificate_url: Optional[str]
    requested_at: Optional[datetime]
    issued_at: Optional[datetime]

    class Config:
        from_attributes = True


# ===== Credit Batch Schemas =====

class CreditBatchCreate(BaseModel):
    issuance_id: int
    serial_start: str
    serial_end: str
    quantity: int
    credit_type: CreditTypeEnum = CreditTypeEnum.VER
    vintage_year: int
    registry_name: str
    owner_id: int


class CreditBatchResponse(BaseModel):
    id: int
    issuance_id: int
    batch_id: str
    serial_start: str
    serial_end: str
    quantity: int
    credit_type: str
    vintage_year: Optional[int]
    registry_name: Optional[str]
    status: str
    owner_id: int
    listing_id: Optional[int]
    price_per_credit: Optional[float]
    created_at: Optional[datetime]
    transferred_at: Optional[datetime]
    retired_at: Optional[datetime]

    class Config:
        from_attributes = True


# ===== Dashboard Schemas =====

class RegistryDashboardStats(BaseModel):
    pending_reviews: int
    in_progress_reviews: int
    pending_issuances: int
    total_credits_issued: int
    open_queries: int
    completed_this_month: int


class RegistryProjectSummary(BaseModel):
    project_id: int
    project_name: str
    project_code: str
    project_type: str
    developer_name: str
    review_id: int
    review_status: str
    submitted_at: datetime
    open_queries: int
    has_pending_issuance: bool
