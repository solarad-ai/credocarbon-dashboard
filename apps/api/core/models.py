from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class UserRole(str, enum.Enum):
    DEVELOPER = "DEVELOPER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"
    VVB = "VVB"
    REGISTRY = "REGISTRY"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    # Generic JSON for profile details to be flexible (name, company, etc.)
    profile_data = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="developer")

class ProjectStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED_TO_VVB = "SUBMITTED_TO_VVB"
    VALIDATION_PENDING = "VALIDATION_PENDING"
    VALIDATION_APPROVED = "VALIDATION_APPROVED"
    VERIFICATION_PENDING = "VERIFICATION_PENDING"
    VERIFICATION_APPROVED = "VERIFICATION_APPROVED"
    REGISTRY_REVIEW = "REGISTRY_REVIEW"
    ISSUED = "ISSUED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("users.id"))
    
    # Section 7: Project Type (Solar, Wind, A/R, etc.)
    project_type = Column(String, index=True)
    
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    
    # Store wizard state here? Or in a separate table?
    # Spec mentions "Project Setup Wizard" and "Draft Management"
    # We can store the current wizard step and data
    wizard_step = Column(String, default="0")
    wizard_data = Column(JSON, default={}) # Stores partial data from wizard

    # Basic Info (Section 8)
    name = Column(String)
    code = Column(String, unique=True, index=True) # Auto-generated
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    developer = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project")

    @property
    def country(self):
        if self.wizard_data and isinstance(self.wizard_data, dict):
            return self.wizard_data.get("country")
        return None

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    category = Column(String) # e.g., "PDD", "Evidence", "LandTitle"
    file_name = Column(String)
    storage_uri = Column(String) # Path in local FS or GCS
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Who did it
    action = Column(String) # "CREATE_PROJECT", "LOGIN", "SUBMIT_VVB"
    entity_type = Column(String) # "PROJECT", "USER"
    entity_id = Column(String) # ID of impacted entity
    details = Column(JSON) # Diff or extra info
    timestamp = Column(DateTime, default=datetime.utcnow)


# ============ New Models for Dynamic Pages ============

class NotificationType(str, enum.Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    ISSUANCE = "issuance"
    VERIFICATION = "verification"
    VALIDATION = "validation"
    PROJECT = "project"
    MARKET = "market"
    RETIREMENT = "retirement"
    SYSTEM = "system"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text)
    link = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="notifications")


class CreditHolding(Base):
    """Represents a user's carbon credit holdings"""
    __tablename__ = "credit_holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vintage = Column(Integer, nullable=False)  # Year
    quantity = Column(Integer, nullable=False)  # Total credits
    available = Column(Integer, nullable=False)  # Available for sale/transfer
    locked = Column(Integer, default=0)  # Locked in active orders
    serial_start = Column(String)
    serial_end = Column(String)
    acquired_date = Column(DateTime, default=datetime.utcnow)
    unit_price = Column(Integer, default=0)  # Cents per credit

    user = relationship("User", backref="holdings")
    project = relationship("Project", backref="holdings")


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ISSUANCE = "issuance"
    RETIREMENT = "retirement"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Transaction(Base):
    """Tracks all credit movements"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    quantity = Column(Integer, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    counterparty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    amount_cents = Column(Integer, nullable=True)  # Price in cents
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], backref="transactions")
    project = relationship("Project", backref="transactions")


class RetirementStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Retirement(Base):
    """Carbon credit retirements"""
    __tablename__ = "retirements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    holding_id = Column(Integer, ForeignKey("credit_holdings.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    certificate_id = Column(String, unique=True, index=True, nullable=True)
    quantity = Column(Integer, nullable=False)
    vintage = Column(Integer, nullable=False)
    beneficiary = Column(String, nullable=False)
    beneficiary_address = Column(String)
    purpose = Column(String)
    serial_range = Column(String)
    status = Column(Enum(RetirementStatus), default=RetirementStatus.PENDING)
    retirement_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="retirements")
    project = relationship("Project", backref="retirements")


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    SOLD = "sold"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class MarketListing(Base):
    """Marketplace sell orders"""
    __tablename__ = "market_listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    holding_id = Column(Integer, ForeignKey("credit_holdings.id"), nullable=False)
    vintage = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_sold = Column(Integer, default=0)
    price_per_ton_cents = Column(Integer, nullable=False)  # Price in cents
    min_quantity = Column(Integer, default=1)
    status = Column(Enum(ListingStatus), default=ListingStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    seller = relationship("User", backref="listings")
    project = relationship("Project", backref="listings")
    holding = relationship("CreditHolding", backref="listings")


class OfferStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTER = "counter"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Offer(Base):
    """Purchase offers on listings"""
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("market_listings.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_ton_cents = Column(Integer, nullable=False)
    status = Column(Enum(OfferStatus), default=OfferStatus.PENDING)
    counter_price_cents = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)

    listing = relationship("MarketListing", backref="offers")
    buyer = relationship("User", backref="offers_made")


class TaskType(str, enum.Enum):
    FEATURE = "feature"
    REGISTRY = "registry"
    METHODOLOGY = "methodology"
    OTHER = "other"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AdminTask(Base):
    """Tasks for managing features, registries, and methodologies"""
    __tablename__ = "admin_tasks"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(TaskType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    link = Column(String, nullable=True)  # Reference URL
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    documents = Column(JSON, default=[])  # List of document filenames
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", backref="admin_tasks")


# ============ Platform Configuration Models (CMS) ============

class Registry(Base):
    """Carbon credit registries (VCS, Gold Standard, CDM, GCC)"""
    __tablename__ = "registries"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # VCS, GS, CDM
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    website_url = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    requirements = Column(JSON, default={})  # Documents, fees, etc.
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProjectTypeConfig(Base):
    """Project types (Solar, Wind, Biogas, etc.)"""
    __tablename__ = "project_type_configs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # solar, wind
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # energy, nature, waste
    icon = Column(String(50), nullable=True)  # Icon identifier
    applicable_registries = Column(JSON, default=[])  # List of registry codes
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FeatureFlag(Base):
    """Feature flags for platform features"""
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=False)
    target_roles = Column(JSON, default=[])  # Empty = all roles
    flag_metadata = Column(JSON, default={})  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Announcement(Base):
    """Platform announcements and banners"""
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info")  # info, warning, success, error
    target_roles = Column(JSON, default=[])  # Empty = all roles
    is_active = Column(Boolean, default=True)
    is_dismissible = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    link_url = Column(String, nullable=True)
    link_text = Column(String(100), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlatformFee(Base):
    """Platform fees and pricing configuration"""
    __tablename__ = "platform_fees"

    id = Column(Integer, primary_key=True, index=True)
    fee_type = Column(String(50), unique=True, nullable=False)  # transaction, listing, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    percentage = Column(Integer, default=0)  # In basis points (100 = 1%)
    flat_amount_cents = Column(Integer, default=0)  # Flat fee in cents
    min_amount_cents = Column(Integer, default=0)
    max_amount_cents = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailTemplate(Base):
    """Email templates for platform notifications"""
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)  # welcome, project_approved
    name = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=True)
    variables = Column(JSON, default=[])  # Available template variables
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DocumentTemplate(Base):
    """Document templates (PDD, ER Report, etc.)"""
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    template_type = Column(String(50), nullable=False)  # PDD, ER_REPORT, etc.
    registry_id = Column(Integer, ForeignKey("registries.id"), nullable=True)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    version = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    registry = relationship("Registry", backref="templates")
