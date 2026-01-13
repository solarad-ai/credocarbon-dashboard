"""
Seed Data Script for CredoCarbon Platform
Creates test users and sample data for all tables
Run with: python -m apps.api.seed_data
"""
import os
import sys
from datetime import datetime, timedelta

# Ensure imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from backend.core.database import SessionLocal, engine, Base
from backend.core.models import (
    User, UserRole, Project, ProjectStatus,
    Notification, NotificationType,
    CreditHolding, Transaction, TransactionType, TransactionStatus,
    Retirement, RetirementStatus,
    MarketListing, ListingStatus, Offer, OfferStatus
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_users(db: Session):
    """Create test users"""
    
    developer = db.query(User).filter(User.email == "developer@test.com").first()
    buyer = db.query(User).filter(User.email == "buyer@test.com").first()
    
    if not developer:
        developer = User(
            email="developer@test.com",
            password_hash=get_password_hash("Test123!"),
            role=UserRole.DEVELOPER,
            profile_data={
                "name": "John Developer",
                "company": "GreenTech Renewables",
                "phone": "+91-9876543210",
                "designation": "Project Manager"
            },
            is_active=True,
            is_verified=True
        )
        db.add(developer)
        print("✓ Created developer: developer@test.com / Test123!")
    else:
        print("• Developer exists: developer@test.com")
    
    if not buyer:
        buyer = User(
            email="buyer@test.com",
            password_hash=get_password_hash("Test123!"),
            role=UserRole.BUYER,
            profile_data={
                "name": "Jane Buyer",
                "company": "EcoFund Partners",
                "phone": "+91-9876543211",
                "designation": "Sustainability Lead"
            },
            is_active=True,
            is_verified=True
        )
        db.add(buyer)
        print("✓ Created buyer: buyer@test.com / Test123!")
    else:
        print("• Buyer exists: buyer@test.com")
    
    db.commit()
    return db.query(User).filter(User.email == "developer@test.com").first(), \
           db.query(User).filter(User.email == "buyer@test.com").first()

def seed_projects(db: Session, developer: User):
    """Create sample projects"""
    
    projects = [
        ("Gujarat Solar Park Phase II", "PRJ-001-SOLAR", "solar", ProjectStatus.ISSUED),
        ("Karnataka Wind Farm", "PRJ-002-WIND", "wind", ProjectStatus.VERIFICATION_APPROVED),
        ("Maharashtra Biogas Plant", "PRJ-003-BIO", "biogas", ProjectStatus.VALIDATION_PENDING),
    ]
    
    created = []
    for name, code, ptype, status in projects:
        existing = db.query(Project).filter(Project.code == code).first()
        if not existing:
            project = Project(
                developer_id=developer.id,
                project_type=ptype,
                status=status,
                wizard_step="5",
                wizard_data={
                    "basic_info": {"name": name, "location": "India"},
                    "credit_estimation": {"registry": "VCS", "methodology": "ACM0002"}
                },
                name=name,
                code=code
            )
            db.add(project)
            created.append(project)
            print(f"✓ Created project: {name}")
        else:
            created.append(existing)
            print(f"• Project exists: {name}")
    
    db.commit()
    return [db.query(Project).filter(Project.code == p[1]).first() for p in projects]

def seed_holdings(db: Session, developer: User, buyer: User, projects):
    """Create credit holdings"""
    
    # Developer holdings (issued credits)
    if not db.query(CreditHolding).filter(CreditHolding.user_id == developer.id).first():
        holdings = [
            CreditHolding(
                user_id=developer.id,
                project_id=projects[0].id,
                vintage=2024,
                quantity=20145,
                available=17625,
                locked=2520,
                serial_start="VCS-001-2024-IN-00001",
                serial_end="VCS-001-2024-IN-20145",
                unit_price=850  # $8.50 in cents
            ),
            CreditHolding(
                user_id=developer.id,
                project_id=projects[1].id if len(projects) > 1 else projects[0].id,
                vintage=2023,
                quantity=15000,
                available=12000,
                locked=3000,
                serial_start="VCS-002-2023-IN-00001",
                serial_end="VCS-002-2023-IN-15000",
                unit_price=1200  # $12.00 in cents
            ),
        ]
        for h in holdings:
            db.add(h)
        print("✓ Created developer holdings")
    else:
        print("• Developer holdings exist")
    
    # Buyer holdings (purchased credits)
    if not db.query(CreditHolding).filter(CreditHolding.user_id == buyer.id).first():
        buyer_holding = CreditHolding(
            user_id=buyer.id,
            project_id=projects[0].id,
            vintage=2023,
            quantity=3000,
            available=3000,
            locked=0,
            serial_start="VCS-001-2023-IN-00001",
            serial_end="VCS-001-2023-IN-03000",
            unit_price=850
        )
        db.add(buyer_holding)
        print("✓ Created buyer holdings")
    else:
        print("• Buyer holdings exist")
    
    db.commit()

def seed_notifications(db: Session, developer: User, buyer: User):
    """Create sample notifications"""
    
    if not db.query(Notification).filter(Notification.user_id == developer.id).first():
        dev_notifications = [
            Notification(user_id=developer.id, type=NotificationType.ISSUANCE, title="Credits Issued", 
                        message="10,625 VCUs have been issued for Gujarat Solar Park Phase II",
                        link="/dashboard/developer/lifecycle/issuance"),
            Notification(user_id=developer.id, type=NotificationType.VERIFICATION, title="Verification Complete",
                        message="MP1 verification approved for Karnataka Wind Farm",
                        link="/dashboard/developer/lifecycle/verification"),
            Notification(user_id=developer.id, type=NotificationType.MARKET, title="New Offer Received",
                        message="Carbon Buyer Co. wants to purchase 500 credits at $8.50/ton",
                        link="/dashboard/developer/market/sell-orders", read=True),
        ]
        for n in dev_notifications:
            db.add(n)
        print("✓ Created developer notifications")
    
    if not db.query(Notification).filter(Notification.user_id == buyer.id).first():
        buyer_notifications = [
            Notification(user_id=buyer.id, type=NotificationType.PURCHASE, title="Purchase Complete",
                        message="Successfully purchased 1,000 VCUs from Gujarat Solar Park",
                        link="/dashboard/buyer/wallet"),
            Notification(user_id=buyer.id, type=NotificationType.MARKET, title="Price Alert",
                        message="VCS credits dropped 5% - now averaging $8.50/ton",
                        link="/dashboard/buyer/marketplace"),
            Notification(user_id=buyer.id, type=NotificationType.RETIREMENT, title="Retirement Processed",
                        message="500 credits retired and certificate generated",
                        link="/dashboard/buyer/retirements", read=True),
        ]
        for n in buyer_notifications:
            db.add(n)
        print("✓ Created buyer notifications")
    
    db.commit()

def seed_retirements(db: Session, buyer: User, projects):
    """Create sample retirements"""
    
    if not db.query(Retirement).filter(Retirement.user_id == buyer.id).first():
        retirements = [
            Retirement(
                user_id=buyer.id,
                project_id=projects[0].id,
                certificate_id="RET-2024-001",
                quantity=2000,
                vintage=2023,
                beneficiary="Acme Corporation",
                beneficiary_address="Mumbai, India",
                purpose="Annual Carbon Neutrality",
                serial_range="VCS-SOL-2023-00001 to VCS-SOL-2023-02000",
                status=RetirementStatus.COMPLETED,
                retirement_date=datetime.utcnow() - timedelta(days=5)
            ),
            Retirement(
                user_id=buyer.id,
                project_id=projects[0].id,
                certificate_id="RET-2024-002",
                quantity=1000,
                vintage=2023,
                beneficiary="Acme Corporation",
                beneficiary_address="Mumbai, India",
                purpose="Event Offset - Annual Conference",
                serial_range="VCS-SOL-2023-02001 to VCS-SOL-2023-03000",
                status=RetirementStatus.COMPLETED,
                retirement_date=datetime.utcnow() - timedelta(days=20)
            ),
            Retirement(
                user_id=buyer.id,
                project_id=projects[0].id,
                certificate_id=None,
                quantity=500,
                vintage=2024,
                beneficiary="Acme Corporation",
                beneficiary_address="Mumbai, India",
                purpose="Q4 2024 Offset",
                serial_range="VCS-SOL-2024-00001 to VCS-SOL-2024-00500",
                status=RetirementStatus.PENDING
            ),
        ]
        for r in retirements:
            db.add(r)
        print("✓ Created retirements")
    else:
        print("• Retirements exist")
    
    db.commit()

def seed_listings(db: Session, developer: User, projects):
    """Create sample market listings"""
    
    if not db.query(MarketListing).first():
        holdings = db.query(CreditHolding).filter(CreditHolding.user_id == developer.id).all()
        if holdings:
            listing = MarketListing(
                seller_id=developer.id,
                project_id=projects[0].id,
                holding_id=holdings[0].id,
                vintage=2024,
                quantity=5000,
                quantity_sold=0,
                price_per_ton_cents=850,
                min_quantity=100,
                status=ListingStatus.ACTIVE,
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            db.add(listing)
            print("✓ Created market listing")
    else:
        print("• Listings exist")
    
    db.commit()

def seed_transactions(db: Session, developer: User, buyer: User, projects):
    """Create sample transactions"""
    
    if not db.query(Transaction).first():
        transactions = [
            Transaction(
                user_id=developer.id,
                type=TransactionType.ISSUANCE,
                status=TransactionStatus.COMPLETED,
                quantity=10625,
                project_id=projects[0].id,
                notes="Vintage 2024 issuance",
                completed_at=datetime.utcnow() - timedelta(days=2)
            ),
            Transaction(
                user_id=developer.id,
                type=TransactionType.SALE,
                status=TransactionStatus.COMPLETED,
                quantity=500,
                project_id=projects[0].id,
                counterparty_id=buyer.id,
                amount_cents=425000,  # $4,250
                notes="Sale to Acme Corporation",
                completed_at=datetime.utcnow() - timedelta(days=5)
            ),
            Transaction(
                user_id=buyer.id,
                type=TransactionType.PURCHASE,
                status=TransactionStatus.COMPLETED,
                quantity=500,
                project_id=projects[0].id,
                counterparty_id=developer.id,
                amount_cents=425000,
                notes="Purchase from GreenTech Renewables",
                completed_at=datetime.utcnow() - timedelta(days=5)
            ),
            Transaction(
                user_id=buyer.id,
                type=TransactionType.RETIREMENT,
                status=TransactionStatus.COMPLETED,
                quantity=200,
                project_id=projects[0].id,
                notes="Annual carbon neutrality",
                completed_at=datetime.utcnow() - timedelta(days=10)
            ),
        ]
        for t in transactions:
            db.add(t)
        print("✓ Created transactions")
    else:
        print("• Transactions exist")
    
    db.commit()

def main():
    print("\n" + "="*50)
    print("  CredoCarbon - Seed Data Script")
    print("="*50 + "\n")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created/verified\n")
    
    db = SessionLocal()
    
    try:
        print("Creating test users...")
        developer, buyer = seed_users(db)
        print()
        
        print("Creating projects...")
        projects = seed_projects(db, developer)
        print()
        
        print("Creating credit holdings...")
        seed_holdings(db, developer, buyer, projects)
        print()
        
        print("Creating notifications...")
        seed_notifications(db, developer, buyer)
        print()
        
        print("Creating retirements...")
        seed_retirements(db, buyer, projects)
        print()
        
        print("Creating market listings...")
        seed_listings(db, developer, projects)
        print()
        
        print("Creating transactions...")
        seed_transactions(db, developer, buyer, projects)
        print()
        
        print("="*50)
        print("  Seed data complete!")
        print("="*50)
        print("\n  Test Credentials:")
        print("  ─────────────────────────────────────")
        print("  Developer: developer@test.com / Test123!")
        print("  Buyer:     buyer@test.com / Test123!")
        print("  ─────────────────────────────────────\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
