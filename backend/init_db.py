"""
Database Initialization Script
Creates all tables without seeding data
Run with: python -m apps.api.init_db
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from dotenv import load_dotenv
load_dotenv()

from backend.core.database import engine, Base
# Import all models to register them with Base
from backend.core.models import (
    User, Project, Document, AuditLog,
    Notification, CreditHolding, Transaction, Retirement,
    MarketListing, Offer
)
# Import generation module models
from backend.modules.generation.models import (
    UploadedFile, DatasetMapping, GenerationTimeseries, 
    CreditEstimation, GridEmissionFactor
)

def init_database():
    print("\n" + "="*50)
    print("  CredoCarbon - Database Initialization")
    print("="*50 + "\n")
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully!\n")
    
    print("="*50)
    print("  Database is ready (no data seeded)")
    print("="*50 + "\n")

if __name__ == "__main__":
    init_database()
