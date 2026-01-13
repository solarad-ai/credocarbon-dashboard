"""
Seed Default Tier Features
Run this script to populate the tier_features table with default features for each tier
Usage: python -m apps.api.scripts.seed_tier_features
"""
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))))

# Import all models first to ensure consistent mapper initialization
from backend.core.models import User  # noqa - ensure User is loaded first
from backend.core.database import SessionLocal, Base, engine
from backend.modules.subscription.models import SubscriptionTier, TierFeature, Subscription, FeatureKeys

# Create all tables
Base.metadata.create_all(bind=engine)


# Feature definitions by tier
TIER_FEATURES = {
    # Package 0 - Free Analysis (Pre-Engagement)
    SubscriptionTier.FREE_ANALYSIS: [
        (FeatureKeys.ANALYSIS_INTAKE_FORM, "Project Intake Form", "Submit project/asset details for analysis"),
        (FeatureKeys.ANALYSIS_DATA_VALIDATION, "Data Validation", "Basic data completeness validation"),
        (FeatureKeys.ANALYSIS_ELIGIBILITY_SCREENING, "Eligibility Screening", "Registry and scheme eligibility assessment"),
        (FeatureKeys.ANALYSIS_METHODOLOGY_FIT, "Methodology Fit", "High-level methodology fit assessment"),
        (FeatureKeys.ANALYSIS_CREDIT_ESTIMATION, "Credit Estimation", "Indicative credit volume estimation"),
        (FeatureKeys.ANALYSIS_REVENUE_MODELLING, "Revenue Modelling", "Range-based revenue projections"),
        (FeatureKeys.ANALYSIS_TIMELINE_ESTIMATION, "Timeline Estimation", "High-level timeline estimates"),
        (FeatureKeys.ANALYSIS_RISK_FLAGS, "Risk Flags", "Key risk identification (data gaps, methodology, geography)"),
    ],
    
    # Package 1 - Buyer Sourcing & Execution
    SubscriptionTier.BUYER_SOURCING: [
        (FeatureKeys.BUYER_REQUIREMENT_INTAKE, "Requirement Intake", "Volume, vintage, registry, eligibility requirements"),
        (FeatureKeys.BUYER_SUPPLY_DISCOVERY, "Supply Discovery", "Search across supported registries"),
        (FeatureKeys.BUYER_ELIGIBILITY_SCREENING, "Eligibility Screening", "Documentation and eligibility screening"),
        (FeatureKeys.BUYER_REGISTRY_STATUS, "Registry Status", "Issuance, encumbrance, vintage checks"),
        (FeatureKeys.BUYER_COUNTERPARTY_COORDINATION, "Counterparty Coordination", "Seller-side coordination"),
        (FeatureKeys.BUYER_TRANSFER_COORDINATION, "Transfer Coordination", "Registry transfer/retirement coordination"),
        (FeatureKeys.BUYER_TRANSACTION_TRACKING, "Transaction Tracking", "End-to-end transaction tracking"),
        (FeatureKeys.BUYER_POST_TRANSFER_DOCS, "Post-Transfer Docs", "Post-transfer documentation package"),
    ],
    
    # Package 2 - Developer Project Registration
    SubscriptionTier.DEV_REGISTRATION: [
        (FeatureKeys.DEV_REGISTRY_ONBOARDING, "Registry Onboarding", "Registry selection and onboarding support"),
        (FeatureKeys.DEV_METHODOLOGY_SELECTION, "Methodology Selection", "Methodology selection and justification"),
        (FeatureKeys.DEV_BOUNDARY_DEFINITION, "Boundary Definition", "Project boundary definition"),
        (FeatureKeys.DEV_BASELINE_STRUCTURING, "Baseline Structuring", "Baseline scenario structuring"),
        (FeatureKeys.DEV_ADDITIONALITY, "Additionality", "Additionality argument structuring"),
        (FeatureKeys.DEV_LEAKAGE_PERMANENCE, "Leakage & Permanence", "Leakage and permanence considerations"),
        (FeatureKeys.DEV_PDD_STRUCTURING, "PDD Structuring", "Project documentation structuring"),
        (FeatureKeys.DEV_SUBMISSION_COORDINATION, "Submission Coordination", "Registry submission coordination"),
        (FeatureKeys.DEV_CLARIFICATION_COORDINATION, "Clarification Coordination", "Clarification round management"),
    ],
    
    # Package 3 - Developer MRV, Verification & Issuance
    SubscriptionTier.DEV_MRV: [
        (FeatureKeys.MRV_MONITORING_PLAN, "Monitoring Plan", "Monitoring plan alignment"),
        (FeatureKeys.MRV_DATA_INGESTION, "Data Ingestion", "Client data ingestion and structuring"),
        (FeatureKeys.MRV_ER_CALCULATIONS, "ER Calculations", "Emission reduction calculations"),
        (FeatureKeys.MRV_MONITORING_REPORT, "Monitoring Report", "Monitoring report structuring"),
        (FeatureKeys.MRV_VERIFICATION_COORDINATION, "Verification Coordination", "VVB coordination"),
        (FeatureKeys.MRV_CLARIFICATION_RESPONSE, "Clarification Response", "Clarification response coordination"),
        (FeatureKeys.MRV_ISSUANCE_REQUEST, "Issuance Request", "Issuance request submission"),
        (FeatureKeys.MRV_ISSUANCE_TRACKING, "Issuance Tracking", "Issuance tracking"),
        (FeatureKeys.MRV_ANNUAL_REPORTING, "Annual Reporting", "Annual reporting archive"),
    ],
    
    # Package 4 - Renewable Energy Certificates
    SubscriptionTier.REC: [
        (FeatureKeys.REC_REGISTRY_SELECTION, "Registry Selection", "I-REC, GO, TIGR registry selection"),
        (FeatureKeys.REC_GENERATOR_ONBOARDING, "Generator Onboarding", "Generator onboarding support"),
        (FeatureKeys.REC_ASSET_REGISTRATION, "Asset Registration", "Asset registration coordination"),
        (FeatureKeys.REC_METERING_DATA, "Metering Data", "Metering data structuring"),
        (FeatureKeys.REC_ISSUANCE_COORDINATION, "Issuance Coordination", "Issuance request coordination"),
        (FeatureKeys.REC_ISSUANCE_TRACKING, "Issuance Tracking", "Certificate issuance tracking"),
        (FeatureKeys.REC_ANNUAL_SUMMARY, "Annual Summary", "Annual issuance summary reports"),
    ],
    
    # Package 5 - Compliance & ETS Support
    SubscriptionTier.COMPLIANCE: [
        (FeatureKeys.COMPLIANCE_ETS_ASSESSMENT, "ETS Assessment", "ETS scheme applicability assessment"),
        (FeatureKeys.COMPLIANCE_ACCOUNT_SETUP, "Account Setup", "Account setup coordination"),
        (FeatureKeys.COMPLIANCE_MONITORING_FRAMEWORK, "Monitoring Framework", "Monitoring framework alignment"),
        (FeatureKeys.COMPLIANCE_EMISSIONS_REPORTING, "Emissions Reporting", "Annual emissions reporting structuring"),
        (FeatureKeys.COMPLIANCE_VERIFICATION_COORDINATION, "Verification Coordination", "Verification coordination"),
        (FeatureKeys.COMPLIANCE_SURRENDER_COORDINATION, "Surrender Coordination", "Allowance surrender coordination"),
        (FeatureKeys.COMPLIANCE_CALENDAR, "Compliance Calendar", "Compliance calendar management"),
    ],
}


def seed_tier_features():
    """Seed all tier features"""
    db = SessionLocal()
    
    try:
        # Clear existing features (optional - comment out if you want to keep existing)
        # db.query(TierFeature).delete()
        # db.commit()
        
        created_count = 0
        skipped_count = 0
        
        for tier, features in TIER_FEATURES.items():
            for feature_key, feature_name, description in features:
                # Check if feature already exists
                existing = db.query(TierFeature).filter(
                    TierFeature.tier == tier,
                    TierFeature.feature_key == feature_key
                ).first()
                
                if existing:
                    skipped_count += 1
                    print(f"  Skipped (exists): {tier.value} - {feature_key}")
                    continue
                
                feature = TierFeature(
                    tier=tier,
                    feature_key=feature_key,
                    feature_name=feature_name,
                    feature_description=description,
                    is_included=True,
                    limits={}
                )
                db.add(feature)
                created_count += 1
                print(f"  Created: {tier.value} - {feature_key}")
        
        db.commit()
        print(f"\n✅ Seeding complete: {created_count} created, {skipped_count} skipped")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding tier features: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding tier features...")
    seed_tier_features()
