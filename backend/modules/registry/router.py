"""
Registry System Router
API endpoints for registry operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.core.database import get_db
from backend.core.models import User
from backend.modules.auth.router import get_current_user
from backend.modules.registry.service import RegistryService
from backend.modules.registry.schemas import (
    RegistryReviewCreate, RegistryReviewUpdate, RegistryReviewResponse,
    RegistryQueryCreate, RegistryQueryResponse, QueryResponseSubmit,
    IssuanceRequest, IssuanceResponse, IssuanceUpdate,
    CreditBatchResponse,
    RegistryDashboardStats, RegistryProjectSummary
)

router = APIRouter(prefix="/registry", tags=["registry"])


def get_registry_service(db: Session = Depends(get_db)) -> RegistryService:
    return RegistryService(db)


def require_registry_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify that the current user is a Registry user"""
    if current_user.role != "REGISTRY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registry access required"
        )
    return current_user


# ===== Dashboard Endpoints =====

@router.get("/dashboard/stats", response_model=RegistryDashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get registry dashboard statistics"""
    return service.get_dashboard_stats(current_user.id)


@router.get("/dashboard/projects", response_model=List[RegistryProjectSummary])
def get_assigned_projects(
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get all projects assigned to the registry user"""
    return service.get_assigned_projects(current_user.id)


# ===== Review Endpoints =====

@router.get("/reviews", response_model=List[RegistryReviewResponse])
def get_reviews(
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get all reviews assigned to the current registry user"""
    return service.get_reviews_for_registry(current_user.id)


@router.get("/reviews/{review_id}")
def get_review(
    review_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service),
    db: Session = Depends(get_db)
):
    """Get a specific review with project details"""
    review = service.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.registry_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this review")
    
    # Include project and developer info
    from backend.core.models import Project, User as UserModel
    project = db.query(Project).filter(Project.id == review.project_id).first()
    developer = db.query(UserModel).filter(UserModel.id == project.developer_id).first() if project else None
    
    return {
        "id": review.id,
        "project_id": review.project_id,
        "project_name": project.name if project else "Unknown",
        "project_code": project.code if project else "",
        "project_type": project.project_type if project else "",
        "developer_name": developer.profile_data.get("name", developer.email) if developer else "Unknown",
        "registry_user_id": review.registry_user_id,
        "registry_name": review.registry_name or "GCC",
        "status": review.status.value if hasattr(review.status, 'value') else str(review.status),
        "checklist": review.checklist or {},
        "conditions": review.conditions,
        "rejection_reason": review.rejection_reason,
        "decision_notes": review.decision_notes,
        "submitted_at": review.submitted_at,
        "review_started_at": review.review_started_at,
        "decision_at": review.decision_at
    }


@router.put("/reviews/{review_id}", response_model=RegistryReviewResponse)
def update_review(
    review_id: int,
    update_data: RegistryReviewUpdate,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Update a review"""
    review = service.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.registry_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    updated_review = service.update_review(review_id, update_data)
    return updated_review


@router.post("/reviews", response_model=RegistryReviewResponse)
def create_review(
    review_data: RegistryReviewCreate,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Create a new review (typically system-generated)"""
    review_data.registry_user_id = current_user.id
    return service.create_review(review_data)


# ===== Query Endpoints =====

@router.get("/reviews/{review_id}/queries", response_model=List[RegistryQueryResponse])
def get_review_queries(
    review_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get all queries for a review"""
    review = service.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.registry_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this review")
    
    return service.get_queries_for_review(review_id)


@router.post("/queries", response_model=RegistryQueryResponse)
def create_query(
    query_data: RegistryQueryCreate,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Create a new query"""
    # Verify the registry user owns the review
    review = service.get_review(query_data.review_id)
    if not review or review.registry_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create query for this review")
    
    return service.create_query(query_data, current_user.id)


@router.put("/queries/{query_id}/resolve", response_model=RegistryQueryResponse)
def resolve_query(
    query_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Mark a query as resolved"""
    query = service.resolve_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    return query


# ===== Issuance Endpoints =====

@router.get("/issuances", response_model=List[IssuanceResponse])
def get_issuances(
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get all issuance records for projects reviewed by this user"""
    return service.get_issuances_for_registry(current_user.id)


@router.get("/issuances/{issuance_id}", response_model=IssuanceResponse)
def get_issuance(
    issuance_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get a specific issuance record"""
    issuance = service.get_issuance(issuance_id)
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    return issuance


@router.post("/issuances", response_model=IssuanceResponse)
def create_issuance_request(
    issuance_data: IssuanceRequest,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Create a new issuance request"""
    return service.request_issuance(issuance_data, current_user.id)


@router.post("/issuances/{issuance_id}/process", response_model=IssuanceResponse)
def process_issuance(
    issuance_id: int,
    registry_reference_id: str,
    certificate_url: str = None,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Process and complete an issuance (create credits)"""
    issuance = service.process_issuance(
        issuance_id, 
        current_user.id,
        registry_reference_id,
        certificate_url
    )
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    return issuance


@router.post("/issuances/{issuance_id}/reject", response_model=IssuanceResponse)
def reject_issuance(
    issuance_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Reject an issuance request"""
    issuance = service.reject_issuance(issuance_id)
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    return issuance


# ===== Credit Batch Endpoints =====

@router.get("/credits", response_model=List[CreditBatchResponse])
def get_credit_batches(
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get all credit batches (registry admin view)"""
    return service.get_all_credit_batches()


@router.get("/credits/{batch_id}", response_model=CreditBatchResponse)
def get_credit_batch(
    batch_id: int,
    current_user: User = Depends(require_registry_user),
    service: RegistryService = Depends(get_registry_service)
):
    """Get a specific credit batch"""
    batch = service.get_credit_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Credit batch not found")
    return batch
