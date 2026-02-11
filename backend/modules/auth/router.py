from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Any
from datetime import timedelta
from jose import JWTError, jwt

from backend.core.database import get_db
from backend.modules.auth.schemas import UserCreate, UserLogin, Token, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, ProfileUpdate
from backend.modules.auth.service import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

def get_auth_service(db: Session = Depends(get_db)):
    from backend.core.container import container
    return AuthService(db, container.email_service, container.event_bus)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Extract current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    from backend.core.models import User
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, service: AuthService = Depends(get_auth_service)):
    db_user = service.create_user(user)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = service.create_access_token(
        data={"sub": db_user.email, "role": db_user.role, "id": db_user.id}, expires_delta=access_token_expires
    )
    refresh_token = service.create_refresh_token(
        data={"sub": db_user.email, "role": db_user.role, "id": db_user.id}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "refresh_token": refresh_token,
        "user": db_user
    }

@router.post("/login", response_model=Token)
def login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = service.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
    refresh_token = service.create_refresh_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "refresh_token": refresh_token,
        "user": user
    }

@router.post("/developer/login", response_model=Token)
def developer_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    # Specifically for Developer portal to ensure role check
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "DEVELOPER":
        raise HTTPException(status_code=403, detail="Not authorized as Developer")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}

@router.post("/buyer/login", response_model=Token)
def buyer_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    # Specifically for Buyer portal
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Not authorized as Buyer")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
):
    """Update user profile data in database"""
    updated_user = service.update_profile(current_user.id, profile_data.dict())
    return updated_user

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.post("/refresh", response_model=Token)
def refresh_token(request: dict, service: AuthService = Depends(get_auth_service)):
    """Use a refresh token to get a new access token + refresh token pair"""
    refresh_token_str = request.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    
    try:
        payload = jwt.decode(refresh_token_str, SECRET_KEY, algorithms=[ALGORITHM])
        # Verify this is actually a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")
    
    from backend.core.models import User
    user = service.db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Issue new tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = service.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id},
        expires_delta=access_token_expires
    )
    new_refresh_token = service.create_refresh_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": new_refresh_token,
        "user": user,
    }


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    # Always return success message
    # TODO: Implement actual email logic invocation
    return {"message": "If this email is registered, a reset link has been sent."}


@router.post("/superadmin/login", response_model=Token)
def superadmin_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    """Super Admin login with role verification"""
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super admin access required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}


@router.post("/vvb/login", response_model=Token)
def vvb_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    """VVB (Validation & Verification Body) login with role verification"""
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "VVB":
        raise HTTPException(status_code=403, detail="VVB access required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}


@router.post("/registry/login", response_model=Token)
def registry_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    """Registry Officer login with role verification"""
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "REGISTRY":
        raise HTTPException(status_code=403, detail="Registry access required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}


@router.post("/admin/login", response_model=Token)
def admin_login(form_data: UserLogin, service: AuthService = Depends(get_auth_service)):
    """Admin (Platform Administrator) login with role verification"""
    user = service.authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = service.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = service.create_refresh_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "user": user}
