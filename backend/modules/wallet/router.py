"""
Wallet/Portfolio API Module
Database-backed credit holdings and transactions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.core.database import get_db
from backend.core.models import (
    User, Project, CreditHolding as HoldingModel,
    Transaction as TransactionModel, TransactionType, TransactionStatus
)
from backend.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/wallet", tags=["wallet"])

# ============ Schemas ============

class CreditHoldingResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    project_type: str
    registry: str
    vintage: int
    quantity: int
    available: int
    locked: int
    unit_price: float
    serial_start: Optional[str]
    serial_end: Optional[str]

class WalletSummary(BaseModel):
    total_credits: int
    total_value: float
    available_credits: int
    locked_credits: int
    retired_credits: int
    holdings: List[CreditHoldingResponse]

class TransactionResponse(BaseModel):
    id: int
    type: str
    quantity: int
    project_name: str
    counterparty: Optional[str]
    amount: Optional[float]
    date: str
    status: str

# ============ Endpoints ============

@router.get("/summary", response_model=WalletSummary)
def get_wallet_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get wallet summary with all credit holdings from database"""
    
    holdings = db.query(HoldingModel)\
        .filter(HoldingModel.user_id == current_user.id)\
        .all()
    
    holdings_response = []
    total_credits = 0
    total_value = 0.0
    available_credits = 0
    locked_credits = 0
    
    for h in holdings:
        project = db.query(Project).filter(Project.id == h.project_id).first()
        project_name = project.name if project else f"Project {h.project_id}"
        project_type = project.project_type if project else "unknown"
        
        # Get registry from wizard_data if available
        registry = "VCS"
        if project and project.wizard_data:
            registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
        
        unit_price = h.unit_price / 100.0  # Convert cents to dollars
        
        holdings_response.append(CreditHoldingResponse(
            id=h.id,
            project_id=h.project_id,
            project_name=project_name,
            project_type=project_type,
            registry=registry,
            vintage=h.vintage,
            quantity=h.quantity,
            available=h.available,
            locked=h.locked,
            unit_price=unit_price,
            serial_start=h.serial_start,
            serial_end=h.serial_end
        ))
        
        total_credits += h.quantity
        total_value += h.quantity * unit_price
        available_credits += h.available
        locked_credits += h.locked
    
    # Count retired credits from transactions
    retired = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == current_user.id, 
                TransactionModel.type == TransactionType.RETIREMENT,
                TransactionModel.status == TransactionStatus.COMPLETED)\
        .all()
    retired_credits = sum(t.quantity for t in retired)
    
    return WalletSummary(
        total_credits=total_credits,
        total_value=total_value,
        available_credits=available_credits,
        locked_credits=locked_credits,
        retired_credits=retired_credits,
        holdings=holdings_response
    )

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent transactions from database"""
    
    transactions = db.query(TransactionModel)\
        .filter(TransactionModel.user_id == current_user.id)\
        .order_by(TransactionModel.created_at.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for t in transactions:
        project = db.query(Project).filter(Project.id == t.project_id).first() if t.project_id else None
        project_name = project.name if project else "Unknown Project"
        
        counterparty = None
        if t.counterparty_id:
            cp = db.query(User).filter(User.id == t.counterparty_id).first()
            if cp and cp.profile_data:
                counterparty = cp.profile_data.get("company") or cp.profile_data.get("name") or cp.email
        
        result.append(TransactionResponse(
            id=t.id,
            type=t.type.value if hasattr(t.type, 'value') else str(t.type),
            quantity=t.quantity,
            project_name=project_name,
            counterparty=counterparty,
            amount=t.amount_cents / 100.0 if t.amount_cents else None,
            date=t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            status=t.status.value if hasattr(t.status, 'value') else str(t.status)
        ))
    
    return result

@router.get("/stats")
def get_wallet_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get wallet statistics from database"""
    
    holdings = db.query(HoldingModel).filter(HoldingModel.user_id == current_user.id).all()
    
    total_credits = sum(h.quantity for h in holdings)
    available_credits = sum(h.available for h in holdings)
    locked_credits = sum(h.locked for h in holdings)
    total_value = sum(h.quantity * (h.unit_price / 100.0) for h in holdings)
    
    # Count sales revenue this month
    from datetime import datetime
    current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    sales = db.query(TransactionModel)\
        .filter(
            TransactionModel.user_id == current_user.id,
            TransactionModel.type == TransactionType.SALE,
            TransactionModel.status == TransactionStatus.COMPLETED,
            TransactionModel.created_at >= current_month_start
        ).all()
    
    monthly_revenue = sum(t.amount_cents / 100.0 for t in sales if t.amount_cents)
    
    return {
        "portfolio_value": total_value,
        "portfolio_change": 12.5,  # Would need historical data
        "available_credits": available_credits,
        "locked_credits": locked_credits,
        "monthly_revenue": monthly_revenue,
        "total_credits": total_credits
    }
