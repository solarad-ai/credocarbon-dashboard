"""
Marketplace API Module
Database-backed listings and offers
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from backend.core.database import get_db
from backend.core.models import (
    User, Project, CreditHolding,
    MarketListing as ListingModel, ListingStatus,
    Offer as OfferModel, OfferStatus,
    Transaction, TransactionType, TransactionStatus
)
from backend.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# ============ Schemas ============

class ListingResponse(BaseModel):
    id: int
    project_name: str
    project_type: str
    registry: str
    vintage: int
    quantity_available: int
    price_per_ton: float
    min_quantity: int
    seller_name: str
    seller_id: int
    location: str
    is_favorite: bool = False

class OfferResponse(BaseModel):
    id: int
    listing_id: int
    project_name: str
    seller: str
    quantity: int
    price_per_ton: float
    total_value: float
    vintage: int
    registry: str
    status: str
    date: str
    expires_in: Optional[str] = None
    counter_price: Optional[float] = None

class CreateOfferRequest(BaseModel):
    listing_id: int
    quantity: int
    price_per_ton: float
    message: Optional[str] = None

class CreateListingRequest(BaseModel):
    holding_id: int
    quantity: int
    price_per_ton: float
    min_quantity: int = 1

# ============ Endpoints ============

@router.get("/listings", response_model=List[ListingResponse])
def get_listings(
    project_type: Optional[str] = None,
    registry: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get marketplace listings from database"""
    
    query = db.query(ListingModel).filter(ListingModel.status == ListingStatus.ACTIVE)
    
    listings = query.order_by(ListingModel.created_at.desc()).all()
    
    result = []
    for listing in listings:
        project = db.query(Project).filter(Project.id == listing.project_id).first()
        seller = db.query(User).filter(User.id == listing.seller_id).first()
        
        project_name = project.name if project else f"Project {listing.project_id}"
        project_type_val = project.project_type if project else "unknown"
        
        registry_val = "VCS"
        location = "India"
        if project and project.wizard_data:
            registry_val = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
            location = project.wizard_data.get("basic_info", {}).get("location", "India")
        
        seller_name = "Unknown Seller"
        if seller and seller.profile_data:
            seller_name = seller.profile_data.get("company") or seller.profile_data.get("name") or seller.email
        
        price_per_ton = listing.price_per_ton_cents / 100.0
        
        # Apply filters
        if project_type and project_type != "all" and project_type_val.lower() != project_type.lower():
            continue
        if registry and registry != "all" and registry_val.lower() != registry.lower():
            continue
        if min_price is not None and price_per_ton < min_price:
            continue
        if max_price is not None and price_per_ton > max_price:
            continue
        
        result.append(ListingResponse(
            id=listing.id,
            project_name=project_name,
            project_type=project_type_val,
            registry=registry_val,
            vintage=listing.vintage,
            quantity_available=listing.quantity - listing.quantity_sold,
            price_per_ton=price_per_ton,
            min_quantity=listing.min_quantity,
            seller_name=seller_name,
            seller_id=listing.seller_id,
            location=location
        ))
    
    return result

@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific listing"""
    
    listing = db.query(ListingModel).filter(ListingModel.id == listing_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
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
    
    return ListingResponse(
        id=listing.id,
        project_name=project_name,
        project_type=project_type,
        registry=registry,
        vintage=listing.vintage,
        quantity_available=listing.quantity - listing.quantity_sold,
        price_per_ton=listing.price_per_ton_cents / 100.0,
        min_quantity=listing.min_quantity,
        seller_name=seller_name,
        seller_id=listing.seller_id,
        location=location
    )

@router.post("/listings")
def create_listing(request: CreateListingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new listing"""
    
    holding = db.query(CreditHolding).filter(
        CreditHolding.id == request.holding_id,
        CreditHolding.user_id == current_user.id
    ).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    if holding.available < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient available credits")
    
    listing = ListingModel(
        seller_id=current_user.id,
        project_id=holding.project_id,
        holding_id=holding.id,
        vintage=holding.vintage,
        quantity=request.quantity,
        price_per_ton_cents=int(request.price_per_ton * 100),
        min_quantity=request.min_quantity,
        status=ListingStatus.ACTIVE,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(listing)
    
    # Lock credits
    holding.available -= request.quantity
    holding.locked += request.quantity
    
    db.commit()
    db.refresh(listing)
    
    return {"success": True, "listing_id": listing.id}

@router.get("/offers", response_model=List[OfferResponse])
def get_offers(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's offers from database"""
    
    query = db.query(OfferModel).filter(OfferModel.buyer_id == current_user.id)
    
    if status and status != "all":
        if status == "active":
            query = query.filter(OfferModel.status.in_([OfferStatus.PENDING, OfferStatus.COUNTER]))
        elif status == "completed":
            query = query.filter(OfferModel.status.in_([OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.EXPIRED]))
        else:
            query = query.filter(OfferModel.status == OfferStatus(status))
    
    offers = query.order_by(OfferModel.created_at.desc()).all()
    
    result = []
    for offer in offers:
        listing = db.query(ListingModel).filter(ListingModel.id == offer.listing_id).first()
        project = db.query(Project).filter(Project.id == listing.project_id).first() if listing else None
        seller = db.query(User).filter(User.id == listing.seller_id).first() if listing else None
        
        project_name = project.name if project else "Unknown Project"
        seller_name = seller.profile_data.get("company", seller.email) if seller and seller.profile_data else "Unknown"
        
        registry = "VCS"
        if project and project.wizard_data:
            registry = project.wizard_data.get("credit_estimation", {}).get("registry", "VCS")
        
        expires_in = None
        if offer.expires_at:
            delta = offer.expires_at - datetime.utcnow()
            if delta.days > 0:
                expires_in = f"{delta.days} days"
            elif delta.seconds > 3600:
                expires_in = f"{delta.seconds // 3600} hours"
        
        result.append(OfferResponse(
            id=offer.id,
            listing_id=offer.listing_id,
            project_name=project_name,
            seller=seller_name,
            quantity=offer.quantity,
            price_per_ton=offer.price_per_ton_cents / 100.0,
            total_value=offer.quantity * (offer.price_per_ton_cents / 100.0),
            vintage=listing.vintage if listing else 2024,
            registry=registry,
            status=offer.status.value,
            date=offer.created_at.strftime("%Y-%m-%d") if offer.created_at else "",
            expires_in=expires_in,
            counter_price=offer.counter_price_cents / 100.0 if offer.counter_price_cents else None
        ))
    
    return result

@router.post("/offers")
def create_offer(offer: CreateOfferRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new offer on a listing"""
    
    listing = db.query(ListingModel).filter(
        ListingModel.id == offer.listing_id,
        ListingModel.status == ListingStatus.ACTIVE
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or no longer active")
    
    if offer.quantity < listing.min_quantity:
        raise HTTPException(status_code=400, detail=f"Minimum quantity is {listing.min_quantity}")
    
    if offer.quantity > (listing.quantity - listing.quantity_sold):
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available")
    
    new_offer = OfferModel(
        listing_id=listing.id,
        buyer_id=current_user.id,
        quantity=offer.quantity,
        price_per_ton_cents=int(offer.price_per_ton * 100),
        status=OfferStatus.PENDING,
        message=offer.message,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    
    return {"success": True, "offer_id": new_offer.id}

@router.put("/offers/{offer_id}/accept")
def accept_offer(offer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Accept an offer (seller action)"""
    
    offer = db.query(OfferModel).filter(OfferModel.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    listing = db.query(ListingModel).filter(ListingModel.id == offer.listing_id).first()
    if not listing or listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    offer.status = OfferStatus.ACCEPTED
    offer.responded_at = datetime.utcnow()
    
    # Update listing
    listing.quantity_sold += offer.quantity
    if listing.quantity_sold >= listing.quantity:
        listing.status = ListingStatus.SOLD
    
    db.commit()
    
    return {"success": True}

@router.put("/offers/{offer_id}/reject")
def reject_offer(offer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reject an offer"""
    
    offer = db.query(OfferModel).filter(OfferModel.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    listing = db.query(ListingModel).filter(ListingModel.id == offer.listing_id).first()
    if not listing or listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    offer.status = OfferStatus.REJECTED
    offer.responded_at = datetime.utcnow()
    db.commit()
    
    return {"success": True}

@router.get("/stats")
def get_marketplace_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get marketplace statistics from database"""
    
    active_listings = db.query(ListingModel).filter(ListingModel.status == ListingStatus.ACTIVE).all()
    
    total_volume = sum(l.quantity - l.quantity_sold for l in active_listings)
    
    # Calculate average prices
    vcs_listings = [l for l in active_listings if l.project and l.project.wizard_data and 
                   l.project.wizard_data.get("credit_estimation", {}).get("registry") == "VCS"]
    gs_listings = [l for l in active_listings if l.project and l.project.wizard_data and 
                  l.project.wizard_data.get("credit_estimation", {}).get("registry") == "Gold Standard"]
    
    avg_vcs = sum(l.price_per_ton_cents for l in vcs_listings) / len(vcs_listings) / 100 if vcs_listings else 8.50
    avg_gs = sum(l.price_per_ton_cents for l in gs_listings) / len(gs_listings) / 100 if gs_listings else 12.00
    
    return {
        "total_listings": len(active_listings),
        "total_volume": total_volume,
        "avg_vcs_price": avg_vcs,
        "avg_gs_price": avg_gs,
        "price_change_24h": 5.2,
        "volume_24h": total_volume
    }
