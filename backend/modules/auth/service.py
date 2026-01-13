from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.core.models import User, UserRole, AuditLog
from backend.core.ports import EmailPort, EventBusPort
from backend.modules.auth.schemas import UserCreate

# Config - move to settings later
SECRET_KEY = "dev_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session, email_service: EmailPort, event_bus: EventBusPort):
        self.db = db
        self.email_service = email_service
        self.event_bus = event_bus

    def verify_password(self, plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password):
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def create_user(self, user: UserCreate):
        # Check if user exists
        db_user = self.db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        hashed_password = self.get_password_hash(user.password)
        
        # Prepare profile data from extra fields
        profile_data = user.dict(exclude={"email", "password", "role"})
        
        db_user = User(
            email=user.email,
            password_hash=hashed_password,
            role=user.role,
            profile_data=profile_data
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        # Audit Log
        from backend.core.models import AuditLog
        self.db.add(AuditLog(actor_id=db_user.id, action="SIGNUP", entity_type="USER", entity_id=str(db_user.id), details={"role": user.role}))
        self.db.commit()

        return db_user

    def authenticate_user(self, email: str, password: str):
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return False
        if not self.verify_password(password, user.password_hash):
            return False
        return user

    def update_profile(self, user_id: int, profile_data: dict):
        """Update user's profile data in the database"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Merge new data with existing profile_data
        existing_data = user.profile_data or {}
        # Filter out None values from the update
        new_data = {k: v for k, v in profile_data.items() if v is not None}
        merged_data = {**existing_data, **new_data}
        
        user.profile_data = merged_data
        self.db.commit()
        self.db.refresh(user)
        
        return user

    def get_user_by_id(self, user_id: int):
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
