"""
VVB (Validation & Verification Body) Service
Business logic for validation and verification workflows
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from apps.api.modules.vvb.models import (
    ValidationTask, VerificationTask, VVBQuery, VVBQueryResponse as VVBQueryResponseModel,
    ValidationStatus, VerificationStatus, QueryStatus
)
from apps.api.modules.vvb.schemas import (
    ValidationTaskCreate, ValidationTaskUpdate,
    VerificationTaskCreate, VerificationTaskUpdate,
    VVBQueryCreate, VVBQueryUpdate,
    QueryResponseCreate, VVBDashboardStats, VVBProjectSummary
)
from apps.api.core.models import Project, User


class VVBService:
    def __init__(self, db: Session):
        self.db = db

    # ===== Validation Tasks =====
    
    def create_validation_task(self, task_data: ValidationTaskCreate) -> ValidationTask:
        """Create a new validation task for a project"""
        task = ValidationTask(
            project_id=task_data.project_id,
            vvb_user_id=task_data.vvb_user_id,
            lead_auditor=task_data.lead_auditor,
            reviewer=task_data.reviewer,
            accreditation_id=task_data.accreditation_id,
            status=ValidationStatus.PENDING,
            checklist={}
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_validation_tasks_for_vvb(self, vvb_user_id: int) -> List[ValidationTask]:
        """Get all validation tasks assigned to a VVB user"""
        return self.db.query(ValidationTask).filter(
            ValidationTask.vvb_user_id == vvb_user_id
        ).order_by(ValidationTask.assigned_at.desc()).all()

    def get_validation_task(self, task_id: int) -> Optional[ValidationTask]:
        """Get a specific validation task by ID"""
        return self.db.query(ValidationTask).filter(ValidationTask.id == task_id).first()

    def get_validation_task_by_project(self, project_id: int) -> Optional[ValidationTask]:
        """Get validation task for a project"""
        return self.db.query(ValidationTask).filter(
            ValidationTask.project_id == project_id
        ).first()

    def update_validation_task(self, task_id: int, update_data: ValidationTaskUpdate) -> Optional[ValidationTask]:
        """Update a validation task"""
        task = self.get_validation_task(task_id)
        if not task:
            return None

        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            if value is not None:
                if field == "status":
                    task.status = ValidationStatus(value)
                    if value == ValidationStatus.IN_PROGRESS and not task.started_at:
                        task.started_at = datetime.utcnow()
                    elif value in [ValidationStatus.APPROVED, ValidationStatus.REJECTED]:
                        task.completed_at = datetime.utcnow()
                elif field == "checklist" and task.checklist:
                    task.checklist = {**task.checklist, **value}
                else:
                    setattr(task, field, value)

        self.db.commit()
        self.db.refresh(task)
        return task

    # ===== Verification Tasks =====

    def create_verification_task(self, task_data: VerificationTaskCreate) -> VerificationTask:
        """Create a new verification task for a project"""
        task = VerificationTask(
            project_id=task_data.project_id,
            vvb_user_id=task_data.vvb_user_id,
            monitoring_period_id=task_data.monitoring_period_id,
            monitoring_start=task_data.monitoring_start,
            monitoring_end=task_data.monitoring_end,
            proposed_ers=task_data.proposed_ers,
            status=VerificationStatus.PENDING,
            checklist={}
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_verification_tasks_for_vvb(self, vvb_user_id: int) -> List[VerificationTask]:
        """Get all verification tasks assigned to a VVB user"""
        return self.db.query(VerificationTask).filter(
            VerificationTask.vvb_user_id == vvb_user_id
        ).order_by(VerificationTask.assigned_at.desc()).all()

    def get_verification_task(self, task_id: int) -> Optional[VerificationTask]:
        """Get a specific verification task by ID"""
        return self.db.query(VerificationTask).filter(VerificationTask.id == task_id).first()

    def update_verification_task(self, task_id: int, update_data: VerificationTaskUpdate) -> Optional[VerificationTask]:
        """Update a verification task"""
        task = self.get_verification_task(task_id)
        if not task:
            return None

        update_dict = update_data.dict(exclude_unset=True)
        
        for field, value in update_dict.items():
            if value is not None:
                if field == "status":
                    task.status = VerificationStatus(value)
                    if value == VerificationStatus.IN_PROGRESS and not task.started_at:
                        task.started_at = datetime.utcnow()
                    elif value in [VerificationStatus.VERIFIED, VerificationStatus.NOT_VERIFIED]:
                        task.completed_at = datetime.utcnow()
                elif field == "checklist" and task.checklist:
                    task.checklist = {**task.checklist, **value}
                else:
                    setattr(task, field, value)

        # Auto-calculate net ERs if components are provided
        if task.verified_ers is not None:
            adjustments = task.adjustments or 0
            leakage = task.leakage_deduction or 0
            buffer = task.buffer_deduction or 0
            task.net_ers = task.verified_ers - adjustments - leakage - buffer

        self.db.commit()
        self.db.refresh(task)
        return task

    # ===== Queries =====

    def create_query(self, query_data: VVBQueryCreate, created_by: int) -> VVBQuery:
        """Create a new query for a task"""
        query = VVBQuery(
            validation_task_id=query_data.validation_task_id,
            verification_task_id=query_data.verification_task_id,
            category=query_data.category,
            query_text=query_data.query_text,
            status=QueryStatus.OPEN,
            created_by=created_by
        )
        self.db.add(query)
        self.db.commit()
        self.db.refresh(query)
        return query

    def get_queries_for_vvb(self, vvb_user_id: int) -> List[VVBQuery]:
        """Get all queries created by a VVB user"""
        return self.db.query(VVBQuery).filter(
            VVBQuery.created_by == vvb_user_id
        ).order_by(VVBQuery.created_at.desc()).all()

    def get_queries_for_task(self, task_id: int, task_type: str = "validation") -> List[VVBQuery]:
        """Get all queries for a specific task"""
        if task_type == "validation":
            return self.db.query(VVBQuery).filter(
                VVBQuery.validation_task_id == task_id
            ).order_by(VVBQuery.created_at.desc()).all()
        else:
            return self.db.query(VVBQuery).filter(
                VVBQuery.verification_task_id == task_id
            ).order_by(VVBQuery.created_at.desc()).all()

    def update_query_status(self, query_id: int, status: QueryStatus) -> Optional[VVBQuery]:
        """Update query status"""
        query = self.db.query(VVBQuery).filter(VVBQuery.id == query_id).first()
        if not query:
            return None
        
        query.status = status
        if status == QueryStatus.RESOLVED:
            query.resolved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(query)
        return query

    def add_query_response(self, response_data: QueryResponseCreate, responded_by: int) -> VVBQueryResponseModel:
        """Add a response to a query"""
        response = VVBQueryResponseModel(
            query_id=response_data.query_id,
            response_text=response_data.response_text,
            attachments=response_data.attachments or [],
            responded_by=responded_by
        )
        self.db.add(response)
        
        # Update query status to RESPONDED
        query = self.db.query(VVBQuery).filter(VVBQuery.id == response_data.query_id).first()
        if query:
            query.status = QueryStatus.RESPONDED
        
        self.db.commit()
        self.db.refresh(response)
        return response

    # ===== Dashboard =====

    def get_dashboard_stats(self, vvb_user_id: int) -> VVBDashboardStats:
        """Get dashboard statistics for a VVB user"""
        pending_validations = self.db.query(ValidationTask).filter(
            ValidationTask.vvb_user_id == vvb_user_id,
            ValidationTask.status == ValidationStatus.PENDING
        ).count()

        in_progress_validations = self.db.query(ValidationTask).filter(
            ValidationTask.vvb_user_id == vvb_user_id,
            ValidationTask.status.in_([ValidationStatus.IN_PROGRESS, ValidationStatus.QUERIES_RAISED])
        ).count()

        pending_verifications = self.db.query(VerificationTask).filter(
            VerificationTask.vvb_user_id == vvb_user_id,
            VerificationTask.status == VerificationStatus.PENDING
        ).count()

        in_progress_verifications = self.db.query(VerificationTask).filter(
            VerificationTask.vvb_user_id == vvb_user_id,
            VerificationTask.status.in_([VerificationStatus.IN_PROGRESS, VerificationStatus.DATA_REVIEW])
        ).count()

        open_queries = self.db.query(VVBQuery).filter(
            VVBQuery.created_by == vvb_user_id,
            VVBQuery.status.in_([QueryStatus.OPEN, QueryStatus.RESPONDED])
        ).count()

        # Count completed this month
        from datetime import date
        first_of_month = date.today().replace(day=1)
        completed_this_month = self.db.query(ValidationTask).filter(
            ValidationTask.vvb_user_id == vvb_user_id,
            ValidationTask.status.in_([ValidationStatus.APPROVED, ValidationStatus.REJECTED]),
            ValidationTask.completed_at >= first_of_month
        ).count()
        completed_this_month += self.db.query(VerificationTask).filter(
            VerificationTask.vvb_user_id == vvb_user_id,
            VerificationTask.status.in_([VerificationStatus.VERIFIED, VerificationStatus.NOT_VERIFIED]),
            VerificationTask.completed_at >= first_of_month
        ).count()

        return VVBDashboardStats(
            pending_validations=pending_validations,
            in_progress_validations=in_progress_validations,
            pending_verifications=pending_verifications,
            in_progress_verifications=in_progress_verifications,
            open_queries=open_queries,
            completed_this_month=completed_this_month
        )

    def get_assigned_projects(self, vvb_user_id: int) -> List[VVBProjectSummary]:
        """Get all projects assigned to a VVB user with summary info"""
        projects = []
        
        # Get validation tasks with project info
        validation_tasks = self.db.query(ValidationTask, Project, User).join(
            Project, ValidationTask.project_id == Project.id
        ).join(
            User, Project.developer_id == User.id
        ).filter(
            ValidationTask.vvb_user_id == vvb_user_id
        ).all()

        for task, project, developer in validation_tasks:
            open_queries = self.db.query(VVBQuery).filter(
                VVBQuery.validation_task_id == task.id,
                VVBQuery.status.in_([QueryStatus.OPEN, QueryStatus.RESPONDED])
            ).count()
            
            projects.append(VVBProjectSummary(
                project_id=project.id,
                project_name=project.name or "Unnamed Project",
                project_code=project.code or "",
                project_type=project.project_type,
                developer_name=developer.name or developer.email,
                task_type="validation",
                task_id=task.id,
                task_status=task.status.value,
                assigned_at=task.assigned_at,
                open_queries=open_queries
            ))

        # Get verification tasks with project info
        verification_tasks = self.db.query(VerificationTask, Project, User).join(
            Project, VerificationTask.project_id == Project.id
        ).join(
            User, Project.developer_id == User.id
        ).filter(
            VerificationTask.vvb_user_id == vvb_user_id
        ).all()

        for task, project, developer in verification_tasks:
            open_queries = self.db.query(VVBQuery).filter(
                VVBQuery.verification_task_id == task.id,
                VVBQuery.status.in_([QueryStatus.OPEN, QueryStatus.RESPONDED])
            ).count()
            
            projects.append(VVBProjectSummary(
                project_id=project.id,
                project_name=project.name or "Unnamed Project",
                project_code=project.code or "",
                project_type=project.project_type,
                developer_name=developer.name or developer.email,
                task_type="verification",
                task_id=task.id,
                task_status=task.status.value,
                assigned_at=task.assigned_at,
                open_queries=open_queries
            ))

        return sorted(projects, key=lambda x: x.assigned_at, reverse=True)
