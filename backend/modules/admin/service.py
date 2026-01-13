"""Admin module service for dashboard and data access"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import math

from backend.core.models import User, Project, Transaction, CreditHolding, MarketListing


class AdminService:
    """Service for admin dashboard and data access operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self) -> dict:
        """Get dashboard statistics for admin overview"""
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        active_users = self.db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
        total_projects = self.db.query(func.count(Project.id)).scalar() or 0
        total_transactions = self.db.query(func.count(Transaction.id)).scalar() or 0
        
        # Count users by role
        user_counts = {}
        for role in ["DEVELOPER", "BUYER", "VVB", "REGISTRY", "ADMIN"]:
            count = self.db.query(func.count(User.id)).filter(User.role == role).scalar() or 0
            user_counts[role.lower()] = count
        
        # Count projects by status
        project_statuses = self.db.query(
            Project.status, func.count(Project.id)
        ).group_by(Project.status).all()
        status_counts = {status: count for status, count in project_statuses}
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_projects": total_projects,
            "total_transactions": total_transactions,
            "user_counts": user_counts,
            "project_status_counts": status_counts,
        }
    
    def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> dict:
        """Get paginated list of users (read-only)"""
        query = self.db.query(User)
        
        # Exclude SUPER_ADMIN from admin view
        query = query.filter(User.role != "SUPER_ADMIN")
        
        if role:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if search:
            query = query.filter(User.email.ilike(f"%{search}%"))
        
        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "users": users,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        }
    
    def get_user_detail(self, user_id: int) -> Optional[User]:
        """Get detailed user information"""
        return self.db.query(User).filter(User.id == user_id, User.role != "SUPER_ADMIN").first()
    
    def get_projects(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> dict:
        """Get paginated list of projects for monitoring"""
        query = self.db.query(Project)
        
        if status:
            query = query.filter(Project.status == status)
        if search:
            query = query.filter(Project.name.ilike(f"%{search}%"))
        
        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        projects = query.order_by(Project.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "projects": projects,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        }
    
    def get_transactions(
        self,
        page: int = 1,
        page_size: int = 20,
        tx_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> dict:
        """Get paginated list of transactions"""
        query = self.db.query(Transaction)
        
        if tx_type:
            query = query.filter(Transaction.transaction_type == tx_type)
        if status:
            query = query.filter(Transaction.status == status)
        
        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        transactions = query.order_by(Transaction.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "transactions": transactions,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        }
