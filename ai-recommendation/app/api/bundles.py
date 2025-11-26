"""Bundle API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List, Optional
from app.db.session import get_session
from app.services.concierge_agent import ConciergeAgent
from app.services.deal_selector import DealSelector
from app.schemas import (
    BundleResponse,
    BundleCreate,
    BundleSearchParams,
    FlightDealResponse,
    HotelDealResponse,
)
from app.models import Bundle, FlightDeal, HotelDeal

router = APIRouter(prefix="/bundles", tags=["bundles"])


@router.get("", response_model=List[BundleResponse])
async def get_bundles(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    tags: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    session: Session = Depends(get_session)
):
    """Get bundles matching search criteria"""
    params = BundleSearchParams(
        origin=origin,
        destination=destination,
        city=city,
        max_price=max_price,
        tags=tags.split(",") if tags else None
    )
    
    concierge = ConciergeAgent(session)
    bundles = concierge.recommend_bundles(params, limit=limit)
    
    # Convert to response format
    result = []
    for bundle in bundles:
        # Parse deal IDs
        flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id.strip()]
        hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id.strip()]
        
        # Fetch deals
        flights = []
        for fid in flight_ids:
            flight = session.get(FlightDeal, fid)
            if flight:
                flights.append(FlightDealResponse.model_validate(flight))
        
        hotels = []
        for hid in hotel_ids:
            hotel = session.get(HotelDeal, hid)
            if hotel:
                hotels.append(HotelDealResponse.model_validate(hotel))
        
        bundle_response = BundleResponse(
            id=bundle.id,
            name=bundle.name,
            description=bundle.description,
            total_price=bundle.total_price,
            savings=bundle.savings,
            tags=[tag.strip() for tag in bundle.tags.split(",") if tag.strip()],
            flights=flights,
            hotels=hotels,
            cars=[],  # Car deals not yet implemented
            created_at=bundle.created_at
        )
        result.append(bundle_response)
    
    return result


@router.get("/{bundle_id}", response_model=BundleResponse)
async def get_bundle(
    bundle_id: int,
    session: Session = Depends(get_session)
):
    """Get bundle by ID"""
    bundle = session.get(Bundle, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    # Parse and fetch deals
    flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id.strip()]
    hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id.strip()]
    
    flights = [FlightDealResponse.model_validate(session.get(FlightDeal, fid))
               for fid in flight_ids if session.get(FlightDeal, fid)]
    hotels = [HotelDealResponse.model_validate(session.get(HotelDeal, hid))
              for hid in hotel_ids if session.get(HotelDeal, hid)]
    
    return BundleResponse(
        id=bundle.id,
        name=bundle.name,
        description=bundle.description,
        total_price=bundle.total_price,
        savings=bundle.savings,
        tags=[tag.strip() for tag in bundle.tags.split(",") if tag.strip()],
        flights=flights,
        hotels=hotels,
        cars=[],
        created_at=bundle.created_at
    )


@router.post("", response_model=BundleResponse)
async def create_bundle(
    bundle_data: BundleCreate,
    session: Session = Depends(get_session)
):
    """Create a new bundle"""
    concierge = ConciergeAgent(session)
    
    # Fetch deals
    flights = [session.get(FlightDeal, fid) for fid in bundle_data.flight_deal_ids]
    hotels = [session.get(HotelDeal, hid) for hid in bundle_data.hotel_deal_ids]
    
    # Calculate totals
    total_price = (
        sum(f.discounted_price for f in flights if f) +
        sum(h.discounted_price_per_night * 3 for h in hotels if h)
    )
    savings = (
        sum(f.original_price - f.discounted_price for f in flights if f) +
        sum((h.original_price_per_night - h.discounted_price_per_night) * 3 for h in hotels if h)
    )
    
    bundle = Bundle(
        name=bundle_data.name,
        description=bundle_data.description,
        total_price=total_price,
        savings=savings,
        flight_deal_ids=",".join(str(fid) for fid in bundle_data.flight_deal_ids),
        hotel_deal_ids=",".join(str(hid) for hid in bundle_data.hotel_deal_ids),
        car_deal_ids=",".join(str(cid) for cid in bundle_data.car_deal_ids)
    )
    
    session.add(bundle)
    session.commit()
    session.refresh(bundle)
    
    return BundleResponse.model_validate(bundle)

