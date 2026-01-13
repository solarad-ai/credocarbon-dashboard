from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from backend.core.database import get_db
from backend.core.models import User
from backend.modules.superadmin.dependencies import get_current_superadmin
from backend.modules.superadmin.service import SuperAdminService
from backend.modules.superadmin.schemas import (
    DashboardStats, ActivityItem, UserListItem, UserDetail, UserUpdate,
    AdminCreate, ProjectListItem, ProjectStatusUpdate, TransactionListItem,
    ListingListItem, RetirementListItem, AuditLogItem, HealthStatus,
    BroadcastNotification, PlatformAnalytics, PaginatedResponse,
    TaskCreate, TaskUpdate, TaskListItem,
    RegistryCreate, RegistryUpdate, RegistryItem,
    ProjectTypeCreate, ProjectTypeUpdate, ProjectTypeItem,
    FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagItem,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementItem,
    PlatformFeeCreate, PlatformFeeUpdate, PlatformFeeItem,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateItem
)

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


def get_service(db: Session = Depends(get_db)) -> SuperAdminService:
    return SuperAdminService(db)


# ===== Dashboard =====
@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get dashboard statistics"""
    return service.get_dashboard_stats()


@router.get("/activity")
def get_recent_activity(
    limit: int = Query(20, le=100),
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get recent activity feed"""
    return service.get_recent_activity(limit)


# ===== User Management =====
@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of users"""
    users, total = service.get_users(page, page_size, role, search, is_active)
    return {
        "items": [UserListItem.from_orm(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


@router.get("/users/{user_id}", response_model=UserDetail)
def get_user_detail(
    user_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get detailed user information"""
    user = service.get_user_detail(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    update_data: UserUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update user information"""
    user = service.update_user(user_id, update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully", "user_id": user_id}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Deactivate a user"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    success = service.deactivate_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deactivated successfully"}


# ===== Admin Management =====
@router.post("/admins")
def create_admin(
    admin_data: AdminCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service),
    db: Session = Depends(get_db)
):
    """Create a new admin user"""
    # Check if email already exists
    existing = db.query(User).filter(User.email == admin_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_admin = service.create_admin(admin_data)
    return {"message": "Admin created successfully", "admin_id": new_admin.id}


@router.post("/vvb-users")
def create_vvb_user(
    vvb_data: AdminCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service),
    db: Session = Depends(get_db)
):
    """Create a new VVB user"""
    from backend.modules.auth.service import AuthService, get_password_hash
    from backend.core.models import UserRole
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == vvb_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create VVB user
    profile = vvb_data.profile_data or {}
    vvb_user = User(
        email=vvb_data.email,
        password_hash=get_password_hash(vvb_data.password),
        role=UserRole.VVB,
        is_active=True,
        is_verified=True,
        profile_data={"name": profile.get("name", ""), "organization": profile.get("organization", "")}
    )
    db.add(vvb_user)
    db.commit()
    db.refresh(vvb_user)
    
    return {"message": "VVB user created successfully", "vvb_user_id": vvb_user.id, "email": vvb_user.email}


@router.post("/registry-users")
def create_registry_user(
    registry_data: AdminCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service),
    db: Session = Depends(get_db)
):
    """Create a new Registry user"""
    from backend.modules.auth.service import AuthService, get_password_hash
    from backend.core.models import UserRole
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == registry_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Registry user
    profile = registry_data.profile_data or {}
    registry_user = User(
        email=registry_data.email,
        password_hash=get_password_hash(registry_data.password),
        role=UserRole.REGISTRY,
        is_active=True,
        is_verified=True,
        profile_data={"name": profile.get("name", ""), "organization": profile.get("organization", "")}
    )
    db.add(registry_user)
    db.commit()
    db.refresh(registry_user)
    
    return {"message": "Registry user created successfully", "registry_user_id": registry_user.id, "email": registry_user.email}


# ===== Project Management =====
@router.get("/projects")
def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of projects"""
    projects, total = service.get_projects(page, page_size, status, search)
    return {
        "items": projects,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


@router.put("/projects/{project_id}/status")
def update_project_status(
    project_id: int,
    status_update: ProjectStatusUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update project status"""
    project = service.update_project_status(project_id, status_update)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project status updated successfully"}


@router.post("/projects/{project_id}/assign-vvb")
def assign_project_to_vvb(
    project_id: int,
    vvb_user_id: int,
    task_type: str = "validation",
    admin: User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Assign a project to a VVB user for validation or verification"""
    from backend.core.models import Project, UserRole
    from backend.modules.vvb.models import ValidationTask, VerificationTask
    
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify VVB user exists and has correct role
    vvb_user = db.query(User).filter(User.id == vvb_user_id, User.role == UserRole.VVB).first()
    if not vvb_user:
        raise HTTPException(status_code=404, detail="VVB user not found")
    
    if task_type == "validation":
        # Create validation task
        task = ValidationTask(
            project_id=project_id,
            vvb_user_id=vvb_user_id,
            checklist={}
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return {"message": "Project assigned for validation", "task_id": task.id}
    
    elif task_type == "verification":
        # Create verification task
        task = VerificationTask(
            project_id=project_id,
            vvb_user_id=vvb_user_id,
            checklist={}
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return {"message": "Project assigned for verification", "task_id": task.id}
    
    else:
        raise HTTPException(status_code=400, detail="task_type must be 'validation' or 'verification'")


@router.post("/projects/{project_id}/assign-registry")
def assign_project_to_registry(
    project_id: int,
    registry_user_id: int,
    admin: User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    """Assign a project to a Registry user for review"""
    from backend.core.models import Project, UserRole
    from backend.modules.registry.models import RegistryReview
    
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify Registry user exists and has correct role
    registry_user = db.query(User).filter(User.id == registry_user_id, User.role == UserRole.REGISTRY).first()
    if not registry_user:
        raise HTTPException(status_code=404, detail="Registry user not found")
    
    # Create registry review
    review = RegistryReview(
        project_id=project_id,
        registry_user_id=registry_user_id,
        registry_name="GCC",
        checklist={}
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return {"message": "Project assigned for registry review", "review_id": review.id}


# ===== Transaction Management =====
@router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tx_type: Optional[str] = None,
    status: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of transactions"""
    transactions, total = service.get_transactions(page, page_size, tx_type, status)
    return {
        "items": transactions,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


# ===== Marketplace Management =====
@router.get("/marketplace")
def get_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of marketplace listings"""
    listings, total = service.get_listings(page, page_size, status)
    return {
        "items": listings,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


@router.delete("/marketplace/{listing_id}")
def remove_listing(
    listing_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Remove a marketplace listing"""
    success = service.remove_listing(listing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Listing removed successfully"}


# ===== Retirement Management =====
@router.get("/retirements")
def get_retirements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of retirements"""
    retirements, total = service.get_retirements(page, page_size, status)
    return {
        "items": retirements,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


# ===== Audit Logs =====
@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated audit logs"""
    logs, total = service.get_audit_logs(page, page_size, action, entity_type)
    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


# ===== API Health =====
@router.get("/health", response_model=HealthStatus)
def get_health_status(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get API health status"""
    return service.get_health_status()


# ===== Notifications =====
@router.post("/notifications")
def broadcast_notification(
    notification: BroadcastNotification,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Broadcast notification to users"""
    count = service.broadcast_notification(notification, admin.id)
    return {"message": f"Notification sent to {count} users"}


# ===== Analytics =====
@router.get("/analytics", response_model=PlatformAnalytics)
def get_analytics(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get platform analytics"""
    return service.get_analytics()


# ===== Admin List =====
@router.get("/admins")
def get_admins(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of admin users"""
    admins, total = service.get_admins(page, page_size, search)
    return {
        "items": [UserListItem.from_orm(a) for a in admins],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


# ===== Task Management =====
@router.get("/tasks")
def get_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get paginated list of tasks"""
    tasks, total = service.get_tasks(page, page_size, task_type, status)
    return {
        "items": tasks,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size)
    }


@router.post("/tasks")
def create_task(
    task_data: TaskCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new task"""
    task = service.create_task(task_data, admin.id)
    return {"message": "Task created successfully", "task_id": task.id}


@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    update_data: TaskUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update a task"""
    task = service.update_task(task_id, update_data, admin.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated successfully"}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete a task"""
    success = service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# ===== Registry Management =====
@router.get("/config/registries")
def get_registries(
    include_inactive: bool = Query(False),
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all registries"""
    return service.get_registries(include_inactive)


@router.post("/config/registries")
def create_registry(
    data: RegistryCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new registry"""
    registry = service.create_registry(data)
    return {"message": "Registry created", "id": registry.id}


@router.put("/config/registries/{registry_id}")
def update_registry(
    registry_id: int,
    data: RegistryUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update a registry"""
    registry = service.update_registry(registry_id, data)
    if not registry:
        raise HTTPException(status_code=404, detail="Registry not found")
    return {"message": "Registry updated"}


@router.delete("/config/registries/{registry_id}")
def delete_registry(
    registry_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete a registry"""
    if not service.delete_registry(registry_id):
        raise HTTPException(status_code=404, detail="Registry not found")
    return {"message": "Registry deleted"}


# ===== Project Type Management =====
@router.get("/config/project-types")
def get_project_types(
    include_inactive: bool = Query(False),
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all project types"""
    return service.get_project_types(include_inactive)


@router.post("/config/project-types")
def create_project_type(
    data: ProjectTypeCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new project type"""
    pt = service.create_project_type(data)
    return {"message": "Project type created", "id": pt.id}


@router.put("/config/project-types/{type_id}")
def update_project_type(
    type_id: int,
    data: ProjectTypeUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update a project type"""
    pt = service.update_project_type(type_id, data)
    if not pt:
        raise HTTPException(status_code=404, detail="Project type not found")
    return {"message": "Project type updated"}


@router.delete("/config/project-types/{type_id}")
def delete_project_type(
    type_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete a project type"""
    if not service.delete_project_type(type_id):
        raise HTTPException(status_code=404, detail="Project type not found")
    return {"message": "Project type deleted"}


# ===== Feature Flag Management =====
@router.get("/config/feature-flags")
def get_feature_flags(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all feature flags"""
    return service.get_feature_flags()


@router.post("/config/feature-flags")
def create_feature_flag(
    data: FeatureFlagCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new feature flag"""
    flag = service.create_feature_flag(data)
    return {"message": "Feature flag created", "id": flag.id}


@router.put("/config/feature-flags/{flag_id}")
def update_feature_flag(
    flag_id: int,
    data: FeatureFlagUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update a feature flag"""
    flag = service.update_feature_flag(flag_id, data)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return {"message": "Feature flag updated"}


@router.delete("/config/feature-flags/{flag_id}")
def delete_feature_flag(
    flag_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete a feature flag"""
    if not service.delete_feature_flag(flag_id):
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return {"message": "Feature flag deleted"}


# ===== Announcement Management =====
@router.get("/config/announcements")
def get_announcements(
    include_inactive: bool = Query(False),
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all announcements"""
    return service.get_announcements(include_inactive)


@router.post("/config/announcements")
def create_announcement(
    data: AnnouncementCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new announcement"""
    ann = service.create_announcement(data, admin.id)
    return {"message": "Announcement created", "id": ann.id}


@router.put("/config/announcements/{ann_id}")
def update_announcement(
    ann_id: int,
    data: AnnouncementUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update an announcement"""
    ann = service.update_announcement(ann_id, data)
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement updated"}


@router.delete("/config/announcements/{ann_id}")
def delete_announcement(
    ann_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete an announcement"""
    if not service.delete_announcement(ann_id):
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}


# ===== Platform Fee Management =====
@router.get("/config/fees")
def get_platform_fees(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all platform fees"""
    return service.get_platform_fees()


@router.post("/config/fees")
def create_platform_fee(
    data: PlatformFeeCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new platform fee"""
    fee = service.create_platform_fee(data)
    return {"message": "Platform fee created", "id": fee.id}


@router.put("/config/fees/{fee_id}")
def update_platform_fee(
    fee_id: int,
    data: PlatformFeeUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update a platform fee"""
    fee = service.update_platform_fee(fee_id, data)
    if not fee:
        raise HTTPException(status_code=404, detail="Platform fee not found")
    return {"message": "Platform fee updated"}


@router.delete("/config/fees/{fee_id}")
def delete_platform_fee(
    fee_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete a platform fee"""
    if not service.delete_platform_fee(fee_id):
        raise HTTPException(status_code=404, detail="Platform fee not found")
    return {"message": "Platform fee deleted"}


# ===== Email Template Management =====
@router.get("/config/email-templates")
def get_email_templates(
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Get all email templates"""
    return service.get_email_templates()


@router.post("/config/email-templates")
def create_email_template(
    data: EmailTemplateCreate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Create a new email template"""
    template = service.create_email_template(data)
    return {"message": "Email template created", "id": template.id}


@router.put("/config/email-templates/{template_id}")
def update_email_template(
    template_id: int,
    data: EmailTemplateUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Update an email template"""
    template = service.update_email_template(template_id, data)
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    return {"message": "Email template updated"}


@router.delete("/config/email-templates/{template_id}")
def delete_email_template(
    template_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SuperAdminService = Depends(get_service)
):
    """Delete an email template"""
    if not service.delete_email_template(template_id):
        raise HTTPException(status_code=404, detail="Email template not found")
    return {"message": "Email template deleted"}


# ===== Subscription Management =====
from backend.modules.subscription.service import SubscriptionService
from backend.modules.subscription.models import SubscriptionTier
from backend.modules.subscription.schemas import (
    SubscriptionAssign, SubscriptionResponse, SubscriptionListResponse,
    TierDefinition, TierFeatureCreate, TierFeatureUpdate, TierFeatureResponse,
    SubscriptionTierEnum
)


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    return SubscriptionService(db)


@router.get("/subscriptions", response_model=SubscriptionListResponse)
def get_all_subscriptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    tier: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get paginated list of all user subscriptions"""
    return service.get_all_subscriptions(page, page_size, tier, search)


@router.get("/subscriptions/tiers")
def get_tier_definitions(
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get all tier definitions with features"""
    return service.get_all_tier_definitions()


@router.get("/subscriptions/tiers/{tier}", response_model=TierDefinition)
def get_tier_definition(
    tier: SubscriptionTierEnum,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get specific tier definition"""
    return service.get_tier_definition(SubscriptionTier(tier.value))


@router.put("/users/{user_id}/subscription", response_model=SubscriptionResponse)
def assign_user_subscription(
    user_id: int,
    data: SubscriptionAssign,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Assign or update subscription tier for a user"""
    subscription = service.assign_subscription(user_id, data, admin.id)
    return service.get_subscription_response(subscription)


@router.get("/users/{user_id}/subscription", response_model=SubscriptionResponse)
def get_user_subscription(
    user_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get subscription for a specific user"""
    subscription = service.get_user_subscription(user_id)
    return service.get_subscription_response(subscription)


# ===== Tier Feature Configuration =====
@router.post("/subscriptions/tiers/features")
def create_tier_feature(
    data: TierFeatureCreate,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Create a new feature for a tier"""
    feature = service.create_tier_feature(data)
    return {"message": "Tier feature created", "id": feature.id}


@router.put("/subscriptions/tiers/features/{feature_id}")
def update_tier_feature(
    feature_id: int,
    data: TierFeatureUpdate,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Update a tier feature"""
    feature = service.update_tier_feature(feature_id, data)
    if not feature:
        raise HTTPException(status_code=404, detail="Tier feature not found")
    return {"message": "Tier feature updated"}


@router.delete("/subscriptions/tiers/features/{feature_id}")
def delete_tier_feature(
    feature_id: int,
    admin: User = Depends(get_current_superadmin),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Delete a tier feature"""
    if not service.delete_tier_feature(feature_id):
        raise HTTPException(status_code=404, detail="Tier feature not found")
    return {"message": "Tier feature deleted"}

