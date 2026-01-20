"""
VVB (Validation & Verification Body) Router
API endpoints for VVB operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.core.database import get_db
from backend.core.models import User
from backend.modules.auth.router import get_current_user
from backend.modules.vvb.service import VVBService
from backend.modules.vvb.schemas import (
    ValidationTaskCreate, ValidationTaskUpdate, ValidationTaskResponse,
    VerificationTaskCreate, VerificationTaskUpdate, VerificationTaskResponse,
    VVBQueryCreate, VVBQueryUpdate, VVBQueryResponse,
    QueryResponseCreate, QueryResponseSchema,
    VVBDashboardStats, VVBProjectSummary, QueryStatusEnum,
    VVBProfileResponse, VVBProfileUpdate, VVBPasswordChange
)

router = APIRouter(prefix="/vvb", tags=["vvb"])


def get_vvb_service(db: Session = Depends(get_db)) -> VVBService:
    return VVBService(db)


def require_vvb_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify that the current user is a VVB user"""
    if current_user.role != "VVB":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="VVB access required"
        )
    return current_user


# ===== Dashboard Endpoints =====

@router.get("/dashboard/stats", response_model=VVBDashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get VVB dashboard statistics"""
    return service.get_dashboard_stats(current_user.id)


@router.get("/dashboard/projects", response_model=List[VVBProjectSummary])
def get_assigned_projects(
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all projects assigned to the VVB user"""
    return service.get_assigned_projects(current_user.id)


# ===== Validation Endpoints =====

@router.get("/validations", response_model=List[ValidationTaskResponse])
def get_validation_tasks(
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all validation tasks assigned to the current VVB user"""
    return service.get_validation_tasks_for_vvb(current_user.id)


@router.get("/validations/{task_id}")
def get_validation_task(
    task_id: int,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service),
    db: Session = Depends(get_db)
):
    """Get a specific validation task with project details"""
    task = service.get_validation_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Validation task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    # Include project and developer info
    from backend.core.models import Project, User as UserModel
    project = db.query(Project).filter(Project.id == task.project_id).first()
    developer = db.query(UserModel).filter(UserModel.id == project.developer_id).first() if project else None
    
    return {
        "id": task.id,
        "project_id": task.project_id,
        "project_name": project.name if project else "Unknown",
        "project_code": project.code if project else "",
        "project_type": project.project_type if project else "",
        "developer_name": developer.profile_data.get("name", developer.email) if developer else "Unknown",
        "vvb_user_id": task.vvb_user_id,
        "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
        "lead_auditor": task.lead_auditor,
        "reviewer": task.reviewer,
        "accreditation_id": task.accreditation_id,
        "checklist": task.checklist or {},
        "remarks": task.remarks,
        "decision_notes": task.decision_notes,
        "assigned_at": task.assigned_at,
        "started_at": task.started_at,
        "completed_at": task.completed_at
    }


@router.put("/validations/{task_id}", response_model=ValidationTaskResponse)
def update_validation_task(
    task_id: int,
    update_data: ValidationTaskUpdate,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Update a validation task"""
    task = service.get_validation_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Validation task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    updated_task = service.update_validation_task(task_id, update_data)
    return updated_task


@router.post("/validations", response_model=ValidationTaskResponse)
def create_validation_task(
    task_data: ValidationTaskCreate,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Create a new validation task (typically done by admin)"""
    # Override vvb_user_id with current user if not admin
    task_data.vvb_user_id = current_user.id
    return service.create_validation_task(task_data)


# ===== Verification Endpoints =====

@router.get("/verifications", response_model=List[VerificationTaskResponse])
def get_verification_tasks(
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all verification tasks assigned to the current VVB user"""
    return service.get_verification_tasks_for_vvb(current_user.id)


@router.get("/verifications/{task_id}")
def get_verification_task(
    task_id: int,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service),
    db: Session = Depends(get_db)
):
    """Get a specific verification task with project details"""
    task = service.get_verification_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Verification task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    # Include project and developer info
    from backend.core.models import Project, User as UserModel
    project = db.query(Project).filter(Project.id == task.project_id).first()
    developer = db.query(UserModel).filter(UserModel.id == project.developer_id).first() if project else None
    
    return {
        "id": task.id,
        "project_id": task.project_id,
        "project_name": project.name if project else "Unknown",
        "project_code": project.code if project else "",
        "project_type": project.project_type if project else "",
        "developer_name": developer.profile_data.get("name", developer.email) if developer else "Unknown",
        "vvb_user_id": task.vvb_user_id,
        "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
        "monitoring_period_start": task.monitoring_start,
        "monitoring_period_end": task.monitoring_end,
        "claimed_reductions": task.proposed_ers,
        "verified_reductions": task.verified_ers,
        "checklist": task.checklist or {},
        "remarks": task.remarks,
        "decision_notes": task.decision_notes,
        "assigned_at": task.assigned_at,
        "started_at": task.started_at,
        "completed_at": task.completed_at
    }


@router.put("/verifications/{task_id}", response_model=VerificationTaskResponse)
def update_verification_task(
    task_id: int,
    update_data: VerificationTaskUpdate,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Update a verification task"""
    task = service.get_verification_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Verification task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    updated_task = service.update_verification_task(task_id, update_data)
    return updated_task


@router.post("/verifications", response_model=VerificationTaskResponse)
def create_verification_task(
    task_data: VerificationTaskCreate,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Create a new verification task"""
    task_data.vvb_user_id = current_user.id
    return service.create_verification_task(task_data)


# ===== Query Endpoints =====

@router.get("/queries", response_model=List[VVBQueryResponse])
def get_queries(
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all queries created by the current VVB user"""
    return service.get_queries_for_vvb(current_user.id)


@router.get("/validations/{task_id}/queries", response_model=List[VVBQueryResponse])
def get_validation_queries(
    task_id: int,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all queries for a validation task"""
    task = service.get_validation_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Validation task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return service.get_queries_for_task(task_id, "validation")


@router.get("/verifications/{task_id}/queries", response_model=List[VVBQueryResponse])
def get_verification_queries(
    task_id: int,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Get all queries for a verification task"""
    task = service.get_verification_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Verification task not found")
    if task.vvb_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return service.get_queries_for_task(task_id, "verification")


@router.post("/queries", response_model=VVBQueryResponse)
def create_query(
    query_data: VVBQueryCreate,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Create a new query"""
    # Verify the VVB user owns the task
    if query_data.validation_task_id:
        task = service.get_validation_task(query_data.validation_task_id)
        if not task or task.vvb_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to create query for this task")
    elif query_data.verification_task_id:
        task = service.get_verification_task(query_data.verification_task_id)
        if not task or task.vvb_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to create query for this task")
    else:
        raise HTTPException(status_code=400, detail="Must specify either validation_task_id or verification_task_id")
    
    return service.create_query(query_data, current_user.id)


@router.put("/queries/{query_id}/resolve", response_model=VVBQueryResponse)
def resolve_query(
    query_id: int,
    current_user: User = Depends(require_vvb_user),
    service: VVBService = Depends(get_vvb_service)
):
    """Mark a query as resolved"""
    from backend.modules.vvb.models import QueryStatus
    query = service.update_query_status(query_id, QueryStatus.RESOLVED)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    return query


# ===== Profile Endpoints =====

@router.get("/profile", response_model=VVBProfileResponse)
def get_vvb_profile(
    current_user: User = Depends(require_vvb_user)
):
    """Get current VVB user's profile"""
    profile_data = current_user.profile_data or {}
    return VVBProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        name=profile_data.get("name"),
        organization=profile_data.get("organization"),
        phone=profile_data.get("phone"),
        accreditation_id=profile_data.get("accreditation_id"),
        certifications=profile_data.get("certifications"),
        profile_photo=profile_data.get("profilePhoto") or profile_data.get("profile_photo"),
        notification_preferences=profile_data.get("notification_preferences")
    )


@router.put("/profile", response_model=VVBProfileResponse)
def update_vvb_profile(
    update_data: VVBProfileUpdate,
    current_user: User = Depends(require_vvb_user),
    db: Session = Depends(get_db)
):
    """Update VVB user's profile"""
    profile_data = current_user.profile_data or {}
    
    # Update fields if provided
    if update_data.name is not None:
        profile_data["name"] = update_data.name
    if update_data.organization is not None:
        profile_data["organization"] = update_data.organization
    if update_data.phone is not None:
        profile_data["phone"] = update_data.phone
    if update_data.accreditation_id is not None:
        profile_data["accreditation_id"] = update_data.accreditation_id
    if update_data.certifications is not None:
        profile_data["certifications"] = update_data.certifications
    if update_data.profile_photo is not None:
        profile_data["profilePhoto"] = update_data.profile_photo
    if update_data.notification_preferences is not None:
        profile_data["notification_preferences"] = update_data.notification_preferences
    
    current_user.profile_data = profile_data
    db.commit()
    db.refresh(current_user)
    
    return VVBProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        name=profile_data.get("name"),
        organization=profile_data.get("organization"),
        phone=profile_data.get("phone"),
        accreditation_id=profile_data.get("accreditation_id"),
        certifications=profile_data.get("certifications"),
        profile_photo=profile_data.get("profilePhoto"),
        notification_preferences=profile_data.get("notification_preferences")
    )


@router.put("/profile/password")
def change_vvb_password(
    password_data: VVBPasswordChange,
    current_user: User = Depends(require_vvb_user),
    db: Session = Depends(get_db)
):
    """Change VVB user's password"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    # Hash and save new password
    current_user.password_hash = pwd_context.hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
