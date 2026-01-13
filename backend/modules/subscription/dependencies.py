"""
Subscription Module Dependencies
FastAPI dependencies for route-level feature gating
"""
from typing import Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import User
from backend.modules.auth.dependencies import get_current_user
from .service import SubscriptionService


def require_feature(feature_key: str) -> Callable:
    """
    Dependency factory for requiring a specific feature.
    Use in route decorators to gate access based on subscription tier.
    
    Example:
        @router.get("/generate-pdd", dependencies=[Depends(require_feature("dev.pdd_structuring"))])
        async def generate_pdd():
            ...
    """
    async def feature_dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        service = SubscriptionService(db)
        result = service.check_feature_access(current_user.id, feature_key)
        
        if not result.has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "feature_key": feature_key,
                    "current_tier": result.tier.value,
                    "message": result.message or f"Your subscription does not include access to this feature. Please upgrade to access {feature_key}."
                }
            )
        
        return result
    
    return feature_dependency


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    """Dependency to get subscription service instance"""
    return SubscriptionService(db)
