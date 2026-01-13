"""
VVB (Validation & Verification Body) Models
Models for validation tasks, verification tasks, and VVB queries
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base
import enum


class ValidationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    QUERIES_RAISED = "QUERIES_RAISED"
    COMPLETED = "COMPLETED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    DATA_REVIEW = "DATA_REVIEW"
    QUERIES_RAISED = "QUERIES_RAISED"
    VERIFIED = "VERIFIED"
    VERIFIED_WITH_ADJUSTMENTS = "VERIFIED_WITH_ADJUSTMENTS"
    NOT_VERIFIED = "NOT_VERIFIED"


class QueryStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESPONDED = "RESPONDED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class QueryCategory(str, enum.Enum):
    METHODOLOGY = "METHODOLOGY"
    BOUNDARIES = "BOUNDARIES"
    BASELINE = "BASELINE"
    EMISSION_CALCULATIONS = "EMISSION_CALCULATIONS"
    SAFEGUARDS = "SAFEGUARDS"
    STAKEHOLDERS = "STAKEHOLDERS"
    MONITORING_PLAN = "MONITORING_PLAN"
    DOCUMENTATION = "DOCUMENTATION"
    OTHER = "OTHER"


class ValidationTask(Base):
    """Tracks validation tasks assigned to VVB users for projects"""
    __tablename__ = "validation_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vvb_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(ValidationStatus), default=ValidationStatus.PENDING)
    
    # VVB Details
    lead_auditor = Column(String(255))
    reviewer = Column(String(255))
    accreditation_id = Column(String(100))
    
    # Checklist tracking (JSON: {item: status})
    checklist = Column(JSON, default=dict)
    
    # Remarks and notes
    remarks = Column(Text)
    decision_notes = Column(Text)
    
    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    project = relationship("Project", backref="validation_tasks")
    vvb_user = relationship("User", backref="assigned_validations")


class VerificationTask(Base):
    """Tracks verification tasks for monitoring periods"""
    __tablename__ = "verification_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vvb_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Monitoring period info
    monitoring_period_id = Column(String(50))
    monitoring_start = Column(DateTime(timezone=True))
    monitoring_end = Column(DateTime(timezone=True))
    
    status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING)
    
    # ER calculations
    proposed_ers = Column(Integer)  # Emission reductions proposed by developer
    verified_ers = Column(Integer)  # Verified by VVB
    adjustments = Column(Integer, default=0)
    leakage_deduction = Column(Integer, default=0)
    buffer_deduction = Column(Integer, default=0)
    net_ers = Column(Integer)  # Final net emission reductions
    
    # Checklist tracking
    checklist = Column(JSON, default=dict)
    
    # Remarks
    remarks = Column(Text)
    decision_notes = Column(Text)
    
    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    project = relationship("Project", backref="verification_tasks")
    vvb_user = relationship("User", backref="assigned_verifications")


class VVBQuery(Base):
    """Queries raised by VVB during validation/verification"""
    __tablename__ = "vvb_queries"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to task (either validation or verification)
    validation_task_id = Column(Integer, ForeignKey("validation_tasks.id"), nullable=True)
    verification_task_id = Column(Integer, ForeignKey("verification_tasks.id"), nullable=True)
    
    # Query details
    category = Column(SQLEnum(QueryCategory), default=QueryCategory.OTHER)
    query_text = Column(Text, nullable=False)
    status = Column(SQLEnum(QueryStatus), default=QueryStatus.OPEN)
    
    # Created by VVB user
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    # Relationships
    validation_task = relationship("ValidationTask", backref="queries")
    verification_task = relationship("VerificationTask", backref="queries")
    creator = relationship("User", backref="vvb_queries_created")


class VVBQueryResponse(Base):
    """Responses to VVB queries from developers"""
    __tablename__ = "vvb_query_responses"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("vvb_queries.id"), nullable=False)
    
    # Response content
    response_text = Column(Text, nullable=False)
    attachments = Column(JSON, default=list)  # List of file paths/URLs
    
    # Responded by developer
    responded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    responded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    query = relationship("VVBQuery", backref="responses")
    responder = relationship("User", backref="query_responses")
