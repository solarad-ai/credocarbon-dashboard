"""
Registry System Service
Business logic for registry reviews, issuance, and credit management
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import uuid

from apps.api.modules.registry.models import (
    RegistryReview, RegistryQuery, IssuanceRecord, CreditBatch,
    RegistryReviewStatus, IssuanceStatus, CreditStatus
)
from apps.api.modules.registry.schemas import (
    RegistryReviewCreate, RegistryReviewUpdate,
    RegistryQueryCreate, QueryResponseSubmit,
    IssuanceRequest, IssuanceUpdate,
    CreditBatchCreate,
    RegistryDashboardStats, RegistryProjectSummary
)
from apps.api.core.models import Project, User


class RegistryService:
    def __init__(self, db: Session):
        self.db = db

    # ===== Review Operations =====

    def create_review(self, review_data: RegistryReviewCreate) -> RegistryReview:
        """Create a new registry review for a project"""
        review = RegistryReview(
            project_id=review_data.project_id,
            registry_user_id=review_data.registry_user_id,
            registry_name=review_data.registry_name,
            status=RegistryReviewStatus.PENDING,
            checklist={}
        )
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_reviews_for_registry(self, registry_user_id: int) -> List[RegistryReview]:
        """Get all reviews assigned to a registry user"""
        return self.db.query(RegistryReview).filter(
            RegistryReview.registry_user_id == registry_user_id
        ).order_by(RegistryReview.submitted_at.desc()).all()

    def get_review(self, review_id: int) -> Optional[RegistryReview]:
        """Get a specific review by ID"""
        return self.db.query(RegistryReview).filter(RegistryReview.id == review_id).first()

    def get_review_by_project(self, project_id: int) -> Optional[RegistryReview]:
        """Get the most recent review for a project"""
        return self.db.query(RegistryReview).filter(
            RegistryReview.project_id == project_id
        ).order_by(RegistryReview.submitted_at.desc()).first()

    def update_review(self, review_id: int, update_data: RegistryReviewUpdate) -> Optional[RegistryReview]:
        """Update a registry review"""
        review = self.get_review(review_id)
        if not review:
            return None

        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            if value is not None:
                if field == "status":
                    review.status = RegistryReviewStatus(value)
                    if value == RegistryReviewStatus.IN_PROGRESS and not review.review_started_at:
                        review.review_started_at = datetime.utcnow()
                    elif value in [RegistryReviewStatus.APPROVED, RegistryReviewStatus.REJECTED, 
                                   RegistryReviewStatus.APPROVED_WITH_CONDITIONS]:
                        review.decision_at = datetime.utcnow()
                elif field == "checklist" and review.checklist:
                    review.checklist = {**review.checklist, **value}
                else:
                    setattr(review, field, value)

        self.db.commit()
        self.db.refresh(review)
        return review

    # ===== Query Operations =====

    def create_query(self, query_data: RegistryQueryCreate, created_by: int) -> RegistryQuery:
        """Create a new query for a review"""
        query = RegistryQuery(
            review_id=query_data.review_id,
            category=query_data.category,
            query_text=query_data.query_text,
            status="OPEN",
            created_by=created_by
        )
        self.db.add(query)
        self.db.commit()
        self.db.refresh(query)
        return query

    def get_queries_for_review(self, review_id: int) -> List[RegistryQuery]:
        """Get all queries for a specific review"""
        return self.db.query(RegistryQuery).filter(
            RegistryQuery.review_id == review_id
        ).order_by(RegistryQuery.created_at.desc()).all()

    def respond_to_query(self, query_id: int, response_data: QueryResponseSubmit, responded_by: int) -> Optional[RegistryQuery]:
        """Add response to a query"""
        query = self.db.query(RegistryQuery).filter(RegistryQuery.id == query_id).first()
        if not query:
            return None
        
        query.response_text = response_data.response_text
        query.response_attachments = response_data.attachments or []
        query.responded_by = responded_by
        query.responded_at = datetime.utcnow()
        query.status = "RESPONDED"
        
        self.db.commit()
        self.db.refresh(query)
        return query

    def resolve_query(self, query_id: int) -> Optional[RegistryQuery]:
        """Mark a query as resolved"""
        query = self.db.query(RegistryQuery).filter(RegistryQuery.id == query_id).first()
        if not query:
            return None
        
        query.status = "RESOLVED"
        query.resolved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(query)
        return query

    # ===== Issuance Operations =====

    def request_issuance(self, issuance_data: IssuanceRequest, requested_by: int) -> IssuanceRecord:
        """Create a new issuance request"""
        issuance = IssuanceRecord(
            project_id=issuance_data.project_id,
            review_id=issuance_data.review_id,
            registry_name=issuance_data.registry_name,
            total_credits=issuance_data.total_credits,
            vintage_year=issuance_data.vintage_year,
            credit_type=issuance_data.credit_type,
            status=IssuanceStatus.PENDING
        )
        self.db.add(issuance)
        self.db.commit()
        self.db.refresh(issuance)
        return issuance

    def get_issuances_for_registry(self, registry_user_id: int) -> List[IssuanceRecord]:
        """Get all issuance records relevant to a registry user"""
        # Get project IDs from reviews assigned to this user
        review_project_ids = self.db.query(RegistryReview.project_id).filter(
            RegistryReview.registry_user_id == registry_user_id
        ).subquery()
        
        return self.db.query(IssuanceRecord).filter(
            IssuanceRecord.project_id.in_(review_project_ids)
        ).order_by(IssuanceRecord.requested_at.desc()).all()

    def get_issuance(self, issuance_id: int) -> Optional[IssuanceRecord]:
        """Get a specific issuance record"""
        return self.db.query(IssuanceRecord).filter(IssuanceRecord.id == issuance_id).first()

    def process_issuance(self, issuance_id: int, issued_by: int, 
                         registry_reference_id: str, certificate_url: str = None) -> Optional[IssuanceRecord]:
        """Process and complete an issuance"""
        issuance = self.get_issuance(issuance_id)
        if not issuance:
            return None

        issuance.status = IssuanceStatus.ISSUED
        issuance.issued_by = issued_by
        issuance.registry_reference_id = registry_reference_id
        issuance.certificate_url = certificate_url
        issuance.issued_at = datetime.utcnow()

        # Get the project developer to set as owner
        project = self.db.query(Project).filter(Project.id == issuance.project_id).first()
        
        # Create a single credit batch for the issuance
        batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
        serial_prefix = f"{issuance.registry_name}-{issuance.vintage_year}-"
        
        batch = CreditBatch(
            issuance_id=issuance.id,
            batch_id=batch_id,
            serial_start=f"{serial_prefix}000001",
            serial_end=f"{serial_prefix}{str(issuance.total_credits).zfill(6)}",
            quantity=issuance.total_credits,
            credit_type=issuance.credit_type,
            vintage_year=issuance.vintage_year,
            registry_name=issuance.registry_name,
            status=CreditStatus.OWNED,
            owner_id=project.developer_id if project else issued_by
        )
        self.db.add(batch)
        
        self.db.commit()
        self.db.refresh(issuance)
        return issuance

    def reject_issuance(self, issuance_id: int) -> Optional[IssuanceRecord]:
        """Mark issuance as failed"""
        issuance = self.get_issuance(issuance_id)
        if not issuance:
            return None

        issuance.status = IssuanceStatus.FAILED
        self.db.commit()
        self.db.refresh(issuance)
        return issuance

    # ===== Credit Batch Operations =====

    def get_credit_batches(self, owner_id: int = None) -> List[CreditBatch]:
        """Get credit batches, optionally filtered by owner"""
        query = self.db.query(CreditBatch)
        if owner_id:
            query = query.filter(CreditBatch.owner_id == owner_id)
        return query.order_by(CreditBatch.created_at.desc()).all()

    def get_all_credit_batches(self) -> List[CreditBatch]:
        """Get all credit batches (for registry admin view)"""
        return self.db.query(CreditBatch).order_by(CreditBatch.created_at.desc()).all()

    def get_credit_batch(self, batch_id: int) -> Optional[CreditBatch]:
        """Get a specific credit batch"""
        return self.db.query(CreditBatch).filter(CreditBatch.id == batch_id).first()

    # ===== Dashboard =====

    def get_dashboard_stats(self, registry_user_id: int) -> RegistryDashboardStats:
        """Get dashboard statistics for a registry user"""
        pending_reviews = self.db.query(RegistryReview).filter(
            RegistryReview.registry_user_id == registry_user_id,
            RegistryReview.status == RegistryReviewStatus.PENDING
        ).count()

        in_progress_reviews = self.db.query(RegistryReview).filter(
            RegistryReview.registry_user_id == registry_user_id,
            RegistryReview.status.in_([RegistryReviewStatus.IN_PROGRESS, 
                                       RegistryReviewStatus.CLARIFICATIONS_REQUESTED])
        ).count()

        # Get pending issuances for projects this user has reviewed
        review_project_ids = [r.project_id for r in self.db.query(RegistryReview.project_id).filter(
            RegistryReview.registry_user_id == registry_user_id,
            RegistryReview.status.in_([RegistryReviewStatus.APPROVED, 
                                       RegistryReviewStatus.APPROVED_WITH_CONDITIONS])
        ).all()]
        
        pending_issuances = self.db.query(IssuanceRecord).filter(
            IssuanceRecord.project_id.in_(review_project_ids) if review_project_ids else False,
            IssuanceRecord.status == IssuanceStatus.PENDING
        ).count() if review_project_ids else 0

        # Total credits issued
        total_credits = self.db.query(func.sum(IssuanceRecord.total_credits)).filter(
            IssuanceRecord.issued_by == registry_user_id,
            IssuanceRecord.status == IssuanceStatus.ISSUED
        ).scalar() or 0

        # Open queries
        review_ids = [r.id for r in self.db.query(RegistryReview.id).filter(
            RegistryReview.registry_user_id == registry_user_id
        ).all()]
        
        open_queries = self.db.query(RegistryQuery).filter(
            RegistryQuery.review_id.in_(review_ids) if review_ids else False,
            RegistryQuery.status.in_(["OPEN", "RESPONDED"])
        ).count() if review_ids else 0

        # Completed this month
        from datetime import date
        first_of_month = date.today().replace(day=1)
        completed_this_month = self.db.query(RegistryReview).filter(
            RegistryReview.registry_user_id == registry_user_id,
            RegistryReview.status.in_([RegistryReviewStatus.APPROVED, 
                                       RegistryReviewStatus.REJECTED]),
            RegistryReview.decision_at >= first_of_month
        ).count()

        return RegistryDashboardStats(
            pending_reviews=pending_reviews,
            in_progress_reviews=in_progress_reviews,
            pending_issuances=pending_issuances,
            total_credits_issued=total_credits,
            open_queries=open_queries,
            completed_this_month=completed_this_month
        )

    def get_assigned_projects(self, registry_user_id: int) -> List[RegistryProjectSummary]:
        """Get all projects assigned to a registry user with summary info"""
        projects = []
        
        reviews = self.db.query(RegistryReview, Project, User).join(
            Project, RegistryReview.project_id == Project.id
        ).join(
            User, Project.developer_id == User.id
        ).filter(
            RegistryReview.registry_user_id == registry_user_id
        ).all()

        for review, project, developer in reviews:
            open_queries = self.db.query(RegistryQuery).filter(
                RegistryQuery.review_id == review.id,
                RegistryQuery.status.in_(["OPEN", "RESPONDED"])
            ).count()
            
            # Check for pending issuance
            has_pending_issuance = self.db.query(IssuanceRecord).filter(
                IssuanceRecord.project_id == project.id,
                IssuanceRecord.status == IssuanceStatus.PENDING
            ).count() > 0
            
            projects.append(RegistryProjectSummary(
                project_id=project.id,
                project_name=project.name or "Unnamed Project",
                project_code=project.code or "",
                project_type=project.project_type,
                developer_name=developer.name or developer.email,
                review_id=review.id,
                review_status=review.status.value,
                submitted_at=review.submitted_at,
                open_queries=open_queries,
                has_pending_issuance=has_pending_issuance
            ))

        return sorted(projects, key=lambda x: x.submitted_at, reverse=True)
