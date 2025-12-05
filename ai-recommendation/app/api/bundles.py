"""Bundle API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlmodel import Session
from typing import List, Optional, Dict, Any
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
        
        # Compute fit score and generate explanations (lightweight, cached if possible)
        from app.services.bundle_fit_scorer import BundleFitScorer
        from app.services.bundle_summarizer import BundleSummarizer
        
        # Convert Pydantic models back to SQLModel for processing
        flight_models = [session.get(FlightDeal, f.id) for f in flights]
        hotel_models = [session.get(HotelDeal, h.id) for h in hotels]
        flight_models = [f for f in flight_models if f]
        hotel_models = [h for h in hotel_models if h]
        
        fit_scorer = BundleFitScorer(session)
        summarizer = BundleSummarizer(session)
        
        # Get user preferences from query params (if any)
        user_preferences = params.tags if params.tags else None
        
        # Compute fit score (lightweight operation)
        fit_result = fit_scorer.compute_fit_score(
            bundle, flight_models, hotel_models,
            user_budget=params.max_price,
            user_preferences=user_preferences
        )
        
        # Generate summary with explanations (lightweight)
        summary = summarizer.generate_bundle_summary(bundle, flight_models, hotel_models)
        what_to_watch = summarizer.generate_what_to_watch(bundle, flight_models, hotel_models)
        
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
            created_at=bundle.created_at,
            fit_score=fit_result["fit_score"],
            fit_breakdown=fit_result["breakdown"],
            why_this_pick=summary.get("why_this_pick", ""),
            what_to_watch=what_to_watch
        )
        result.append(bundle_response)
    
    return result


@router.get("/{bundle_id}", response_model=BundleResponse)
async def get_bundle(
    bundle_id: int,
    include_fit_score: bool = Query(True, description="Include fit score and explanations"),
    session: Session = Depends(get_session)
):
    """Get bundle by ID with optional fit score and explanations"""
    bundle = session.get(Bundle, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    # Parse and fetch deals - handle None or empty strings
    flight_ids = []
    if bundle.flight_deal_ids:
        flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id.strip()]
    
    hotel_ids = []
    if bundle.hotel_deal_ids:
        hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id.strip()]
    
    # Helper function to convert tags string to list
    def parse_tags(tags_str):
        if not tags_str:
            return []
        if isinstance(tags_str, list):
            return tags_str
        return [tag.strip() for tag in tags_str.split(",") if tag.strip()]
    
    # Fetch and convert flights
    flights = []
    for fid in flight_ids:
        flight = session.get(FlightDeal, fid)
        if flight:
            flight_dict = {
                "id": flight.id,
                "airline": flight.airline,
                "flight_number": flight.flight_number,
                "origin": flight.origin,
                "destination": flight.destination,
                "departure_time": flight.departure_time,
                "arrival_time": flight.arrival_time,
                "original_price": flight.original_price,
                "discounted_price": flight.discounted_price,
                "discount_percentage": flight.discount_percentage,
                "available_seats": flight.available_seats,
                "deal_score": flight.deal_score,
                "tags": parse_tags(flight.tags) if hasattr(flight, 'tags') else []
            }
            flights.append(FlightDealResponse.model_validate(flight_dict))
    
    # Fetch and convert hotels
    hotels = []
    for hid in hotel_ids:
        hotel = session.get(HotelDeal, hid)
        if hotel:
            hotel_dict = {
                "id": hotel.id,
                "name": hotel.name,
                "city": hotel.city,
                "state": hotel.state,
                "country": hotel.country,
                "address": hotel.address,
                "original_price_per_night": hotel.original_price_per_night,
                "discounted_price_per_night": hotel.discounted_price_per_night,
                "discount_percentage": hotel.discount_percentage,
                "available_rooms": hotel.available_rooms,
                "rating": hotel.rating,
                "deal_score": hotel.deal_score,
                "tags": parse_tags(hotel.tags) if hasattr(hotel, 'tags') else []
            }
            hotels.append(HotelDealResponse.model_validate(hotel_dict))
    
    # Handle tags - handle None or empty strings
    tags = []
    if bundle.tags:
        tags = [tag.strip() for tag in bundle.tags.split(",") if tag.strip()]
    
    response = BundleResponse(
        id=bundle.id,
        name=bundle.name,
        description=bundle.description,
        total_price=bundle.total_price,
        savings=bundle.savings,
        tags=tags,
        flights=flights,
        hotels=hotels,
        cars=[],
        created_at=bundle.created_at
    )
    
    # Add fit score and explanations if requested
    if include_fit_score:
        from app.services.bundle_fit_scorer import BundleFitScorer
        from app.services.bundle_summarizer import BundleSummarizer
        
        flight_models = [session.get(FlightDeal, f.id) for f in flights]
        hotel_models = [session.get(HotelDeal, h.id) for h in hotels]
        flight_models = [f for f in flight_models if f]
        hotel_models = [h for h in hotel_models if h]
        
        fit_scorer = BundleFitScorer(session)
        summarizer = BundleSummarizer(session)
        
        fit_result = fit_scorer.compute_fit_score(bundle, flight_models, hotel_models)
        summary = summarizer.generate_bundle_summary(bundle, flight_models, hotel_models)
        what_to_watch = summarizer.generate_what_to_watch(bundle, flight_models, hotel_models)
        
        response.fit_score = fit_result["fit_score"]
        response.fit_breakdown = fit_result["breakdown"]
        response.why_this_pick = summary.get("why_this_pick", "")
        response.what_to_watch = what_to_watch
    
    return response


@router.post("/query", response_model=List[BundleResponse])
async def query_bundles(
    body: Dict[str, Any] = Body(None),
    query: str = Query(None, description="Natural language query (alternative to body)"),
    user_id: int = Query(None, description="User ID"),
    session: Session = Depends(get_session)
):
    """
    Query bundles using natural language
    
    Accepts query as query parameter or in request body:
    - Query param: POST /bundles/query?query=Weekend in Tokyo...
    - Request body: POST /bundles/query with {"query": "Weekend in Tokyo..."}
    
    Example: "Weekend in Tokyo under $900 for two, SFO departure, pet-friendly"
    """
    from app.services.nlu_parser import NLUParser
    from app.services.concierge_agent import ConciergeAgent
    
    # Support both query param and request body
    query_text = query
    if not query_text and body:
        query_text = body.get('query')
    
    if not query_text:
        raise HTTPException(status_code=400, detail="query is required")
    
    # Parse the natural language query
    nlu_parser = NLUParser()
    parsed = nlu_parser.parse(query_text)
    
    # Convert to search params
    search_params = BundleSearchParams(
        origin=parsed.get("origin"),
        destination=parsed.get("destination"),
        city=parsed.get("city"),
        max_price=parsed.get("budget"),
        tags=parsed.get("constraints") if parsed.get("constraints") else None
    )
    
    # Get recommendations
    concierge = ConciergeAgent(session)
    bundles = concierge.recommend_bundles(search_params, limit=5)
    
    # Convert to response format
    result = []
    for bundle in bundles:
        flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id.strip()]
        hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id.strip()]
        
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
        
        # Compute fit score and explanations (lightweight)
        from app.services.bundle_fit_scorer import BundleFitScorer
        from app.services.bundle_summarizer import BundleSummarizer
        
        flight_models = [session.get(FlightDeal, f.id) for f in flights]
        hotel_models = [session.get(HotelDeal, h.id) for h in hotels]
        flight_models = [f for f in flight_models if f]
        hotel_models = [h for h in hotel_models if h]
        
        fit_scorer = BundleFitScorer(session)
        summarizer = BundleSummarizer(session)
        
        user_preferences = body.get("preferences") if body else None
        
        fit_result = fit_scorer.compute_fit_score(
            bundle, flight_models, hotel_models,
            user_budget=search_params.max_price,
            user_preferences=user_preferences
        )
        
        summary = summarizer.generate_bundle_summary(bundle, flight_models, hotel_models)
        what_to_watch = summarizer.generate_what_to_watch(bundle, flight_models, hotel_models)
        
        bundle_response = BundleResponse(
            id=bundle.id,
            name=bundle.name,
            description=bundle.description,
            total_price=bundle.total_price,
            savings=bundle.savings,
            tags=[tag.strip() for tag in bundle.tags.split(",") if tag.strip()],
            flights=flights,
            hotels=hotels,
            cars=[],
            created_at=bundle.created_at,
            fit_score=fit_result["fit_score"],
            fit_breakdown=fit_result["breakdown"],
            why_this_pick=summary.get("why_this_pick", ""),
            what_to_watch=what_to_watch
        )
        result.append(bundle_response)
    
    return result


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

