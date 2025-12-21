"""
VVB (Validation & Verification Body) Router
API endpoints for VVB operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from apps.api.core.database import get_db
from apps.api.core.models import User
from apps.api.modules.auth.router import get_current_user
from apps.api.modules.vvb.service import VVBService
from apps.api.modules.vvb.schemas import (
    ValidationTaskCreate, ValidationTaskUpdate, ValidationTaskResponse,
    VerificationTaskCreate, VerificationTaskUpdate, VerificationTaskResponse,
    VVBQueryCreate, VVBQueryUpdate, VVBQueryResponse,
    QueryResponseCreate, QueryResponseSchema,
    VVBDashboardStats, VVBProjectSummary, QueryStatusEnum
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
    from apps.api.core.models import Project, User as UserModel
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
    from apps.api.core.models import Project, User as UserModel
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
    from apps.api.modules.vvb.models import QueryStatus
    query = service.update_query_status(query_id, QueryStatus.RESOLVED)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    return query
