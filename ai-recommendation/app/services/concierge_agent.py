"""Concierge agent - chat-facing agent that composes bundles"""
from sqlmodel import Session
from typing import List, Dict, Any, Optional, Tuple
from app.models import FlightDeal, HotelDeal, Bundle, Watch
from app.services.deal_selector import DealSelector
from app.schemas import BundleCreate, BundleSearchParams
from datetime import datetime, timedelta


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
        flights = []
        hotels = []
        
        flexible_destinations = ['warm region', 'tropical region', 'anywhere', 'anywhere warm', 'anywhere warm region']
        dest_lower = (destination or "").lower().strip()
        is_flexible = dest_lower in flexible_destinations or "anywhere" in dest_lower or "warm region" in dest_lower
        
        if origin:
            if is_flexible:
                warm_cities = ['Miami', 'Los Angeles', 'San Diego', 'Phoenix', 'Las Vegas', 'Tampa', 'Orlando', 'Honolulu']
                all_flights = []
                for warm_city in warm_cities:
                    city_flights = self.deal_selector.get_best_flight_deals(
                        origin=origin,
                        destination=warm_city,
                        max_price=max_price * 0.4 if max_price else None,
                        limit=2
                    )
                    all_flights.extend(city_flights)
                flights = sorted(all_flights, key=lambda f: f.deal_score, reverse=True)[:3]
            elif destination:
                flights = self.deal_selector.get_best_flight_deals(
                    origin=origin,
                    destination=destination,
                    max_price=max_price * 0.4 if max_price else None,
                    limit=3
                )
            else:
                flights = self.deal_selector.get_best_flight_deals(
                    origin=origin,
                    destination=None,
                    max_price=max_price * 0.4 if max_price else None,
                    limit=5
                )
        
        if city or destination:
            if is_flexible:
                warm_cities = ['Miami', 'Los Angeles', 'San Diego', 'Phoenix', 'Las Vegas', 'Tampa', 'Orlando', 'Honolulu']
                all_hotels = []
                for warm_city in warm_cities:
                    city_hotels = self.deal_selector.get_best_hotel_deals(
                        city=warm_city,
                        max_price=max_price * 0.5 if max_price else None,
                        limit=2
                    )
                    all_hotels.extend(city_hotels)
                hotels = sorted(all_hotels, key=lambda h: h.deal_score, reverse=True)[:3]
            else:
                search_city = city or destination
                hotels = self.deal_selector.get_best_hotel_deals(
                    city=search_city,
                    max_price=max_price * 0.5 if max_price else None,
                    limit=3
                )
        elif is_flexible:
            warm_cities = ['Miami', 'Los Angeles', 'San Diego', 'Phoenix', 'Las Vegas', 'Tampa', 'Orlando', 'Honolulu']
            all_hotels = []
            for warm_city in warm_cities:
                city_hotels = self.deal_selector.get_best_hotel_deals(
                    city=warm_city,
                    max_price=max_price * 0.5 if max_price else None,
                    limit=2
                )
                all_hotels.extend(city_hotels)
            hotels = sorted(all_hotels, key=lambda h: h.deal_score, reverse=True)[:3]
        
        if not flights and not hotels:
            raise ValueError("No deals found matching criteria")
        
        flight_price = sum(f.discounted_price for f in flights) if flights else 0
        hotel_price = sum(h.discounted_price_per_night * 3 for h in hotels) if hotels else 0
        total_price = flight_price + hotel_price
        
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
        """
        Recommend existing bundles or create new ones from cached deals
        
        This method:
        1. First tries to find existing bundles matching criteria
        2. If not enough, creates new bundles from available deals
        3. Always returns bundles if deals are available (even if no exact match)
        """
        # First try to find existing bundles
        existing = self.deal_selector.get_best_bundles(params, limit=limit)
        
        if len(existing) >= limit:
            return existing
        
        # If not enough existing bundles, try to create new ones from available deals
        # Check if we have any deals at all
        from sqlmodel import select, func
        from app.models import FlightDeal, HotelDeal
        
        flight_count = self.session.exec(select(func.count(FlightDeal.id)).where(FlightDeal.is_active == True)).one()
        hotel_count = self.session.exec(select(func.count(HotelDeal.id)).where(HotelDeal.is_active == True)).one()
        
        if flight_count == 0 or hotel_count == 0:
            # No deals available - return empty list
            print(f"[ConciergeAgent] No deals available: {flight_count} flights, {hotel_count} hotels")
            return []
        
        # We have deals, try to create bundles
        bundles_created = []
        max_attempts = 3
        
        for attempt in range(max_attempts):
            try:
                new_bundle = self.create_bundle(
                    origin=params.origin,
                    destination=params.destination,
                    city=params.city,
                    max_price=params.max_price,
                    preferences={"tags": params.tags} if params.tags else None
                )
                bundles_created.append(new_bundle)
                
                # If we have enough bundles, return them
                if len(bundles_created) >= limit:
                    return bundles_created
                    
            except ValueError as e:
                print(f"[ConciergeAgent] Could not create bundle (attempt {attempt + 1}): {e}")
                # If we have some bundles, return what we have
                if bundles_created:
                    return bundles_created
                # Otherwise, try with more relaxed criteria
                if attempt < max_attempts - 1:
                    # Relax constraints for next attempt
                    if params.max_price:
                        params.max_price = params.max_price * 1.2  # Increase budget by 20%
                    continue
        
        # Return any bundles we created, or existing ones
        if bundles_created:
            return bundles_created
        
        # If we still have no bundles, return existing ones (even if fewer than limit)
        return existing
    
    def explain_tradeoffs(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        alternatives: Optional[List[Bundle]] = None
    ) -> str:
        """
        Explain tradeoffs and reasoning for bundle recommendations
        
        This makes the concierge explain WHY it chose certain deals,
        helping users understand the value proposition.
        """
        explanations = []
        
        # Explain price/value tradeoff
        if bundle.savings > 0:
            savings_pct = (bundle.savings / (bundle.total_price + bundle.savings)) * 100
            explanations.append(
                f"💰 **Value**: This bundle saves you ${bundle.savings:.2f} ({savings_pct:.1f}% off) "
                f"compared to booking separately. The total price of ${bundle.total_price:.2f} "
                f"includes both flights and hotels."
            )
        
        # Explain flight choices
        if flights:
            best_flight = max(flights, key=lambda f: f.deal_score)
            explanations.append(
                f"✈️ **Flight Choice**: I selected {best_flight.airline} because it offers "
                f"the best deal score ({best_flight.deal_score:.1f}/100) with "
                f"{best_flight.discount_percentage:.1f}% savings. "
            )
            if best_flight.available_seats < 5:
                explanations[-1] += f"⚠️ Limited seats ({best_flight.available_seats} left) - book soon!"
            else:
                explanations[-1] += f"Good availability ({best_flight.available_seats} seats)."
        
        # Explain hotel choices
        if hotels:
            best_hotel = max(hotels, key=lambda h: h.deal_score)
            explanations.append(
                f"🏨 **Hotel Choice**: {best_hotel.name} in {best_hotel.city} offers "
                f"excellent value with a deal score of {best_hotel.deal_score:.1f}/100. "
            )
            if best_hotel.rating:
                explanations[-1] += f"Rated {best_hotel.rating:.1f}/5. "
            if best_hotel.available_rooms < 3:
                explanations[-1] += f"⚠️ Only {best_hotel.available_rooms} rooms left!"
            else:
                explanations[-1] += f"Good availability ({best_hotel.available_rooms} rooms)."
        
        # Explain tags/features
        if bundle.tags:
            tag_list = bundle.tags.split(",") if bundle.tags else []
            if tag_list:
                explanations.append(
                    f"🏷️ **Features**: This bundle includes: {', '.join(tag_list[:5])}. "
                    f"These tags help match your preferences."
                )
        
        # Compare with alternatives if provided
        if alternatives and len(alternatives) > 1:
            cheapest = min(alternatives, key=lambda b: b.total_price)
            if bundle.id != cheapest.id:
                price_diff = bundle.total_price - cheapest.total_price
                explanations.append(
                    f"⚖️ **Tradeoff**: This bundle is ${price_diff:.2f} more than the cheapest option, "
                    f"but offers better deal scores and features. You're paying for quality and savings."
                )
        
        return "\n\n".join(explanations)
    
    def create_watch_from_request(
        self,
        user_id: int,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        watch_type: str = "flight"
    ) -> Watch:
        """
        Create a price/stock watch from user request
        
        This allows the concierge to proactively set watches when users
        express interest but don't book immediately.
        """
        # Set default dates (next 30 days)
        check_in = datetime.utcnow() + timedelta(days=7)
        check_out = check_in + timedelta(days=3)
        
        watch = Watch(
            user_id=user_id,
            origin=origin,
            destination=destination,
            city=city,
            max_price=max_price,
            check_in=check_in,
            check_out=check_out,
            watch_type=watch_type,
            active=True
        )
        
        self.session.add(watch)
        self.session.commit()
        self.session.refresh(watch)
        
        return watch
    
    def get_bundle_explanation(
        self,
        bundle: Bundle,
        flights: Optional[List[FlightDeal]] = None,
        hotels: Optional[List[HotelDeal]] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive explanation for a bundle including tradeoffs
        
        Returns:
            Dictionary with explanation text and structured reasoning
        """
        # Load flights and hotels if not provided
        if not flights and bundle.flight_deal_ids:
            flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
            flights = [self.session.get(FlightDeal, fid) for fid in flight_ids if fid]
            flights = [f for f in flights if f]  # Remove None values
        
        if not hotels and bundle.hotel_deal_ids:
            hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id]
            hotels = [self.session.get(HotelDeal, hid) for hid in hotel_ids if hid]
            hotels = [h for h in hotels if h]  # Remove None values
        
        explanation_text = self.explain_tradeoffs(bundle, flights or [], hotels or [])
        
        return {
            "bundle_id": bundle.id,
            "explanation": explanation_text,
            "total_price": bundle.total_price,
            "savings": bundle.savings,
            "value_score": (bundle.savings / (bundle.total_price + bundle.savings)) * 100 if bundle.savings > 0 else 0,
            "recommendation_reason": "Best combination of price, deal score, and availability"
        }

