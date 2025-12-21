"""
Notification API Module
Handles user notifications - Database backed
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from apps.api.core.database import get_db
from apps.api.core.models import User, Notification as NotificationModel, NotificationType
from apps.api.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# ============ Schemas ============

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: Optional[str]
    link: Optional[str]
    read: bool
    timestamp: str

    class Config:
        from_attributes = True

# ============ Endpoints ============

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all notifications for current user - combines database and generated notifications"""
    from datetime import timedelta
    from apps.api.core.models import (
        Project, ProjectStatus, MarketListing, ListingStatus,
        Transaction, TransactionType, Retirement, RetirementStatus,
        CreditHolding
    )
    
    # First get database notifications
    db_notifications = db.query(NotificationModel)\
        .filter(NotificationModel.user_id == current_user.id)\
        .order_by(NotificationModel.created_at.desc())\
        .all()
    
    notifications = []
    
    # Add database notifications
    for n in db_notifications:
        notifications.append({
            "id": n.id,
            "type": n.type.value if hasattr(n.type, 'value') else str(n.type),
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "read": n.read,
            "timestamp": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "",
            "sort_time": n.created_at
        })
    
    # Generate notifications from projects
    projects = db.query(Project).filter(Project.developer_id == current_user.id).all()
    
    for p in projects:
        # Project created notification
        notifications.append({
            "id": p.id * 10000,
            "type": "lifecycle",
            "title": "Project Created",
            "message": f"Your project '{p.name}' has been created successfully. Complete the wizard to proceed.",
            "link": f"/dashboard/developer/project/{p.id}/wizard/basic-info",
            "read": True,  # Auto-generated ones are read
            "timestamp": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
            "sort_time": p.created_at
        })
        
        # Wizard progress notifications
        wd = p.wizard_data or {}
        if wd.get('estimationResult'):
            notifications.append({
                "id": p.id * 10000 + 1,
                "type": "lifecycle",
                "title": "Credit Estimation Complete",
                "message": f"Carbon credit estimation for '{p.name}' has been calculated.",
                "link": f"/dashboard/developer/project/{p.id}/wizard/credit-estimation",
                "read": True,
                "timestamp": p.updated_at.strftime("%Y-%m-%d %H:%M") if p.updated_at else "",
                "sort_time": p.updated_at
            })
        
        # Status change notifications
        if p.status and p.status != ProjectStatus.DRAFT:
            status_notifications = {
                ProjectStatus.SUBMITTED_TO_VVB: ("Submitted for Validation", f"'{p.name}' has been submitted to the registry for validation.", "validation"),
                ProjectStatus.VALIDATION_PENDING: ("Validation In Progress", f"'{p.name}' is currently being validated.", "validation"),
                ProjectStatus.VALIDATION_APPROVED: ("Validation Approved", f"Congratulations! '{p.name}' has passed validation.", "validation"),
                ProjectStatus.VERIFICATION_PENDING: ("Verification In Progress", f"'{p.name}' is currently being verified.", "validation"),
                ProjectStatus.VERIFICATION_APPROVED: ("Verification Approved", f"'{p.name}' has passed verification.", "validation"),
                ProjectStatus.REGISTRY_REVIEW: ("Registry Review", f"'{p.name}' is under registry review.", "validation"),
                ProjectStatus.ISSUED: ("Credits Issued!", f"Carbon credits for '{p.name}' have been issued.", "market"),
            }
            
            if p.status in status_notifications:
                title, message, ntype = status_notifications[p.status]
                notifications.append({
                    "id": p.id * 10000 + 2,
                    "type": ntype,
                    "title": title,
                    "message": message,
                    "link": f"/dashboard/developer/project/{p.id}/progress",
                    "read": False,
                    "timestamp": p.updated_at.strftime("%Y-%m-%d %H:%M") if p.updated_at else "",
                    "sort_time": p.updated_at
                })
    
    # Generate notifications from market listings
    listings = db.query(MarketListing).filter(MarketListing.seller_id == current_user.id).all()
    
    for listing in listings:
        if listing.status == ListingStatus.ACTIVE:
            notifications.append({
                "id": listing.id * 20000,
                "type": "market",
                "title": "Listing Active",
                "message": f"Your listing of {listing.quantity:,} credits is now live on the marketplace.",
                "link": "/dashboard/developer/market/sell-orders",
                "read": True,
                "timestamp": listing.created_at.strftime("%Y-%m-%d %H:%M") if listing.created_at else "",
                "sort_time": listing.created_at
            })
        elif listing.quantity_sold > 0:
            notifications.append({
                "id": listing.id * 20000 + 1,
                "type": "sale",
                "title": "Credits Sold!",
                "message": f"You sold {listing.quantity_sold:,} credits from your listing.",
                "link": "/dashboard/developer/market/sell-orders",
                "read": False,
                "timestamp": listing.updated_at.strftime("%Y-%m-%d %H:%M") if listing.updated_at else "",
                "sort_time": listing.updated_at
            })
    
    # Generate notifications from transactions
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).limit(20).all()
    
    for t in transactions:
        type_map = {
            TransactionType.SALE: ("Sale Completed", f"Sold {t.quantity:,} credits for ${t.amount_cents/100:.2f}", "sale"),
            TransactionType.PURCHASE: ("Purchase Completed", f"Purchased {t.quantity:,} credits", "purchase"),
            TransactionType.ISSUANCE: ("Credits Issued", f"{t.quantity:,} VCUs issued to your account", "market"),
            TransactionType.RETIREMENT: ("Credits Retired", f"Successfully retired {t.quantity:,} credits", "system"),
        }
        
        if t.type in type_map:
            title, message, ntype = type_map[t.type]
            notifications.append({
                "id": t.id * 30000,
                "type": ntype,
                "title": title,
                "message": message,
                "link": "/dashboard/developer",
                "read": True,
                "timestamp": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
                "sort_time": t.created_at
            })
    
    # Generate notifications from retirements
    retirements = db.query(Retirement).filter(Retirement.user_id == current_user.id).all()
    
    for r in retirements:
        notifications.append({
            "id": r.id * 40000,
            "type": "system",
            "title": "Carbon Credits Retired",
            "message": f"Retired {r.quantity:,} credits for {r.beneficiary_name or 'self'}.",
            "link": "/dashboard/developer",
            "read": True,
            "timestamp": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
            "sort_time": r.created_at
        })
    
    # Add a system welcome notification
    notifications.append({
        "id": current_user.id * 50000,
        "type": "system",
        "title": "Welcome to Credo Carbon!",
        "message": "Your account has been set up successfully. Start by creating your first carbon credit project.",
        "link": "/dashboard/developer/project/create",
        "read": True,
        "timestamp": current_user.created_at.strftime("%Y-%m-%d %H:%M") if current_user.created_at else "",
        "sort_time": current_user.created_at
    })
    
    # Sort by time and convert to response format
    notifications.sort(key=lambda x: x.get("sort_time") or datetime.min, reverse=True)
    
    return [
        NotificationResponse(
            id=n["id"],
            type=n["type"],
            title=n["title"],
            message=n.get("message"),
            link=n.get("link"),
            read=n["read"],
            timestamp=n["timestamp"]
        )
        for n in notifications[:50]  # Limit to 50 notifications
    ]

@router.get("/unread-count")
def get_unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get unread notification count from database"""
    
    count = db.query(NotificationModel)\
        .filter(NotificationModel.user_id == current_user.id, NotificationModel.read == False)\
        .count()
    
    return {"count": count}

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark a notification as read"""
    
    notification = db.query(NotificationModel)\
        .filter(NotificationModel.id == notification_id, NotificationModel.user_id == current_user.id)\
        .first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    
    return {"success": True}

@router.put("/mark-all-read")
def mark_all_as_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark all notifications as read"""
    
    count = db.query(NotificationModel)\
        .filter(NotificationModel.user_id == current_user.id, NotificationModel.read == False)\
        .update({"read": True})
    
    db.commit()
    
    return {"success": True, "count": count}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a notification"""
    
    notification = db.query(NotificationModel)\
        .filter(NotificationModel.id == notification_id, NotificationModel.user_id == current_user.id)\
        .first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"success": True}
