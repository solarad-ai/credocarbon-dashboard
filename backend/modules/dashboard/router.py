"""
Dashboard API Module
Database-backed aggregated data for dashboards
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from backend.core.database import get_db
from backend.core.models import (
    User, Project, ProjectStatus,
    CreditHolding, Transaction, TransactionType, TransactionStatus,
    MarketListing, ListingStatus, Retirement, RetirementStatus
)
from backend.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ============ Schemas ============

class DeveloperDashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_credits_issued: int
    credits_available: int
    credits_sold: int
    revenue_mtd: float
    pending_verifications: int

class BuyerDashboardStats(BaseModel):
    total_credits: int
    total_value: float
    credits_retired: int
    pending_orders: int
    carbon_offset_tons: float
    active_offers: int

class ActivityItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    timestamp: str
    icon: str

class ProjectSummary(BaseModel):
    id: int
    name: str
    code: str
    status: str
    project_type: str
    progress: int
    credits_issued: Optional[int]
    next_action: str

# ============ Endpoints ============

@router.get("/developer/stats", response_model=DeveloperDashboardStats)
def get_developer_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get developer dashboard statistics from database"""
    
    projects = db.query(Project).filter(Project.developer_id == current_user.id).all()
    holdings = db.query(CreditHolding).filter(CreditHolding.user_id == current_user.id).all()
    
    total_credits = sum(h.quantity for h in holdings)
    available_credits = sum(h.available for h in holdings)
    
    # Get sales this month
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    sales = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.SALE,
        Transaction.status == TransactionStatus.COMPLETED,
        Transaction.created_at >= current_month
    ).all()
    
    credits_sold = sum(t.quantity for t in sales)
    revenue_mtd = sum(t.amount_cents / 100.0 for t in sales if t.amount_cents)
    
    # Count pending verifications
    pending_verifications = len([p for p in projects if p.status in [
        ProjectStatus.VERIFICATION_PENDING, ProjectStatus.VALIDATION_PENDING
    ]])
    
    return DeveloperDashboardStats(
        total_projects=len(projects),
        active_projects=len([p for p in projects if p.status != ProjectStatus.DRAFT]),
        total_credits_issued=total_credits,
        credits_available=available_credits,
        credits_sold=credits_sold,
        revenue_mtd=revenue_mtd,
        pending_verifications=pending_verifications
    )

@router.get("/buyer/stats", response_model=BuyerDashboardStats)
def get_buyer_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get buyer dashboard statistics from database"""
    
    holdings = db.query(CreditHolding).filter(CreditHolding.user_id == current_user.id).all()
    retirements = db.query(Retirement).filter(
        Retirement.user_id == current_user.id,
        Retirement.status == RetirementStatus.COMPLETED
    ).all()
    
    total_credits = sum(h.quantity for h in holdings)
    total_value = sum(h.quantity * (h.unit_price / 100.0) for h in holdings)
    credits_retired = sum(r.quantity for r in retirements)
    
    # Count pending and active items
    from backend.core.models import Offer, OfferStatus
    active_offers = db.query(Offer).filter(
        Offer.buyer_id == current_user.id,
        Offer.status.in_([OfferStatus.PENDING, OfferStatus.COUNTER])
    ).count()
    
    pending_retirements = db.query(Retirement).filter(
        Retirement.user_id == current_user.id,
        Retirement.status == RetirementStatus.PENDING
    ).count()
    
    return BuyerDashboardStats(
        total_credits=total_credits,
        total_value=total_value,
        credits_retired=credits_retired,
        pending_orders=pending_retirements,
        carbon_offset_tons=float(credits_retired),
        active_offers=active_offers
    )

@router.get("/activity", response_model=List[ActivityItem])
def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity from transactions and project updates"""
    
    activities = []
    
    # Helper function to format timestamps
    def format_timestamp(dt):
        if not dt:
            return ""
        delta = datetime.utcnow() - dt
        if delta.days == 0:
            if delta.seconds < 60:
                return "Just now"
            elif delta.seconds < 3600:
                return f"{delta.seconds // 60} minutes ago"
            else:
                return f"{delta.seconds // 3600} hours ago"
        elif delta.days == 1:
            return "Yesterday"
        elif delta.days < 7:
            return f"{delta.days} days ago"
        else:
            return dt.strftime("%b %d")
    
    # Get transactions
    transactions = db.query(Transaction)\
        .filter(Transaction.user_id == current_user.id)\
        .order_by(Transaction.created_at.desc())\
        .limit(limit)\
        .all()
    
    for t in transactions:
        project = db.query(Project).filter(Project.id == t.project_id).first() if t.project_id else None
        project_name = project.name if project else "Unknown"
        
        type_config = {
            TransactionType.ISSUANCE: ("Credits Issued", f"{t.quantity:,} VCUs issued for {project_name}", "coins"),
            TransactionType.SALE: ("Sale Completed", f"Sold {t.quantity:,} credits", "dollar"),
            TransactionType.PURCHASE: ("Purchase Complete", f"Bought {t.quantity:,} credits", "cart"),
            TransactionType.RETIREMENT: ("Credits Retired", f"Retired {t.quantity:,} credits", "leaf"),
            TransactionType.TRANSFER_IN: ("Transfer Received", f"Received {t.quantity:,} credits", "arrow-down"),
            TransactionType.TRANSFER_OUT: ("Transfer Sent", f"Sent {t.quantity:,} credits", "arrow-up"),
        }
        
        title, description, icon = type_config.get(t.type, ("Transaction", f"{t.quantity} credits", "activity"))
        
        activities.append({
            "id": t.id,
            "type": t.type.value,
            "title": title,
            "description": description,
            "timestamp": format_timestamp(t.created_at),
            "icon": icon,
            "sort_time": t.created_at
        })
    
    # Get project activities (creation, updates, status changes)
    projects = db.query(Project)\
        .filter(Project.developer_id == current_user.id)\
        .order_by(Project.updated_at.desc())\
        .limit(limit)\
        .all()
    
    for p in projects:
        # Project creation activity
        activities.append({
            "id": p.id * 10000,  # Unique ID
            "type": "project_created",
            "title": "Project Created",
            "description": f"Created project '{p.name}'",
            "timestamp": format_timestamp(p.created_at),
            "icon": "folder-plus",
            "sort_time": p.created_at
        })
        
        # Project update activity (if updated after creation)
        if p.updated_at and p.created_at and p.updated_at > p.created_at + timedelta(minutes=1):
            # Determine what was updated based on wizard_data
            wd = p.wizard_data or {}
            update_description = "Project updated"
            
            if wd.get('estimationResult'):
                update_description = f"Credit estimation completed for '{p.name}'"
            elif wd.get('stakeholders') and len(wd.get('stakeholders', [])) > 0:
                update_description = f"Stakeholders added to '{p.name}'"
            elif wd.get('compliance'):
                update_description = f"Compliance checklist updated for '{p.name}'"
            elif wd.get('registrySubmission'):
                update_description = f"Registry documents generated for '{p.name}'"
            else:
                update_description = f"Wizard progress saved for '{p.name}'"
            
            activities.append({
                "id": p.id * 10000 + 1,
                "type": "project_updated",
                "title": "Project Updated",
                "description": update_description,
                "timestamp": format_timestamp(p.updated_at),
                "icon": "edit",
                "sort_time": p.updated_at
            })
        
        # Status change activity (if not draft)
        if p.status and p.status != ProjectStatus.DRAFT:
            status_titles = {
                ProjectStatus.SUBMITTED_TO_VVB: ("Submitted to Registry", f"'{p.name}' submitted for validation"),
                ProjectStatus.VALIDATION_PENDING: ("Validation Started", f"'{p.name}' is being validated"),
                ProjectStatus.VALIDATION_APPROVED: ("Validation Approved", f"'{p.name}' passed validation"),
                ProjectStatus.VERIFICATION_PENDING: ("Verification Started", f"'{p.name}' is being verified"),
                ProjectStatus.VERIFICATION_APPROVED: ("Verification Approved", f"'{p.name}' passed verification"),
                ProjectStatus.REGISTRY_REVIEW: ("Registry Review", f"'{p.name}' is under registry review"),
                ProjectStatus.ISSUED: ("Credits Issued", f"Carbon credits issued for '{p.name}'"),
            }
            
            if p.status in status_titles:
                title, description = status_titles[p.status]
                activities.append({
                    "id": p.id * 10000 + 2,
                    "type": "status_change",
                    "title": title,
                    "description": description,
                    "timestamp": format_timestamp(p.updated_at),
                    "icon": "check-circle",
                    "sort_time": p.updated_at
                })
    
    # Get market listings
    listings = db.query(MarketListing)\
        .filter(MarketListing.seller_id == current_user.id)\
        .order_by(MarketListing.created_at.desc())\
        .limit(limit)\
        .all()
    
    for listing in listings:
        project = db.query(Project).filter(Project.id == listing.project_id).first()
        project_name = project.name if project else f"Project {listing.project_id}"
        
        status_config = {
            ListingStatus.ACTIVE: ("Listing Created", f"Listed {listing.quantity:,} credits for sale", "package"),
            ListingStatus.SOLD: ("Listing Sold", f"All {listing.quantity:,} credits sold", "check"),
            ListingStatus.CANCELLED: ("Listing Cancelled", f"Cancelled listing of {listing.quantity:,} credits", "x"),
            ListingStatus.EXPIRED: ("Listing Expired", f"Listing of {listing.quantity:,} credits expired", "clock"),
        }
        
        title, description, icon = status_config.get(listing.status, ("Market Activity", "Market activity", "shopping-cart"))
        
        activities.append({
            "id": listing.id * 20000,
            "type": "market_listing",
            "title": title,
            "description": f"{description} from '{project_name}'",
            "timestamp": format_timestamp(listing.created_at),
            "icon": icon,
            "sort_time": listing.created_at
        })
    
    # Get offers (both sent and received)
    from backend.core.models import Offer, OfferStatus
    
    sent_offers = db.query(Offer)\
        .filter(Offer.buyer_id == current_user.id)\
        .order_by(Offer.created_at.desc())\
        .limit(limit)\
        .all()
    
    for offer in sent_offers:
        listing = db.query(MarketListing).filter(MarketListing.id == offer.listing_id).first()
        
        offer_status_config = {
            OfferStatus.PENDING: ("Offer Sent", f"Sent offer for {offer.quantity:,} credits at ${offer.price_per_ton_cents/100:.2f}/t"),
            OfferStatus.ACCEPTED: ("Offer Accepted", f"Your offer for {offer.quantity:,} credits was accepted"),
            OfferStatus.REJECTED: ("Offer Rejected", f"Your offer for {offer.quantity:,} credits was rejected"),
            OfferStatus.COUNTER: ("Counter Offer", f"Received counter offer for {offer.quantity:,} credits"),
            OfferStatus.EXPIRED: ("Offer Expired", f"Your offer for {offer.quantity:,} credits expired"),
        }
        
        title, description = offer_status_config.get(offer.status, ("Offer", f"Offer for {offer.quantity} credits"))
        
        activities.append({
            "id": offer.id * 30000,
            "type": "offer",
            "title": title,
            "description": description,
            "timestamp": format_timestamp(offer.created_at),
            "icon": "message-square",
            "sort_time": offer.updated_at or offer.created_at
        })
    
    # Get retirements
    retirements = db.query(Retirement)\
        .filter(Retirement.user_id == current_user.id)\
        .order_by(Retirement.created_at.desc())\
        .limit(limit)\
        .all()
    
    for retirement in retirements:
        status_icon = "leaf" if retirement.status == RetirementStatus.COMPLETED else "clock"
        status_text = "completed" if retirement.status == RetirementStatus.COMPLETED else "pending"
        
        activities.append({
            "id": retirement.id * 40000,
            "type": "retirement",
            "title": "Carbon Credits Retired",
            "description": f"Retired {retirement.quantity:,} credits ({status_text}) - {retirement.beneficiary_name or 'Self'}",
            "timestamp": format_timestamp(retirement.created_at),
            "icon": status_icon,
            "sort_time": retirement.created_at
        })
    
    # Get credit holdings (new acquisitions)
    holdings = db.query(CreditHolding)\
        .filter(CreditHolding.user_id == current_user.id)\
        .order_by(CreditHolding.acquired_date.desc())\
        .limit(limit)\
        .all()
    
    for holding in holdings:
        project = db.query(Project).filter(Project.id == holding.project_id).first()
        project_name = project.name if project else f"Project {holding.project_id}"
        
        activities.append({
            "id": holding.id * 50000,
            "type": "credit_acquired",
            "title": "Credits Acquired",
            "description": f"Acquired {holding.quantity:,} credits from '{project_name}'",
            "timestamp": format_timestamp(holding.acquired_date),
            "icon": "coins",
            "sort_time": holding.acquired_date
        })
    
    # Sort all activities by time and limit
    activities.sort(key=lambda x: x.get("sort_time") or datetime.min, reverse=True)
    activities = activities[:limit]
    
    # Convert to response format
    return [
        ActivityItem(
            id=a["id"],
            type=a["type"],
            title=a["title"],
            description=a["description"],
            timestamp=a["timestamp"],
            icon=a["icon"]
        )
        for a in activities
    ]

@router.get("/projects/summary", response_model=List[ProjectSummary])
def get_projects_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get project summary from database"""
    
    projects = db.query(Project).filter(Project.developer_id == current_user.id).all()
    
    def calculate_wizard_progress(project):
        """Calculate wizard completion percentage from wizard_data"""
        wd = project.wizard_data or {}
        
        steps_completed = 0
        
        # Step 1: Basic Info - check if name and country exist
        if (wd.get('projectName') or project.name) and wd.get('country'):
            steps_completed += 1
        
        # Step 2: Credit Estimation - check for estimation result or methodology
        if wd.get('estimationResult') or wd.get('selectedMethodology') or wd.get('uploadedFile'):
            steps_completed += 1
        
        # Step 3: Stakeholders - check if stakeholders array has items
        stakeholders = wd.get('stakeholders', [])
        if stakeholders and len(stakeholders) > 0:
            steps_completed += 1
        
        # Step 4: Compliance - check if any checklist items are checked
        compliance = wd.get('compliance', {})
        env_checklist = compliance.get('environmentalChecklist', []) or wd.get('environmentalChecklist', [])
        if any(item.get('checked') for item in env_checklist if isinstance(item, dict)):
            steps_completed += 1
        
        # Step 5: Registry Submission - check if any documents are not pending
        registry_docs = wd.get('registrySubmission', {}).get('documents', []) or wd.get('documents', [])
        if any(doc.get('status') != 'pending' for doc in registry_docs if isinstance(doc, dict)):
            steps_completed += 1
        
        return int((steps_completed / 5) * 100)
    
    summaries = []
    for project in projects:
        next_action_map = {
            ProjectStatus.DRAFT: "Complete wizard",
            ProjectStatus.SUBMITTED_TO_VVB: "Awaiting VVB response",
            ProjectStatus.VALIDATION_PENDING: "Upload documents",
            ProjectStatus.VALIDATION_APPROVED: "Start verification",
            ProjectStatus.VERIFICATION_PENDING: "Submit monitoring report",
            ProjectStatus.VERIFICATION_APPROVED: "Submit to registry",
            ProjectStatus.REGISTRY_REVIEW: "Awaiting registration",
            ProjectStatus.ISSUED: "List for sale"
        }
        
        # Get credits issued for this project
        holdings = db.query(CreditHolding).filter(
            CreditHolding.user_id == current_user.id,
            CreditHolding.project_id == project.id
        ).all()
        credits_issued = sum(h.quantity for h in holdings) if project.status == ProjectStatus.ISSUED else None
        
        # Calculate actual wizard progress
        progress = calculate_wizard_progress(project)
        
        summaries.append(ProjectSummary(
            id=project.id,
            name=project.name or f"Project {project.id}",
            code=project.code or f"P-{project.id}",
            status=project.status.value if project.status else "DRAFT",
            project_type=project.project_type or "unknown",
            progress=progress,
            credits_issued=credits_issued,
            next_action=next_action_map.get(project.status, "Continue setup")
        ))
    
    return summaries

@router.get("/marketplace/featured")
def get_featured_listings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get featured marketplace listings from database"""
    
    listings = db.query(MarketListing)\
        .filter(MarketListing.status == ListingStatus.ACTIVE)\
        .order_by(MarketListing.created_at.desc())\
        .limit(6)\
        .all()
    
    result = []
    for listing in listings:
        project = db.query(Project).filter(Project.id == listing.project_id).first()
        seller = db.query(User).filter(User.id == listing.seller_id).first()
        
        project_name = project.name if project else f"Project {listing.project_id}"
        project_type = project.project_type if project else "unknown"
        registry = "VCS"
        location = "India"
        if project and project.wizard_data:
            registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
            location = project.wizard_data.get("basic_info", {}).get("location", "India")
        
        seller_name = seller.profile_data.get("company", seller.email) if seller and seller.profile_data else "Unknown"
        
        result.append({
            "id": listing.id,
            "project_name": project_name,
            "project_type": project_type,
            "registry": registry,
            "vintage": listing.vintage,
            "quantity_available": listing.quantity - listing.quantity_sold,
            "price_per_ton": listing.price_per_ton_cents / 100.0,
            "rating": 4.8,
            "location": location,
            "seller": seller_name
        })
    
    return result
