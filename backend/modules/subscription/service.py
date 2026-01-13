"""
Subscription Module Service
Business logic for subscription management and feature access control
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.models import User, UserRole
from .models import Subscription, SubscriptionTier, TierFeature, FeatureKeys
from .schemas import (
    SubscriptionAssign, SubscriptionUpdate, SubscriptionResponse,
    TierFeatureResponse, FeatureCheckResponse, TierDefinition,
    UserSubscriptionSummary, SubscriptionListResponse,
    SubscriptionTierEnum, TIER_NAMES, TIER_DESCRIPTIONS,
    TierFeatureCreate, TierFeatureUpdate
)


class SubscriptionService:
    """Service for subscription and feature access management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============ Subscription Management ============
    
    def get_user_subscription(self, user_id: int) -> Optional[Subscription]:
        """Get user's subscription, create default if not exists"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            # Create default FREE_ANALYSIS subscription
            subscription = Subscription(
                user_id=user_id,
                tier=SubscriptionTier.FREE_ANALYSIS,
                custom_limits={},
                addons=[]
            )
            self.db.add(subscription)
            self.db.commit()
            self.db.refresh(subscription)
        
        return subscription
    
    def get_subscription_response(self, subscription: Subscription) -> SubscriptionResponse:
        """Convert subscription to response schema"""
        return SubscriptionResponse(
            id=subscription.id,
            user_id=subscription.user_id,
            tier=SubscriptionTierEnum(subscription.tier.value),
            tier_name=TIER_NAMES.get(SubscriptionTierEnum(subscription.tier.value), subscription.tier.value),
            custom_limits=subscription.custom_limits or {},
            addons=subscription.addons or [],
            billing_cycle=subscription.billing_cycle,
            valid_until=subscription.valid_until,
            assigned_by=subscription.assigned_by,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at
        )
    
    def assign_subscription(
        self, 
        user_id: int, 
        data: SubscriptionAssign,
        assigned_by: int
    ) -> Subscription:
        """Assign or update user subscription"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        if subscription:
            # Update existing
            subscription.tier = SubscriptionTier(data.tier.value)
            if data.custom_limits is not None:
                subscription.custom_limits = data.custom_limits
            if data.addons is not None:
                subscription.addons = data.addons
            if data.billing_cycle is not None:
                subscription.billing_cycle = data.billing_cycle
            if data.valid_until is not None:
                subscription.valid_until = data.valid_until
            subscription.assigned_by = assigned_by
            subscription.updated_at = datetime.utcnow()
        else:
            # Create new
            subscription = Subscription(
                user_id=user_id,
                tier=SubscriptionTier(data.tier.value),
                custom_limits=data.custom_limits or {},
                addons=data.addons or [],
                billing_cycle=data.billing_cycle,
                valid_until=data.valid_until,
                assigned_by=assigned_by
            )
            self.db.add(subscription)
        
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def get_all_subscriptions(
        self, 
        page: int = 1, 
        page_size: int = 20,
        tier_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> SubscriptionListResponse:
        """Get paginated list of all subscriptions"""
        query = self.db.query(Subscription, User).join(
            User, Subscription.user_id == User.id
        )
        
        if tier_filter:
            query = query.filter(Subscription.tier == SubscriptionTier(tier_filter))
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(User.email.ilike(search_term))
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        results = query.order_by(Subscription.updated_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        items = []
        for subscription, user in results:
            profile = user.profile_data or {}
            items.append(UserSubscriptionSummary(
                user_id=user.id,
                user_email=user.email,
                user_name=profile.get("name"),
                role=user.role.value,
                tier=SubscriptionTierEnum(subscription.tier.value),
                tier_name=TIER_NAMES.get(SubscriptionTierEnum(subscription.tier.value), subscription.tier.value),
                valid_until=subscription.valid_until,
                created_at=subscription.created_at
            ))
        
        return SubscriptionListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    # ============ Feature Access Control ============
    
    def check_feature_access(self, user_id: int, feature_key: str) -> FeatureCheckResponse:
        """Check if user has access to a specific feature"""
        subscription = self.get_user_subscription(user_id)
        tier_enum = SubscriptionTierEnum(subscription.tier.value)
        
        # FULL_ACCESS tier bypasses all feature checks
        if subscription.tier == SubscriptionTier.FULL_ACCESS:
            return FeatureCheckResponse(
                feature_key=feature_key,
                has_access=True,
                tier=tier_enum,
                limits=None,
                message="Full access tier - all features enabled"
            )
        
        # Check if feature is included in user's tier
        feature = self.db.query(TierFeature).filter(
            TierFeature.tier == subscription.tier,
            TierFeature.feature_key == feature_key,
            TierFeature.is_included == True
        ).first()
        
        if feature:
            return FeatureCheckResponse(
                feature_key=feature_key,
                has_access=True,
                tier=tier_enum,
                limits=feature.limits or {},
                message=None
            )
        
        # Check if it's in addons
        if feature_key in (subscription.addons or []):
            return FeatureCheckResponse(
                feature_key=feature_key,
                has_access=True,
                tier=tier_enum,
                limits=subscription.custom_limits.get(feature_key, {}),
                message="Enabled via add-on"
            )
        
        return FeatureCheckResponse(
            feature_key=feature_key,
            has_access=False,
            tier=tier_enum,
            limits=None,
            message=f"Feature not included in {TIER_NAMES.get(tier_enum, tier_enum.value)} tier"
        )
    
    def has_feature_access(self, user_id: int, feature_key: str) -> bool:
        """Simple boolean check for feature access"""
        result = self.check_feature_access(user_id, feature_key)
        return result.has_access
    
    def get_user_features(self, user_id: int) -> List[TierFeatureResponse]:
        """Get all features available to user"""
        subscription = self.get_user_subscription(user_id)
        
        # FULL_ACCESS gets all features
        if subscription.tier == SubscriptionTier.FULL_ACCESS:
            features = self.db.query(TierFeature).filter(
                TierFeature.is_included == True
            ).distinct(TierFeature.feature_key).all()
        else:
            features = self.db.query(TierFeature).filter(
                TierFeature.tier == subscription.tier,
                TierFeature.is_included == True
            ).all()
        
        return [
            TierFeatureResponse(
                id=f.id,
                tier=SubscriptionTierEnum(f.tier.value),
                feature_key=f.feature_key,
                feature_name=f.feature_name,
                feature_description=f.feature_description,
                is_included=f.is_included,
                limits=f.limits or {}
            )
            for f in features
        ]
    
    # ============ Tier Feature Configuration ============
    
    def get_tier_features(self, tier: SubscriptionTier) -> List[TierFeature]:
        """Get all features for a tier"""
        return self.db.query(TierFeature).filter(
            TierFeature.tier == tier
        ).order_by(TierFeature.feature_key).all()
    
    def get_tier_definition(self, tier: SubscriptionTier) -> TierDefinition:
        """Get complete tier definition with features"""
        features = self.get_tier_features(tier)
        tier_enum = SubscriptionTierEnum(tier.value)
        
        return TierDefinition(
            tier=tier_enum,
            tier_name=TIER_NAMES.get(tier_enum, tier.value),
            tier_description=TIER_DESCRIPTIONS.get(tier_enum, ""),
            features=[
                TierFeatureResponse(
                    id=f.id,
                    tier=tier_enum,
                    feature_key=f.feature_key,
                    feature_name=f.feature_name,
                    feature_description=f.feature_description,
                    is_included=f.is_included,
                    limits=f.limits or {}
                )
                for f in features
            ],
            feature_count=len([f for f in features if f.is_included])
        )
    
    def get_all_tier_definitions(self) -> List[TierDefinition]:
        """Get all tier definitions"""
        return [
            self.get_tier_definition(SubscriptionTier(tier.value))
            for tier in SubscriptionTierEnum
        ]
    
    def create_tier_feature(self, data: TierFeatureCreate) -> TierFeature:
        """Create a new tier feature"""
        feature = TierFeature(
            tier=SubscriptionTier(data.tier.value),
            feature_key=data.feature_key,
            feature_name=data.feature_name,
            feature_description=data.feature_description,
            is_included=data.is_included,
            limits=data.limits or {}
        )
        self.db.add(feature)
        self.db.commit()
        self.db.refresh(feature)
        return feature
    
    def update_tier_feature(self, feature_id: int, data: TierFeatureUpdate) -> Optional[TierFeature]:
        """Update a tier feature"""
        feature = self.db.query(TierFeature).filter(TierFeature.id == feature_id).first()
        if not feature:
            return None
        
        if data.feature_name is not None:
            feature.feature_name = data.feature_name
        if data.feature_description is not None:
            feature.feature_description = data.feature_description
        if data.is_included is not None:
            feature.is_included = data.is_included
        if data.limits is not None:
            feature.limits = data.limits
        
        feature.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(feature)
        return feature
    
    def delete_tier_feature(self, feature_id: int) -> bool:
        """Delete a tier feature"""
        feature = self.db.query(TierFeature).filter(TierFeature.id == feature_id).first()
        if not feature:
            return False
        
        self.db.delete(feature)
        self.db.commit()
        return True
