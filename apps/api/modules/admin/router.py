"""Admin module router for platform administration endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from apps.api.core.database import get_db
from apps.api.core.models import User
from apps.api.modules.admin.dependencies import get_current_admin
from apps.api.modules.admin.service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


def get_service(db: Session = Depends(get_db)):
    return AdminService(db)


# ===== Dashboard =====

@router.get("/dashboard/stats")
def get_dashboard_stats(
    admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_service)
):
    """Get dashboard statistics for admin overview"""
    return service.get_dashboard_stats()


# ===== User Management (Read-Only) =====

@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_service)
):
    """Get paginated list of users (read-only, excludes SuperAdmins)"""
    result = service.get_users(
        page=page,
        page_size=page_size,
        role=role,
        search=search,
        is_active=is_active
    )
    
    # Convert users to dict for JSON response
    users_data = []
    for user in result["users"]:
        users_data.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "profile_data": user.profile_data,
        })
    
    return {
        "users": users_data,
        "page": result["page"],
        "page_size": result["page_size"],
        "total": result["total"],
        "total_pages": result["total_pages"],
    }


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: int,
    admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_service)
):
    """Get detailed user information"""
    user = service.get_user_detail(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile_data": user.profile_data,
    }


# ===== Project Monitoring =====

@router.get("/projects")
def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_service)
):
    """Get paginated list of projects for monitoring"""
    result = service.get_projects(
        page=page,
        page_size=page_size,
        status=status,
        search=search
    )
    
    # Convert projects to dict for JSON response
    projects_data = []
    for project in result["projects"]:
        projects_data.append({
            "id": project.id,
            "name": project.name,
            "developer_id": project.developer_id,
            "status": project.status,
            "registry": project.registry,
            "project_type": project.project_type,
            "country": project.country,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        })
    
    return {
        "projects": projects_data,
        "page": result["page"],
        "page_size": result["page_size"],
        "total": result["total"],
        "total_pages": result["total_pages"],
    }


# ===== Transaction Monitoring =====

@router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tx_type: Optional[str] = None,
    status: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    service: AdminService = Depends(get_service)
):
    """Get paginated list of transactions"""
    result = service.get_transactions(
        page=page,
        page_size=page_size,
        tx_type=tx_type,
        status=status
    )
    
    # Convert transactions to dict for JSON response
    transactions_data = []
    for tx in result["transactions"]:
        transactions_data.append({
            "id": tx.id,
            "transaction_type": tx.transaction_type,
            "status": tx.status,
            "quantity": tx.quantity,
            "price_per_credit": float(tx.price_per_credit) if tx.price_per_credit else None,
            "total_amount": float(tx.total_amount) if tx.total_amount else None,
            "buyer_id": tx.buyer_id,
            "seller_id": tx.seller_id,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        })
    
    return {
        "transactions": transactions_data,
        "page": result["page"],
        "page_size": result["page_size"],
        "total": result["total"],
        "total_pages": result["total_pages"],
    }
