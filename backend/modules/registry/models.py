"""
Registry System Models
Models for registry reviews, issuance, and credit batches
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base
import enum


class RegistryReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    CLARIFICATIONS_REQUESTED = "CLARIFICATIONS_REQUESTED"
    APPROVED = "APPROVED"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    REJECTED = "REJECTED"


class IssuanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    ISSUED = "ISSUED"
    FAILED = "FAILED"


class CreditStatus(str, enum.Enum):
    OWNED = "OWNED"
    LISTED = "LISTED"
    LOCKED = "LOCKED"
    TRANSFERRED = "TRANSFERRED"
    RETIRED = "RETIRED"


class CreditType(str, enum.Enum):
    VER = "VER"      # Verified Emission Reductions
    VCU = "VCU"      # Verified Carbon Units
    REC = "REC"      # Renewable Energy Certificates
    ACR = "ACR"      # American Carbon Registry
    GCC = "GCC"      # Global Carbon Council
    ART = "ART"      # Architecture for REDD+ Transactions


class RegistryReview(Base):
    """Tracks registry review process for projects"""
    __tablename__ = "registry_reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    registry_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Registry info
    registry_name = Column(String(100))  # GS, VCS, ACR, etc.
    
    status = Column(SQLEnum(RegistryReviewStatus), default=RegistryReviewStatus.PENDING)
    
    # Checklist tracking (JSON: {item: status})
    checklist = Column(JSON, default=dict)
    
    # Decision info
    conditions = Column(Text)
    rejection_reason = Column(Text)
    decision_notes = Column(Text)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    review_started_at = Column(DateTime(timezone=True))
    decision_at = Column(DateTime(timezone=True))
    
    # Relationships
    project = relationship("Project", backref="registry_reviews")
    registry_user = relationship("User", backref="assigned_reviews")


class RegistryQuery(Base):
    """Queries/clarifications raised by registry during review"""
    __tablename__ = "registry_queries"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("registry_reviews.id"), nullable=False)
    
    # Query details
    category = Column(String(100))
    query_text = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESPONDED, RESOLVED
    
    # Created by registry user
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Response
    response_text = Column(Text)
    response_attachments = Column(JSON, default=list)
    responded_by = Column(Integer, ForeignKey("users.id"))
    responded_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    # Relationships
    review = relationship("RegistryReview", backref="queries")
    creator = relationship("User", foreign_keys=[created_by], backref="registry_queries_created")
    responder = relationship("User", foreign_keys=[responded_by], backref="registry_queries_responded")


class IssuanceRecord(Base):
    """Records credit issuance events"""
    __tablename__ = "issuance_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("registry_reviews.id"), nullable=True)
    
    # Issuance details
    registry_name = Column(String(100))
    total_credits = Column(Integer, nullable=False)
    vintage_year = Column(Integer)
    credit_type = Column(SQLEnum(CreditType), default=CreditType.VER)
    
    status = Column(SQLEnum(IssuanceStatus), default=IssuanceStatus.PENDING)
    
    # Registry reference
    registry_reference_id = Column(String(255))
    
    # Issued by
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Issuance certificate info
    certificate_url = Column(String(500))
    
    # Timestamps
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    issued_at = Column(DateTime(timezone=True))
    
    # Relationships
    project = relationship("Project", backref="issuance_records")
    review = relationship("RegistryReview", backref="issuance_records")
    issuer = relationship("User", backref="issued_credits")


class CreditBatch(Base):
    """Individual credit batches with serial numbers"""
    __tablename__ = "credit_batches"

    id = Column(Integer, primary_key=True, index=True)
    issuance_id = Column(Integer, ForeignKey("issuance_records.id"), nullable=False)
    
    # Batch identification
    batch_id = Column(String(100), unique=True, nullable=False)
    serial_start = Column(String(100), nullable=False)
    serial_end = Column(String(100), nullable=False)
    
    # Credit details
    quantity = Column(Integer, nullable=False)
    credit_type = Column(SQLEnum(CreditType), default=CreditType.VER)
    vintage_year = Column(Integer)
    registry_name = Column(String(100))
    
    status = Column(SQLEnum(CreditStatus), default=CreditStatus.OWNED)
    
    # Owner (initially developer, can change after transfer)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # For marketplace listings
    listing_id = Column(Integer, nullable=True)
    price_per_credit = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    transferred_at = Column(DateTime(timezone=True))
    retired_at = Column(DateTime(timezone=True))
    
    # Relationships
    issuance = relationship("IssuanceRecord", backref="batches")
    owner = relationship("User", backref="credit_batches")
