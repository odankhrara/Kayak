"""Concierge agent - chat-facing agent that composes bundles"""
from sqlmodel import Session
from typing import List, Dict, Any, Optional
from app.models import FlightDeal, HotelDeal, Bundle
from app.services.deal_selector import DealSelector
from app.schemas import BundleCreate, BundleSearchParams


class ConciergeAgent:
    """AI concierge agent for creating personalized bundles"""
    
    def __init__(self, session: Session):
        self.session = session
        self.deal_selector = DealSelector(session)
    
    def create_bundle(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Bundle:
        """Create a personalized bundle based on user preferences"""
        # Get best deals
        flights = []
        hotels = []
        
        if origin and destination:
            flights = self.deal_selector.get_best_flight_deals(
                origin=origin,
                destination=destination,
                max_price=max_price * 0.4 if max_price else None,  # 40% of budget for flights
                limit=3
            )
        
        if city or destination:
            search_city = city or destination
            hotels = self.deal_selector.get_best_hotel_deals(
                city=search_city,
                max_price=max_price * 0.5 if max_price else None,  # 50% of budget for hotels
                limit=3
            )
        
        # Calculate bundle price and savings
        if not flights and not hotels:
            raise ValueError("No deals found matching criteria")
        
        flight_price = sum(f.discounted_price for f in flights) if flights else 0
        hotel_price = sum(h.discounted_price_per_night * 3 for h in hotels) if hotels else 0  # 3 nights
        total_price = flight_price + hotel_price
        
        # Calculate savings (sum of discounts)
        flight_savings = sum(f.original_price - f.discounted_price for f in flights)
        hotel_savings = sum((h.original_price_per_night - h.discounted_price_per_night) * 3 for h in hotels)
        total_savings = flight_savings + hotel_savings
        
        # Create bundle
        bundle = Bundle(
            name=f"Bundle: {origin or 'Any'} → {destination or city or 'Any'}",
            description=f"Curated bundle with {len(flights)} flight(s) and {len(hotels)} hotel(s)",
            total_price=total_price,
            savings=total_savings,
            flight_deal_ids=",".join(str(f.id) for f in flights),
            hotel_deal_ids=",".join(str(h.id) for h in hotels),
            tags=self._generate_tags(flights, hotels, preferences)
        )
        
        self.session.add(bundle)
        self.session.commit()
        self.session.refresh(bundle)
        
        return bundle
    
    def _generate_tags(
        self,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        preferences: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate tags for bundle based on deals and preferences"""
        tags = set()
        
        # Extract tags from deals
        for flight in flights:
            if flight.tags:
                tags.update(tag.strip() for tag in flight.tags.split(",") if tag.strip())
        
        for hotel in hotels:
            if hotel.tags:
                tags.update(tag.strip() for tag in hotel.tags.split(",") if tag.strip())
        
        # Add preference-based tags
        if preferences:
            if preferences.get("pet_friendly"):
                tags.add("pet-friendly")
            if preferences.get("near_transit"):
                tags.add("near-transit")
            if preferences.get("luxury"):
                tags.add("luxury")
        
        return ",".join(sorted(tags))
    
    def recommend_bundles(self, params: BundleSearchParams, limit: int = 5) -> List[Bundle]:
        """Recommend existing bundles or create new ones"""
        # First try to find existing bundles
        existing = self.deal_selector.get_best_bundles(params, limit=limit)
        
        if len(existing) >= limit:
            return existing
        
        # If not enough, create a new one
        try:
            new_bundle = self.create_bundle(
                origin=params.origin,
                destination=params.destination,
                city=params.city,
                max_price=params.max_price
            )
            existing.append(new_bundle)
        except ValueError:
            pass  # Couldn't create bundle
        
        return existing[:limit]

