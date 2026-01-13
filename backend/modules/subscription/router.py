"""
Subscription Module Router
API endpoints for subscription management
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import User, UserRole
from backend.modules.auth.dependencies import get_current_user
from .service import SubscriptionService
from .models import SubscriptionTier
from .schemas import (
    SubscriptionResponse, SubscriptionAssign, SubscriptionUpdate,
    TierFeatureResponse, FeatureCheckRequest, FeatureCheckResponse,
    TierDefinition, SubscriptionListResponse, SubscriptionTierEnum,
    TierFeatureCreate, TierFeatureUpdate
)
from .dependencies import get_subscription_service

router = APIRouter(prefix="/subscription", tags=["Subscription"])


# ============ User-facing endpoints ============

@router.get("/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get current user's subscription details"""
    subscription = service.get_user_subscription(current_user.id)
    return service.get_subscription_response(subscription)


@router.get("/features", response_model=List[TierFeatureResponse])
async def get_my_features(
    current_user: User = Depends(get_current_user),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get all features available for current user's tier"""
    return service.get_user_features(current_user.id)


@router.post("/check", response_model=FeatureCheckResponse)
async def check_feature_access(
    request: FeatureCheckRequest,
    current_user: User = Depends(get_current_user),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Check if current user has access to a specific feature"""
    return service.check_feature_access(current_user.id, request.feature_key)


@router.get("/tiers", response_model=List[TierDefinition])
async def get_all_tiers(
    current_user: User = Depends(get_current_user),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get all tier definitions with their features"""
    return service.get_all_tier_definitions()


@router.get("/tiers/{tier}", response_model=TierDefinition)
async def get_tier_details(
    tier: SubscriptionTierEnum,
    current_user: User = Depends(get_current_user),
    service: SubscriptionService = Depends(get_subscription_service)
):
    """Get details for a specific tier"""
    return service.get_tier_definition(SubscriptionTier(tier.value))
