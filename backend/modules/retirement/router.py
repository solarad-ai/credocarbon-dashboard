"""
Retirement API Module
Database-backed retirement endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

from backend.core.database import get_db
from backend.core.models import (
    User, Project, Retirement as RetirementModel, RetirementStatus,
    CreditHolding, Transaction, TransactionType, TransactionStatus
)
from backend.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/retirements", tags=["retirements"])

# ============ Schemas ============

class RetirementResponse(BaseModel):
    id: int
    certificate_id: Optional[str]
    project_name: str
    project_code: str
    registry: str
    vintage: int
    quantity: int
    retirement_date: Optional[str]
    beneficiary: str
    beneficiary_address: Optional[str]
    purpose: Optional[str]
    status: str
    serial_range: Optional[str]

class RetirementRequest(BaseModel):
    holding_id: int
    quantity: int
    beneficiary: str
    beneficiary_address: str
    purpose: str

class RetirementSummary(BaseModel):
    total_retired: int
    total_co2_offset: int
    certificates_issued: int
    pending_retirements: int

# ============ Endpoints ============

@router.get("/", response_model=List[RetirementResponse])
def get_retirements(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all retirements for current user from database"""
    
    query = db.query(RetirementModel).filter(RetirementModel.user_id == current_user.id)
    
    if status and status != "all":
        query = query.filter(RetirementModel.status == RetirementStatus(status))
    
    retirements = query.order_by(RetirementModel.created_at.desc()).all()
    
    result = []
    for r in retirements:
        project = db.query(Project).filter(Project.id == r.project_id).first()
        project_name = project.name if project else f"Project {r.project_id}"
        project_code = project.code if project else f"P-{r.project_id}"
        
        registry = "VCS"
        if project and project.wizard_data:
            registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
        
        result.append(RetirementResponse(
            id=r.id,
            certificate_id=r.certificate_id,
            project_name=project_name,
            project_code=project_code,
            registry=registry,
            vintage=r.vintage,
            quantity=r.quantity,
            retirement_date=r.retirement_date.strftime("%Y-%m-%d") if r.retirement_date else None,
            beneficiary=r.beneficiary,
            beneficiary_address=r.beneficiary_address,
            purpose=r.purpose,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status),
            serial_range=r.serial_range
        ))
    
    return result

@router.get("/summary", response_model=RetirementSummary)
def get_retirement_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get retirement summary statistics from database"""
    
    retirements = db.query(RetirementModel).filter(RetirementModel.user_id == current_user.id).all()
    
    completed = [r for r in retirements if r.status == RetirementStatus.COMPLETED]
    pending = [r for r in retirements if r.status == RetirementStatus.PENDING]
    
    return RetirementSummary(
        total_retired=sum(r.quantity for r in completed),
        total_co2_offset=sum(r.quantity for r in completed),
        certificates_issued=len([r for r in completed if r.certificate_id]),
        pending_retirements=len(pending)
    )

@router.get("/{retirement_id}", response_model=RetirementResponse)
def get_retirement(retirement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific retirement from database"""
    
    retirement = db.query(RetirementModel)\
        .filter(RetirementModel.id == retirement_id, RetirementModel.user_id == current_user.id)\
        .first()
    
    if not retirement:
        raise HTTPException(status_code=404, detail="Retirement not found")
    
    project = db.query(Project).filter(Project.id == retirement.project_id).first()
    project_name = project.name if project else f"Project {retirement.project_id}"
    project_code = project.code if project else f"P-{retirement.project_id}"
    
    registry = "VCS"
    if project and project.wizard_data:
        registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
    
    return RetirementResponse(
        id=retirement.id,
        certificate_id=retirement.certificate_id,
        project_name=project_name,
        project_code=project_code,
        registry=registry,
        vintage=retirement.vintage,
        quantity=retirement.quantity,
        retirement_date=retirement.retirement_date.strftime("%Y-%m-%d") if retirement.retirement_date else None,
        beneficiary=retirement.beneficiary,
        beneficiary_address=retirement.beneficiary_address,
        purpose=retirement.purpose,
        status=retirement.status.value,
        serial_range=retirement.serial_range
    )

@router.post("/")
def create_retirement(request: RetirementRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new retirement request"""
    
    # Get the holding
    holding = db.query(CreditHolding).filter(
        CreditHolding.id == request.holding_id,
        CreditHolding.user_id == current_user.id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    if holding.available < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient available credits")
    
    # Create retirement record
    retirement = RetirementModel(
        user_id=current_user.id,
        holding_id=holding.id,
        project_id=holding.project_id,
        quantity=request.quantity,
        vintage=holding.vintage,
        beneficiary=request.beneficiary,
        beneficiary_address=request.beneficiary_address,
        purpose=request.purpose,
        serial_range=f"{holding.serial_start[:15]}-{random.randint(10000,99999)} to {holding.serial_end[:15]}-{random.randint(10000,99999)}",
        status=RetirementStatus.PENDING
    )
    db.add(retirement)
    
    # Reduce available credits
    holding.available -= request.quantity
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        type=TransactionType.RETIREMENT,
        status=TransactionStatus.PENDING,
        quantity=request.quantity,
        project_id=holding.project_id,
        notes=request.purpose
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(retirement)
    
    return {"success": True, "retirement_id": retirement.id, "status": "PENDING"}

@router.get("/{retirement_id}/certificate")
def get_certificate(retirement_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get certificate data for download"""
    
    retirement = db.query(RetirementModel)\
        .filter(RetirementModel.id == retirement_id, 
                RetirementModel.user_id == current_user.id,
                RetirementModel.status == RetirementStatus.COMPLETED)\
        .first()
    
    if not retirement:
        raise HTTPException(status_code=404, detail="Certificate not found or retirement not completed")
    
    project = db.query(Project).filter(Project.id == retirement.project_id).first()
    
    registry = "VCS"
    if project and project.wizard_data:
        registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
    
    return {
        "certificate_id": retirement.certificate_id,
        "beneficiary": retirement.beneficiary,
        "quantity": retirement.quantity,
        "project_name": project.name if project else "Unknown",
        "vintage": retirement.vintage,
        "retirement_date": retirement.retirement_date.strftime("%Y-%m-%d") if retirement.retirement_date else "",
        "registry": registry
    }
