"""
VVB (Validation & Verification Body) Schemas
Pydantic models for API request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class ValidationStatusEnum(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    QUERIES_RAISED = "QUERIES_RAISED"
    COMPLETED = "COMPLETED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class VerificationStatusEnum(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    DATA_REVIEW = "DATA_REVIEW"
    QUERIES_RAISED = "QUERIES_RAISED"
    VERIFIED = "VERIFIED"
    VERIFIED_WITH_ADJUSTMENTS = "VERIFIED_WITH_ADJUSTMENTS"
    NOT_VERIFIED = "NOT_VERIFIED"


class QueryStatusEnum(str, Enum):
    OPEN = "OPEN"
    RESPONDED = "RESPONDED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class QueryCategoryEnum(str, Enum):
    METHODOLOGY = "METHODOLOGY"
    BOUNDARIES = "BOUNDARIES"
    BASELINE = "BASELINE"
    EMISSION_CALCULATIONS = "EMISSION_CALCULATIONS"
    SAFEGUARDS = "SAFEGUARDS"
    STAKEHOLDERS = "STAKEHOLDERS"
    MONITORING_PLAN = "MONITORING_PLAN"
    DOCUMENTATION = "DOCUMENTATION"
    OTHER = "OTHER"


# ===== Validation Schemas =====

class ValidationTaskCreate(BaseModel):
    project_id: int
    vvb_user_id: int
    lead_auditor: Optional[str] = None
    reviewer: Optional[str] = None
    accreditation_id: Optional[str] = None


class ValidationTaskUpdate(BaseModel):
    status: Optional[ValidationStatusEnum] = None
    lead_auditor: Optional[str] = None
    reviewer: Optional[str] = None
    checklist: Optional[Dict[str, Any]] = None
    remarks: Optional[str] = None
    decision_notes: Optional[str] = None


class ValidationTaskResponse(BaseModel):
    id: int
    project_id: int
    vvb_user_id: int
    status: str
    lead_auditor: Optional[str]
    reviewer: Optional[str]
    accreditation_id: Optional[str]
    checklist: Optional[Dict[str, Any]]
    remarks: Optional[str]
    decision_notes: Optional[str]
    assigned_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ValidationTaskWithProject(ValidationTaskResponse):
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    project_type: Optional[str] = None
    developer_name: Optional[str] = None


# ===== Verification Schemas =====

class VerificationTaskCreate(BaseModel):
    project_id: int
    vvb_user_id: int
    monitoring_period_id: Optional[str] = None
    monitoring_start: Optional[datetime] = None
    monitoring_end: Optional[datetime] = None
    proposed_ers: Optional[int] = None


class VerificationTaskUpdate(BaseModel):
    status: Optional[VerificationStatusEnum] = None
    verified_ers: Optional[int] = None
    adjustments: Optional[int] = None
    leakage_deduction: Optional[int] = None
    buffer_deduction: Optional[int] = None
    net_ers: Optional[int] = None
    checklist: Optional[Dict[str, Any]] = None
    remarks: Optional[str] = None
    decision_notes: Optional[str] = None


class VerificationTaskResponse(BaseModel):
    id: int
    project_id: int
    vvb_user_id: int
    monitoring_period_id: Optional[str]
    monitoring_start: Optional[datetime]
    monitoring_end: Optional[datetime]
    status: str
    proposed_ers: Optional[int]
    verified_ers: Optional[int]
    adjustments: Optional[int]
    leakage_deduction: Optional[int]
    buffer_deduction: Optional[int]
    net_ers: Optional[int]
    checklist: Optional[Dict[str, Any]]
    remarks: Optional[str]
    decision_notes: Optional[str]
    assigned_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ===== Query Schemas =====

class VVBQueryCreate(BaseModel):
    validation_task_id: Optional[int] = None
    verification_task_id: Optional[int] = None
    category: QueryCategoryEnum = QueryCategoryEnum.OTHER
    query_text: str


class VVBQueryUpdate(BaseModel):
    status: Optional[QueryStatusEnum] = None


class VVBQueryResponse(BaseModel):
    id: int
    validation_task_id: Optional[int]
    verification_task_id: Optional[int]
    category: str
    query_text: str
    status: str
    created_by: int
    created_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class QueryResponseCreate(BaseModel):
    query_id: int
    response_text: str
    attachments: Optional[List[str]] = []


class QueryResponseSchema(BaseModel):
    id: int
    query_id: int
    response_text: str
    attachments: Optional[List[str]]
    responded_by: int
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


# ===== Dashboard Schemas =====

class VVBDashboardStats(BaseModel):
    pending_validations: int
    in_progress_validations: int
    pending_verifications: int
    in_progress_verifications: int
    open_queries: int
    completed_this_month: int


class VVBProjectSummary(BaseModel):
    project_id: int
    project_name: str
    project_code: str
    project_type: str
    developer_name: str
    task_type: str  # "validation" or "verification"
    task_id: int
    task_status: str
    assigned_at: datetime
    open_queries: int


# ===== Profile Schemas =====

class VVBProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime]
    name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    accreditation_id: Optional[str] = None
    certifications: Optional[List[str]] = None
    profile_photo: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None

    class Config:
        from_attributes = True


class VVBProfileUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    accreditation_id: Optional[str] = None
    certifications: Optional[List[str]] = None
    profile_photo: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None


class VVBPasswordChange(BaseModel):
    current_password: str
    new_password: str
