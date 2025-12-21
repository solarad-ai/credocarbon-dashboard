from datetime import datetime
import time
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from passlib.context import CryptContext

from apps.api.core.models import (
    User, UserRole, Project, ProjectStatus, Document,
    Transaction, TransactionType, TransactionStatus,
    Retirement, RetirementStatus, MarketListing, ListingStatus,
    Offer, AuditLog, Notification, CreditHolding,
    AdminTask, TaskType, TaskStatus as TaskStatusEnum, TaskPriority,
    Registry, ProjectTypeConfig, FeatureFlag, Announcement, PlatformFee, EmailTemplate
)
from apps.api.modules.superadmin.schemas import (
    DashboardStats, ActivityItem, UserListItem, UserDetail, UserUpdate,
    AdminCreate, ProjectListItem, ProjectStatusUpdate, TransactionListItem,
    ListingListItem, RetirementListItem, AuditLogItem, HealthStatus,
    BroadcastNotification, PlatformAnalytics, TaskCreate, TaskUpdate, TaskListItem,
    RegistryCreate, RegistryUpdate, RegistryItem,
    ProjectTypeCreate, ProjectTypeUpdate, ProjectTypeItem,
    FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagItem,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementItem,
    PlatformFeeCreate, PlatformFeeUpdate, PlatformFeeItem,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateItem
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
START_TIME = time.time()


class SuperAdminService:
    def __init__(self, db: Session):
        self.db = db

    # ===== Dashboard Stats =====
    def get_dashboard_stats(self) -> DashboardStats:
        """Get aggregated dashboard statistics"""
        total_users = self.db.query(User).count()
        total_developers = self.db.query(User).filter(User.role == UserRole.DEVELOPER).count()
        total_buyers = self.db.query(User).filter(User.role == UserRole.BUYER).count()
        total_admins = self.db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        ).count()
        
        total_projects = self.db.query(Project).count()
        active_projects = self.db.query(Project).filter(
            Project.status.notin_([ProjectStatus.DRAFT])
        ).count()
        pending_projects = self.db.query(Project).filter(
            Project.status.in_([ProjectStatus.SUBMITTED_TO_VVB, ProjectStatus.VALIDATION_PENDING, ProjectStatus.VERIFICATION_PENDING])
        ).count()
        
        total_transactions = self.db.query(Transaction).count()
        
        # Credits - sum from holdings
        total_credits_issued = self.db.query(func.coalesce(func.sum(CreditHolding.quantity), 0)).scalar() or 0
        total_credits_retired = self.db.query(func.coalesce(func.sum(Retirement.quantity), 0)).filter(
            Retirement.status == RetirementStatus.COMPLETED
        ).scalar() or 0
        
        # Marketplace volume (total value of completed transactions)
        marketplace_volume = self.db.query(
            func.coalesce(func.sum(Transaction.amount_cents), 0)
        ).filter(Transaction.status == TransactionStatus.COMPLETED).scalar() or 0
        
        # Recent signups (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_signups = self.db.query(User).filter(User.created_at >= week_ago).count()
        
        return DashboardStats(
            total_users=total_users,
            total_developers=total_developers,
            total_buyers=total_buyers,
            total_admins=total_admins,
            total_projects=total_projects,
            active_projects=active_projects,
            total_credits_issued=int(total_credits_issued),
            total_credits_retired=int(total_credits_retired),
            total_transactions=total_transactions,
            marketplace_volume=int(marketplace_volume),
            recent_signups=recent_signups,
            pending_projects=pending_projects
        )

    def get_recent_activity(self, limit: int = 20) -> List[ActivityItem]:
        """Get recent audit log entries"""
        logs = self.db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
        result = []
        for log in logs:
            actor_email = None
            if log.actor_id:
                actor = self.db.query(User).filter(User.id == log.actor_id).first()
                actor_email = actor.email if actor else None
            result.append(ActivityItem(
                id=log.id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                actor_email=actor_email,
                timestamp=log.timestamp,
                details=log.details
            ))
        return result

    # ===== User Management =====
    def get_users(self, page: int = 1, page_size: int = 20, role: Optional[str] = None, 
                  search: Optional[str] = None, is_active: Optional[bool] = None) -> tuple:
        """Get paginated list of users with filters"""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        if search:
            query = query.filter(User.email.ilike(f"%{search}%"))
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
            
        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        return users, total

    def get_user_detail(self, user_id: int) -> Optional[UserDetail]:
        """Get detailed user information"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
            
        projects_count = self.db.query(Project).filter(Project.developer_id == user_id).count()
        transactions_count = self.db.query(Transaction).filter(Transaction.user_id == user_id).count()
        holdings_count = self.db.query(CreditHolding).filter(CreditHolding.user_id == user_id).count()
        
        return UserDetail(
            id=user.id,
            email=user.email,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            profile_data=user.profile_data,
            projects_count=projects_count,
            transactions_count=transactions_count,
            holdings_count=holdings_count
        )

    def update_user(self, user_id: int, update_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
            
        update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
        for key, value in update_dict.items():
            if key == 'role' and value:
                setattr(user, key, UserRole(value))
            else:
                setattr(user, key, value)
                
        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        user.is_active = False
        self.db.commit()
        return True

    def create_admin(self, admin_data: AdminCreate) -> User:
        """Create a new admin user"""
        hashed_password = pwd_context.hash(admin_data.password)
        
        profile_data = admin_data.profile_data or {}
        profile_data['permission_level'] = admin_data.permission_level.value
        
        new_admin = User(
            email=admin_data.email,
            password_hash=hashed_password,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            profile_data=profile_data
        )
        
        self.db.add(new_admin)
        self.db.commit()
        self.db.refresh(new_admin)
        return new_admin

    # ===== Project Management =====
    def get_projects(self, page: int = 1, page_size: int = 20, status: Optional[str] = None,
                     search: Optional[str] = None) -> tuple:
        """Get paginated list of projects"""
        query = self.db.query(Project)
        
        if status:
            query = query.filter(Project.status == status)
        if search:
            query = query.filter(
                (Project.name.ilike(f"%{search}%")) | (Project.code.ilike(f"%{search}%"))
            )
            
        total = query.count()
        projects = query.order_by(desc(Project.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for p in projects:
            developer = self.db.query(User).filter(User.id == p.developer_id).first()
            result.append(ProjectListItem(
                id=p.id,
                name=p.name,
                code=p.code,
                project_type=p.project_type,
                status=p.status.value if hasattr(p.status, 'value') else str(p.status),
                developer_id=p.developer_id,
                developer_email=developer.email if developer else None,
                country=p.country,
                created_at=p.created_at,
                updated_at=p.updated_at
            ))
        
        return result, total

    def update_project_status(self, project_id: int, status_update: ProjectStatusUpdate) -> Optional[Project]:
        """Update project status"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
            
        project.status = ProjectStatus(status_update.status)
        self.db.commit()
        self.db.refresh(project)
        return project

    # ===== Transaction Management =====
    def get_transactions(self, page: int = 1, page_size: int = 20, 
                        tx_type: Optional[str] = None, status: Optional[str] = None) -> tuple:
        """Get paginated list of transactions"""
        query = self.db.query(Transaction)
        
        if tx_type:
            query = query.filter(Transaction.type == tx_type)
        if status:
            query = query.filter(Transaction.status == status)
            
        total = query.count()
        transactions = query.order_by(desc(Transaction.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for t in transactions:
            user = self.db.query(User).filter(User.id == t.user_id).first()
            project = self.db.query(Project).filter(Project.id == t.project_id).first() if t.project_id else None
            result.append(TransactionListItem(
                id=t.id,
                user_id=t.user_id,
                user_email=user.email if user else None,
                type=t.type.value if hasattr(t.type, 'value') else str(t.type),
                status=t.status.value if hasattr(t.status, 'value') else str(t.status),
                quantity=t.quantity,
                project_id=t.project_id,
                project_name=project.name if project else None,
                amount_cents=t.amount_cents,
                created_at=t.created_at
            ))
        
        return result, total

    # ===== Marketplace Management =====
    def get_listings(self, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> tuple:
        """Get paginated list of marketplace listings"""
        query = self.db.query(MarketListing)
        
        if status:
            query = query.filter(MarketListing.status == status)
            
        total = query.count()
        listings = query.order_by(desc(MarketListing.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for l in listings:
            seller = self.db.query(User).filter(User.id == l.seller_id).first()
            project = self.db.query(Project).filter(Project.id == l.project_id).first()
            result.append(ListingListItem(
                id=l.id,
                seller_id=l.seller_id,
                seller_email=seller.email if seller else None,
                project_id=l.project_id,
                project_name=project.name if project else None,
                vintage=l.vintage,
                quantity=l.quantity,
                quantity_sold=l.quantity_sold,
                price_per_ton_cents=l.price_per_ton_cents,
                status=l.status.value if hasattr(l.status, 'value') else str(l.status),
                created_at=l.created_at
            ))
        
        return result, total

    def remove_listing(self, listing_id: int) -> bool:
        """Remove a marketplace listing"""
        listing = self.db.query(MarketListing).filter(MarketListing.id == listing_id).first()
        if not listing:
            return False
        listing.status = ListingStatus.CANCELLED
        self.db.commit()
        return True

    # ===== Retirement Management =====
    def get_retirements(self, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> tuple:
        """Get paginated list of retirements"""
        query = self.db.query(Retirement)
        
        if status:
            query = query.filter(Retirement.status == status)
            
        total = query.count()
        retirements = query.order_by(desc(Retirement.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for r in retirements:
            user = self.db.query(User).filter(User.id == r.user_id).first()
            project = self.db.query(Project).filter(Project.id == r.project_id).first()
            result.append(RetirementListItem(
                id=r.id,
                user_id=r.user_id,
                user_email=user.email if user else None,
                project_id=r.project_id,
                project_name=project.name if project else None,
                certificate_id=r.certificate_id,
                quantity=r.quantity,
                vintage=r.vintage,
                beneficiary=r.beneficiary,
                status=r.status.value if hasattr(r.status, 'value') else str(r.status),
                created_at=r.created_at
            ))
        
        return result, total

    # ===== Audit Logs =====
    def get_audit_logs(self, page: int = 1, page_size: int = 50, 
                       action: Optional[str] = None, entity_type: Optional[str] = None) -> tuple:
        """Get paginated audit logs"""
        query = self.db.query(AuditLog)
        
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
            
        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for log in logs:
            actor_email = None
            if log.actor_id:
                actor = self.db.query(User).filter(User.id == log.actor_id).first()
                actor_email = actor.email if actor else None
            result.append(AuditLogItem(
                id=log.id,
                actor_id=log.actor_id,
                actor_email=actor_email,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                details=log.details,
                timestamp=log.timestamp
            ))
        
        return result, total

    # ===== API Health =====
    def get_health_status(self) -> HealthStatus:
        """Get API health status"""
        start = time.time()
        
        # Test database connection
        try:
            self.db.execute(text("SELECT 1"))
            db_status = "healthy"
        except Exception:
            db_status = "unhealthy"
        
        response_time = (time.time() - start) * 1000
        uptime = time.time() - START_TIME
        
        overall_status = "healthy" if db_status == "healthy" else "unhealthy"
        
        return HealthStatus(
            status=overall_status,
            database=db_status,
            uptime_seconds=uptime,
            response_time_ms=response_time,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

    # ===== Notifications =====
    def broadcast_notification(self, notification: BroadcastNotification, admin_id: int) -> int:
        """Send notification to users"""
        query = self.db.query(User).filter(User.is_active == True)
        
        if notification.target_roles:
            query = query.filter(User.role.in_(notification.target_roles))
        
        users = query.all()
        count = 0
        
        for user in users:
            notif = Notification(
                user_id=user.id,
                type="system",
                title=notification.title,
                message=notification.message
            )
            self.db.add(notif)
            count += 1
        
        # Audit log
        self.db.add(AuditLog(
            actor_id=admin_id,
            action="BROADCAST_NOTIFICATION",
            entity_type="NOTIFICATION",
            entity_id="broadcast",
            details={"recipients": count, "title": notification.title}
        ))
        
        self.db.commit()
        return count

    # ===== Analytics =====
    def get_analytics(self) -> PlatformAnalytics:
        """Get platform analytics data"""
        # User growth (last 30 days)
        from datetime import timedelta
        user_growth = []
        for i in range(30, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            count = self.db.query(User).filter(
                func.date(User.created_at) <= date.date()
            ).count()
            user_growth.append({"date": date.strftime("%Y-%m-%d"), "count": count})
        
        # Transaction trends
        transaction_trends = []
        for i in range(30, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            count = self.db.query(Transaction).filter(
                func.date(Transaction.created_at) == date.date()
            ).count()
            transaction_trends.append({"date": date.strftime("%Y-%m-%d"), "count": count})
        
        # Project type breakdown
        project_types = self.db.query(
            Project.project_type, func.count(Project.id)
        ).group_by(Project.project_type).all()
        project_type_breakdown = [{"type": t or "Unknown", "count": c} for t, c in project_types]
        
        # Geographic distribution (from wizard_data)
        geographic_distribution = []  # Would need to parse wizard_data
        
        # Revenue metrics
        total_revenue = self.db.query(
            func.coalesce(func.sum(Transaction.amount_cents), 0)
        ).filter(Transaction.status == TransactionStatus.COMPLETED).scalar() or 0
        
        revenue_metrics = {
            "total_revenue_cents": int(total_revenue),
            "total_transactions": self.db.query(Transaction).filter(
                Transaction.status == TransactionStatus.COMPLETED
            ).count()
        }
        
        return PlatformAnalytics(
            user_growth=user_growth,
            transaction_trends=transaction_trends,
            project_type_breakdown=project_type_breakdown,
            geographic_distribution=geographic_distribution,
            revenue_metrics=revenue_metrics
        )

    # ===== Task Management =====
    def get_tasks(self, page: int = 1, page_size: int = 20, 
                  task_type: Optional[str] = None, status: Optional[str] = None) -> tuple:
        """Get paginated list of admin tasks"""
        query = self.db.query(AdminTask)
        
        if task_type:
            query = query.filter(AdminTask.type == task_type)
        if status:
            query = query.filter(AdminTask.status == status)
            
        total = query.count()
        tasks = query.order_by(desc(AdminTask.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        result = []
        for t in tasks:
            creator_email = None
            if t.created_by:
                creator = self.db.query(User).filter(User.id == t.created_by).first()
                creator_email = creator.email if creator else None
            result.append(TaskListItem(
                id=t.id,
                type=t.type.value if hasattr(t.type, 'value') else str(t.type),
                title=t.title,
                description=t.description,
                link=t.link,
                status=t.status.value if hasattr(t.status, 'value') else str(t.status),
                priority=t.priority.value if hasattr(t.priority, 'value') else str(t.priority),
                documents=t.documents or [],
                created_by=t.created_by,
                creator_email=creator_email,
                created_at=t.created_at,
                updated_at=t.updated_at
            ))
        
        return result, total

    def create_task(self, task_data: TaskCreate, admin_id: int) -> AdminTask:
        """Create a new admin task"""
        new_task = AdminTask(
            type=TaskType(task_data.type),
            title=task_data.title,
            description=task_data.description,
            link=task_data.link,
            priority=TaskPriority(task_data.priority),
            created_by=admin_id
        )
        
        self.db.add(new_task)
        self.db.commit()
        self.db.refresh(new_task)
        
        # Audit log
        self.db.add(AuditLog(
            actor_id=admin_id,
            action="CREATE_TASK",
            entity_type="ADMIN_TASK",
            entity_id=str(new_task.id),
            details={"title": task_data.title, "type": task_data.type}
        ))
        self.db.commit()
        
        return new_task

    def update_task(self, task_id: int, update_data: TaskUpdate, admin_id: int) -> Optional[AdminTask]:
        """Update an existing task"""
        task = self.db.query(AdminTask).filter(AdminTask.id == task_id).first()
        if not task:
            return None
            
        if update_data.title is not None:
            task.title = update_data.title
        if update_data.description is not None:
            task.description = update_data.description
        if update_data.link is not None:
            task.link = update_data.link
        if update_data.status is not None:
            task.status = TaskStatusEnum(update_data.status)
        if update_data.priority is not None:
            task.priority = TaskPriority(update_data.priority)
            
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete_task(self, task_id: int) -> bool:
        """Delete a task"""
        task = self.db.query(AdminTask).filter(AdminTask.id == task_id).first()
        if not task:
            return False
        self.db.delete(task)
        self.db.commit()
        return True

    def get_admins(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> tuple:
        """Get paginated list of admin users"""
        query = self.db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
        
        if search:
            query = query.filter(User.email.ilike(f"%{search}%"))
            
        total = query.count()
        admins = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        return admins, total

    # ===== Registry Management =====
    def get_registries(self, include_inactive: bool = False) -> List[RegistryItem]:
        """Get all registries"""
        query = self.db.query(Registry)
        if not include_inactive:
            query = query.filter(Registry.is_active == True)
        registries = query.order_by(Registry.display_order).all()
        return [RegistryItem.model_validate(r) for r in registries]

    def create_registry(self, data: RegistryCreate) -> Registry:
        """Create a new registry"""
        registry = Registry(**data.model_dump())
        self.db.add(registry)
        self.db.commit()
        self.db.refresh(registry)
        return registry

    def update_registry(self, registry_id: int, data: RegistryUpdate) -> Optional[Registry]:
        """Update a registry"""
        registry = self.db.query(Registry).filter(Registry.id == registry_id).first()
        if not registry:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(registry, key, value)
        self.db.commit()
        self.db.refresh(registry)
        return registry

    def delete_registry(self, registry_id: int) -> bool:
        """Delete a registry"""
        registry = self.db.query(Registry).filter(Registry.id == registry_id).first()
        if not registry:
            return False
        self.db.delete(registry)
        self.db.commit()
        return True

    # ===== Project Type Management =====
    def get_project_types(self, include_inactive: bool = False) -> List[ProjectTypeItem]:
        """Get all project types"""
        query = self.db.query(ProjectTypeConfig)
        if not include_inactive:
            query = query.filter(ProjectTypeConfig.is_active == True)
        types = query.order_by(ProjectTypeConfig.display_order).all()
        return [ProjectTypeItem.model_validate(t) for t in types]

    def create_project_type(self, data: ProjectTypeCreate) -> ProjectTypeConfig:
        """Create a new project type"""
        pt = ProjectTypeConfig(**data.model_dump())
        self.db.add(pt)
        self.db.commit()
        self.db.refresh(pt)
        return pt

    def update_project_type(self, type_id: int, data: ProjectTypeUpdate) -> Optional[ProjectTypeConfig]:
        """Update a project type"""
        pt = self.db.query(ProjectTypeConfig).filter(ProjectTypeConfig.id == type_id).first()
        if not pt:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(pt, key, value)
        self.db.commit()
        self.db.refresh(pt)
        return pt

    def delete_project_type(self, type_id: int) -> bool:
        """Delete a project type"""
        pt = self.db.query(ProjectTypeConfig).filter(ProjectTypeConfig.id == type_id).first()
        if not pt:
            return False
        self.db.delete(pt)
        self.db.commit()
        return True

    # ===== Feature Flag Management =====
    def get_feature_flags(self) -> List[FeatureFlagItem]:
        """Get all feature flags"""
        flags = self.db.query(FeatureFlag).order_by(FeatureFlag.key).all()
        return [FeatureFlagItem.model_validate(f) for f in flags]

    def create_feature_flag(self, data: FeatureFlagCreate) -> FeatureFlag:
        """Create a new feature flag"""
        flag = FeatureFlag(**data.model_dump())
        self.db.add(flag)
        self.db.commit()
        self.db.refresh(flag)
        return flag

    def update_feature_flag(self, flag_id: int, data: FeatureFlagUpdate) -> Optional[FeatureFlag]:
        """Update a feature flag"""
        flag = self.db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
        if not flag:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(flag, key, value)
        self.db.commit()
        self.db.refresh(flag)
        return flag

    def delete_feature_flag(self, flag_id: int) -> bool:
        """Delete a feature flag"""
        flag = self.db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
        if not flag:
            return False
        self.db.delete(flag)
        self.db.commit()
        return True

    # ===== Announcement Management =====
    def get_announcements(self, include_inactive: bool = False) -> List[AnnouncementItem]:
        """Get all announcements"""
        query = self.db.query(Announcement)
        if not include_inactive:
            query = query.filter(Announcement.is_active == True)
        announcements = query.order_by(desc(Announcement.created_at)).all()
        return [AnnouncementItem.model_validate(a) for a in announcements]

    def create_announcement(self, data: AnnouncementCreate, admin_id: int) -> Announcement:
        """Create a new announcement"""
        announcement = Announcement(**data.model_dump(), created_by=admin_id)
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def update_announcement(self, ann_id: int, data: AnnouncementUpdate) -> Optional[Announcement]:
        """Update an announcement"""
        ann = self.db.query(Announcement).filter(Announcement.id == ann_id).first()
        if not ann:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(ann, key, value)
        self.db.commit()
        self.db.refresh(ann)
        return ann

    def delete_announcement(self, ann_id: int) -> bool:
        """Delete an announcement"""
        ann = self.db.query(Announcement).filter(Announcement.id == ann_id).first()
        if not ann:
            return False
        self.db.delete(ann)
        self.db.commit()
        return True

    # ===== Platform Fee Management =====
    def get_platform_fees(self) -> List[PlatformFeeItem]:
        """Get all platform fees"""
        fees = self.db.query(PlatformFee).order_by(PlatformFee.fee_type).all()
        return [PlatformFeeItem.model_validate(f) for f in fees]

    def create_platform_fee(self, data: PlatformFeeCreate) -> PlatformFee:
        """Create a new platform fee"""
        fee = PlatformFee(**data.model_dump())
        self.db.add(fee)
        self.db.commit()
        self.db.refresh(fee)
        return fee

    def update_platform_fee(self, fee_id: int, data: PlatformFeeUpdate) -> Optional[PlatformFee]:
        """Update a platform fee"""
        fee = self.db.query(PlatformFee).filter(PlatformFee.id == fee_id).first()
        if not fee:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(fee, key, value)
        self.db.commit()
        self.db.refresh(fee)
        return fee

    def delete_platform_fee(self, fee_id: int) -> bool:
        """Delete a platform fee"""
        fee = self.db.query(PlatformFee).filter(PlatformFee.id == fee_id).first()
        if not fee:
            return False
        self.db.delete(fee)
        self.db.commit()
        return True

    # ===== Email Template Management =====
    def get_email_templates(self) -> List[EmailTemplateItem]:
        """Get all email templates"""
        templates = self.db.query(EmailTemplate).order_by(EmailTemplate.key).all()
        return [EmailTemplateItem.model_validate(t) for t in templates]

    def create_email_template(self, data: EmailTemplateCreate) -> EmailTemplate:
        """Create a new email template"""
        template = EmailTemplate(**data.model_dump())
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_email_template(self, template_id: int, data: EmailTemplateUpdate) -> Optional[EmailTemplate]:
        """Update an email template"""
        template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
        if not template:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(template, key, value)
        self.db.commit()
        self.db.refresh(template)
        return template

    def delete_email_template(self, template_id: int) -> bool:
        """Delete an email template"""
        template = self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
        if not template:
            return False
        self.db.delete(template)
        self.db.commit()
        return True
