"""
Super Admin Seeding Script

Creates the initial super admin user for the CredoCarbon platform.
Credentials are read from environment variables for security.

Usage:
    cd apps/api
    python -m scripts.seed_superadmin
    
Environment Variables:
    SUPERADMIN_EMAIL (default: superadmin@credocarbon.com)
    SUPERADMIN_PASSWORD (default: SuperAdmin@123)
    SUPERADMIN_NAME (default: Super Admin)
"""
import sys
import os

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from dotenv import load_dotenv
load_dotenv()

from passlib.context import CryptContext
from apps.api.core.database import SessionLocal, engine, Base
from apps.api.core.models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_superadmin():
    """Create the initial super admin user"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if super admin already exists
        existing = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing:
            print(f"Super admin already exists: {existing.email}")
            return
        
        # Read credentials from environment variables
        email = os.getenv("SUPERADMIN_EMAIL", "superadmin@credocarbon.com")
        password = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123")
        name = os.getenv("SUPERADMIN_NAME", "Super Admin")
        
        # Hash password
        hashed_password = pwd_context.hash(password)
        
        # Create super admin user
        superadmin = User(
            email=email,
            password_hash=hashed_password,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
            profile_data={
                "name": name,
                "permission_level": "FULL_ACCESS"
            }
        )
        
        db.add(superadmin)
        db.commit()
        
        print("=" * 50)
        print("Super Admin Created Successfully!")
        print("=" * 50)
        print(f"Email: {email}")
        print(f"Name: {name}")
        print("=" * 50)
        print("Credentials configured via environment variables.")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error creating super admin: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_superadmin()

