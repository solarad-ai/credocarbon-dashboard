"""
Database Cleanup Script
Drops all data and recreates empty tables
Run with: python -m apps.api.cleanup_db
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from dotenv import load_dotenv
load_dotenv()

from backend.core.database import engine, Base
from backend.core.models import (
    User, Project, Document, AuditLog,
    Notification, CreditHolding, Transaction, Retirement,
    MarketListing, Offer
)

def cleanup_database():
    print("\n" + "="*50)
    print("  CredoCarbon - Database Cleanup")
    print("="*50 + "\n")
    
    # Drop all tables
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped\n")
    
    # Recreate all tables
    print("Recreating empty tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables recreated\n")
    
    print("="*50)
    print("  Database is now clean and empty!")
    print("="*50)
    print("\n  You can now seed data manually or run:")
    print("  python -m apps.api.seed_data")
    print()

if __name__ == "__main__":
    confirm = input("This will DELETE ALL DATA. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        cleanup_database()
    else:
        print("Cancelled.")
