"""
Subscription Module Models
Defines subscription tiers and feature access control
"""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, JSON, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.core.database import Base


class SubscriptionTier(str, enum.Enum):
    """Subscription tier packages"""
    FREE_ANALYSIS = "PKG_0"      # Free Analysis (Pre-Engagement)
    BUYER_SOURCING = "PKG_1"     # Buyer: Sourcing & Execution
    DEV_REGISTRATION = "PKG_2"   # Developer: Project Registration
    DEV_MRV = "PKG_3"            # Developer: MRV, Verification & Issuance
    REC = "PKG_4"                # Renewable Energy Certificates
    COMPLIANCE = "PKG_5"         # Compliance & ETS Support
    ADDON = "PKG_6"              # Optional Add-ons
    FULL_ACCESS = "PKG_FULL"     # Full Access (All Features)


class Subscription(Base):
    """User subscription tracking"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.FREE_ANALYSIS, nullable=False)
    
    # Override defaults with custom limits
    custom_limits = Column(JSON, default={})  # {"max_projects": 10}
    
    # Track enabled add-ons (Package 6)
    addons = Column(JSON, default=[])  # ["registry_switching", "remediation"]
    
    # Billing info (future use)
    billing_cycle = Column(String, nullable=True)  # "monthly", "annual"
    valid_until = Column(DateTime, nullable=True)
    
    # Audit fields
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using string references for lazy loading
    user = relationship("User", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])


class TierFeature(Base):
    """Feature matrix definition - what features are included in each tier"""
    __tablename__ = "tier_features"
    
    id = Column(Integer, primary_key=True, index=True)
    tier = Column(Enum(SubscriptionTier), nullable=False, index=True)
    feature_key = Column(String(100), nullable=False, index=True)  # "dev.pdd_structuring"
    feature_name = Column(String(200), nullable=False)  # "PDD Documentation"
    feature_description = Column(String(500), nullable=True)
    is_included = Column(Boolean, default=True)
    limits = Column(JSON, default={})  # {"max_count": 5, "monthly_limit": 10}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint: one feature per tier
    __table_args__ = (
        UniqueConstraint('tier', 'feature_key', name='uq_tier_feature'),
    )


# Feature key constants for type safety
class FeatureKeys:
    """Constants for feature keys to prevent typos"""
    # Package 0 - Free Analysis
    ANALYSIS_INTAKE_FORM = "analysis.intake_form"
    ANALYSIS_DATA_VALIDATION = "analysis.data_validation"
    ANALYSIS_ELIGIBILITY_SCREENING = "analysis.eligibility_screening"
    ANALYSIS_METHODOLOGY_FIT = "analysis.methodology_fit"
    ANALYSIS_CREDIT_ESTIMATION = "analysis.credit_estimation"
    ANALYSIS_REVENUE_MODELLING = "analysis.revenue_modelling"
    ANALYSIS_TIMELINE_ESTIMATION = "analysis.timeline_estimation"
    ANALYSIS_RISK_FLAGS = "analysis.risk_flags"
    
    # Package 1 - Buyer Sourcing
    BUYER_REQUIREMENT_INTAKE = "buyer.requirement_intake"
    BUYER_SUPPLY_DISCOVERY = "buyer.supply_discovery"
    BUYER_ELIGIBILITY_SCREENING = "buyer.eligibility_screening"
    BUYER_REGISTRY_STATUS = "buyer.registry_status"
    BUYER_COUNTERPARTY_COORDINATION = "buyer.counterparty_coordination"
    BUYER_TRANSFER_COORDINATION = "buyer.transfer_coordination"
    BUYER_TRANSACTION_TRACKING = "buyer.transaction_tracking"
    BUYER_POST_TRANSFER_DOCS = "buyer.post_transfer_docs"
    
    # Package 2 - Developer Registration
    DEV_REGISTRY_ONBOARDING = "dev.registry_onboarding"
    DEV_METHODOLOGY_SELECTION = "dev.methodology_selection"
    DEV_BOUNDARY_DEFINITION = "dev.boundary_definition"
    DEV_BASELINE_STRUCTURING = "dev.baseline_structuring"
    DEV_ADDITIONALITY = "dev.additionality"
    DEV_LEAKAGE_PERMANENCE = "dev.leakage_permanence"
    DEV_PDD_STRUCTURING = "dev.pdd_structuring"
    DEV_SUBMISSION_COORDINATION = "dev.submission_coordination"
    DEV_CLARIFICATION_COORDINATION = "dev.clarification_coordination"
    
    # Package 3 - MRV & Issuance
    MRV_MONITORING_PLAN = "mrv.monitoring_plan"
    MRV_DATA_INGESTION = "mrv.data_ingestion"
    MRV_ER_CALCULATIONS = "mrv.er_calculations"
    MRV_MONITORING_REPORT = "mrv.monitoring_report"
    MRV_VERIFICATION_COORDINATION = "mrv.verification_coordination"
    MRV_CLARIFICATION_RESPONSE = "mrv.clarification_response"
    MRV_ISSUANCE_REQUEST = "mrv.issuance_request"
    MRV_ISSUANCE_TRACKING = "mrv.issuance_tracking"
    MRV_ANNUAL_REPORTING = "mrv.annual_reporting"
    
    # Package 4 - RECs
    REC_REGISTRY_SELECTION = "rec.registry_selection"
    REC_GENERATOR_ONBOARDING = "rec.generator_onboarding"
    REC_ASSET_REGISTRATION = "rec.asset_registration"
    REC_METERING_DATA = "rec.metering_data"
    REC_ISSUANCE_COORDINATION = "rec.issuance_coordination"
    REC_ISSUANCE_TRACKING = "rec.issuance_tracking"
    REC_ANNUAL_SUMMARY = "rec.annual_summary"
    
    # Package 5 - Compliance
    COMPLIANCE_ETS_ASSESSMENT = "compliance.ets_assessment"
    COMPLIANCE_ACCOUNT_SETUP = "compliance.account_setup"
    COMPLIANCE_MONITORING_FRAMEWORK = "compliance.monitoring_framework"
    COMPLIANCE_EMISSIONS_REPORTING = "compliance.emissions_reporting"
    COMPLIANCE_VERIFICATION_COORDINATION = "compliance.verification_coordination"
    COMPLIANCE_SURRENDER_COORDINATION = "compliance.surrender_coordination"
    COMPLIANCE_CALENDAR = "compliance.calendar"
