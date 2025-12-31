"""
Seed Admin and VVB Users Script

Creates Super Admin and VVB users with specified credentials.

Usage:
    cd /Users/sidhantrajpoot/Desktop/Solarad_workspace/credo-carbon
    source venv/bin/activate
    python -m apps.api.scripts.seed_admin_vvb
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


def create_admin_and_vvb():
    """Create Super Admin, VVB, Platform Admin, and Registry Admin users"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Credentials
        base_email = "siddhantrajput007@gmail.com"
        password = "12345@"
        hashed_password = pwd_context.hash(password)
        
        print("\n" + "="*60)
        print("  CredoCarbon - Admin Users Creation")
        print("="*60 + "\n")
        
        # Check if user with this email already exists
        existing_user = db.query(User).filter(User.email == base_email).first()
        
        if existing_user:
            print(f"⚠ User already exists with email: {base_email}")
            print(f"  Current role: {existing_user.role}")
            print("  Updating password and ensuring all admin roles exist...\n")
            
            # Update existing user's password
            existing_user.password_hash = hashed_password
            existing_user.is_active = True
            existing_user.is_verified = True
            db.commit()
            print(f"✓ Updated password for {existing_user.role} user")
        
        # Define all admin roles to create
        admin_roles = [
            {
                "suffix": "+admin",
                "role": UserRole.SUPER_ADMIN,
                "profile": {
                    "name": "Siddhant Rajput",
                    "permission_level": "FULL_ACCESS",
                    "company": "CredoCarbon"
                },
                "label": "Super Admin"
            },
            {
                "suffix": "+vvb",
                "role": UserRole.VVB,
                "profile": {
                    "name": "Siddhant Rajput",
                    "company": "CredoCarbon VVB",
                    "accreditation": "ISO 14065",
                    "phone": "+91-XXXXXXXXXX"
                },
                "label": "VVB"
            },
            {
                "suffix": "+platformadmin",
                "role": UserRole.ADMIN,
                "profile": {
                    "name": "Siddhant Rajput",
                    "company": "CredoCarbon",
                    "department": "Platform Administration",
                    "permission_level": "PLATFORM_ADMIN"
                },
                "label": "Platform Admin"
            },
            {
                "suffix": "+registry",
                "role": UserRole.REGISTRY,
                "profile": {
                    "name": "Siddhant Rajput",
                    "company": "CredoCarbon Registry",
                    "registry_name": "CredoCarbon Registry",
                    "accreditation": "ISO 14064-2"
                },
                "label": "Registry Admin"
            }
        ]
        
        # Create or update each admin role
        for admin in admin_roles:
            email = base_email.replace("@", f"{admin['suffix']}@")
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                user = User(
                    email=email,
                    password_hash=hashed_password,
                    role=admin['role'],
                    is_active=True,
                    is_verified=True,
                    profile_data=admin['profile']
                )
                db.add(user)
                db.commit()
                print(f"✓ {admin['label']} created: {email}")
            else:
                user.password_hash = hashed_password
                user.is_active = True
                user.is_verified = True
                db.commit()
                print(f"✓ {admin['label']} password updated: {email}")
        
        print("\n" + "="*60)
        print("  All Admin Users Created/Updated Successfully!")
        print("="*60)
        print(f"\n  Password for all accounts: {password}")
        print("\n  Login Credentials:")
        print("  ─────────────────────────────────────────────────────")
        
        # Show all accounts
        all_users = db.query(User).filter(
            User.email.like(f"%{base_email.split('@')[0]}%")
        ).all()
        
        for user in all_users:
            print(f"  • {user.role.value:15} → {user.email}")
        
        print("  ─────────────────────────────────────────────────────")
        print("\n  Note: Gmail supports '+' aliases, so all emails")
        print("  will be delivered to the same inbox!")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error creating users: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_and_vvb()
