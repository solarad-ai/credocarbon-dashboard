from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from backend.core.models import AuditLog
from backend.modules.auth.dependencies import get_current_user 
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int]
    action: str
    entity_type: str
    entity_id: str
    details: Optional[Any]
    timestamp: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # TODO: Add RBAC check (Admin only or own logs?)
    return db.query(AuditLog).offset(skip).limit(limit).all()
