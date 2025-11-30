"""Bundle Summarizer - Generates clear, comparable bundle summaries"""
from typing import List, Dict, Any, Optional
from sqlmodel import Session
from app.models import FlightDeal, HotelDeal, Bundle
from datetime import datetime, timedelta


class BundleSummarizer:
    """Generates clear, comparable summaries for bundles"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def generate_bundle_summary(
        self,
        bundle: Bundle,
        flights: Optional[List[FlightDeal]] = None,
        hotels: Optional[List[HotelDeal]] = None
    ) -> Dict[str, Any]:
        if not flights and bundle.flight_deal_ids:
            flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
            flights = [self.session.get(FlightDeal, fid) for fid in flight_ids if fid]
            flights = [f for f in flights if f]
        
        if not hotels and bundle.hotel_deal_ids:
            hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id]
            hotels = [self.session.get(HotelDeal, hid) for hid in hotel_ids if hid]
            hotels = [h for h in hotels if h]
        
        travel_time = self._calculate_travel_time(flights[0] if flights else None)
        neighborhood = self._get_neighborhood(hotels[0] if hotels else None)
        cancellation_terms = self._get_cancellation_terms(flights, hotels)
        why_this_pick = self._generate_why_this_pick(bundle, flights, hotels)
        
        return {
            "bundle_id": bundle.id,
            "name": bundle.name,
            "price": {
                "total": bundle.total_price,
                "per_person": bundle.total_price / 2,  # Assuming 2 travelers
                "savings": bundle.savings,
                "savings_percentage": (bundle.savings / (bundle.total_price + bundle.savings)) * 100 if bundle.savings > 0 else 0
            },
            "travel_time": travel_time,
            "hotel_neighborhood": neighborhood,
            "cancellation_terms": cancellation_terms,
            "why_this_pick": why_this_pick,
            "flights": [
                {
                    "airline": f.airline,
                    "route": f"{f.origin} → {f.destination}",
                    "departure": f.departure_time.isoformat() if f.departure_time else None,
                    "arrival": f.arrival_time.isoformat() if f.arrival_time else None,
                    "price": f.discounted_price
                }
                for f in (flights or [])
            ],
            "hotels": [
                {
                    "name": h.name,
                    "city": h.city,
                    "price_per_night": h.discounted_price_per_night,
                    "rating": h.rating
                }
                for h in (hotels or [])
            ]
        }
    
    def _calculate_travel_time(self, flight: Optional[FlightDeal]) -> Optional[str]:
        if not flight or not flight.departure_time or not flight.arrival_time:
            return None
        
        if isinstance(flight.departure_time, str):
            departure = datetime.fromisoformat(flight.departure_time.replace('Z', '+00:00'))
        else:
            departure = flight.departure_time
        
        if isinstance(flight.arrival_time, str):
            arrival = datetime.fromisoformat(flight.arrival_time.replace('Z', '+00:00'))
        else:
            arrival = flight.arrival_time
        
        duration = arrival - departure
        hours = int(duration.total_seconds() / 3600)
        minutes = int((duration.total_seconds() % 3600) / 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"
    
    def _get_neighborhood(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        if not hotel:
            return {"name": "Unknown", "description": ""}
        
        location_tags = []
        if hotel.tags:
            location_keywords = ["downtown", "city-center", "airport", "beachfront", "near-transit"]
            for keyword in location_keywords:
                if keyword in hotel.tags.lower():
                    location_tags.append(keyword.replace("-", " ").title())
        
        neighborhood_name = location_tags[0] if location_tags else hotel.city or "Unknown"
        description = f"{hotel.address or ''} in {hotel.city or ''}"
        if location_tags:
            description += f" ({', '.join(location_tags)})"
        
        return {
            "name": neighborhood_name,
            "description": description.strip(),
            "address": hotel.address,
            "city": hotel.city,
            "tags": location_tags
        }
    
    def _get_cancellation_terms(self, flights: List[FlightDeal], hotels: List[HotelDeal]) -> Dict[str, Any]:
        terms = {
            "flight": "Varies by airline",
            "hotel": "Varies by hotel",
            "refundable": False
        }
        
        if flights:
            flight = flights[0]
            is_refundable = flight.tags and "refundable" in flight.tags.lower()
            if is_refundable:
                terms["flight"] = f"{flight.airline}: Free cancellation with refund"
                terms["refundable"] = True
            else:
                terms["flight"] = f"{flight.airline}: Cancellation fees may apply"
        
        if hotels:
            hotel = hotels[0]
            is_refundable = hotel.tags and "refundable" in hotel.tags.lower()
            if is_refundable:
                terms["hotel"] = f"{hotel.name}: Free cancellation available"
                terms["refundable"] = True
            else:
                terms["hotel"] = f"{hotel.name}: Cancellation policy varies"
        
        return terms
    
    def _generate_why_this_pick(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal]
    ) -> str:
        from app.data.price_history import PriceHistoryTracker
        price_tracker = PriceHistoryTracker(self.session)
        
        facts = []
        word_count = 0
        max_words = 25
        
        if hotels:
            hotel = hotels[0]
            try:
                avg_price = price_tracker.calculate_average("hotel", hotel.city, days=30)
                if avg_price and hotel.discounted_price_per_night:
                    price_diff_pct = ((avg_price - hotel.discounted_price_per_night) / avg_price) * 100
                    if price_diff_pct >= 15:
                        facts.append(f"{price_diff_pct:.0f}% below avg")
                        word_count += 3
                    elif price_diff_pct >= 5:
                        facts.append(f"{price_diff_pct:.0f}% below avg")
                        word_count += 3
            except:
                pass
        
        if bundle.savings > 0 and word_count < max_words - 5:
            savings_pct = (bundle.savings / (bundle.total_price + bundle.savings)) * 100
            if savings_pct >= 10:
                facts.append(f"${bundle.savings:.0f} off")
                word_count += 2
        
        if hotels and word_count < max_words - 8:
            hotel = hotels[0]
            if hotel.tags:
                tags = [t.strip() for t in hotel.tags.split(",") if t.strip()]
                location_tags = [t for t in tags if t in ["downtown", "beachfront", "near-transit", "city-center"]]
                if location_tags:
                    facts.append(location_tags[0])
                    word_count += 1
                
                amenity_tags = [t for t in tags if t in ["pet-friendly", "refundable", "breakfast"]]
                if amenity_tags and word_count < max_words - 3:
                    facts.append(amenity_tags[0])
                    word_count += 1
        
        if hotels and word_count < max_words - 4:
            hotel = hotels[0]
            if hotel.rating and hotel.rating >= 4.0:
                facts.append(f"{hotel.rating:.1f}★")
                word_count += 1
        
        if flights and word_count < max_words - 5:
            flight = flights[0]
            if flight.discount_percentage >= 15:
                facts.append(f"{flight.discount_percentage:.0f}% flight discount")
                word_count += 3
        
        explanation = " • ".join(facts[:5])
        if not explanation:
            explanation = "Best value match"
        
        words = explanation.split()
        if len(words) > 25:
            explanation = " ".join(words[:25]) + "..."
        return explanation
    
    def generate_what_to_watch(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal]
    ) -> str:
        watch_items = []
        word_count = 0
        max_words = 12
        
        if hotels and word_count < max_words - 5:
            hotel = hotels[0]
            if hotel.available_rooms <= 5:
                watch_items.append(f"Only {hotel.available_rooms} rooms left")
                word_count += 4
            elif hotel.available_rooms <= 10:
                watch_items.append(f"Low inventory: {hotel.available_rooms} rooms")
                word_count += 4
        
        # Check flight availability
        if flights and word_count < max_words - 5:
            flight = flights[0]
            if flight.available_seats <= 5:
                watch_items.append(f"Only {flight.available_seats} seats left")
                word_count += 4
        
        # Check refund cutoff (if refundable)
        if hotels and word_count < max_words - 6:
            hotel = hotels[0]
            if hotel.tags and "refundable" in hotel.tags.lower():
                watch_items.append("Refund cutoff: 24-48h before check-in")
                word_count += 6
            elif hotel.tags and "non-refundable" in hotel.tags.lower():
                watch_items.append("Non-refundable booking")
                word_count += 2
        
        if flights and word_count < max_words - 4:
            flight = flights[0]
            if flight.tags and "non-refundable" in flight.tags.lower():
                if "Non-refundable" not in " ".join(watch_items):
                    watch_items.append("Non-refundable flight")
                    word_count += 2
        
        # Combine into ≤12 word alert
        alert = " • ".join(watch_items[:3])  # Max 3 items
        if not alert:
            alert = "Monitor price and availability"
        
        # Ensure ≤12 words
        words = alert.split()
        if len(words) > 12:
            alert = " ".join(words[:12])
        
        return alert
    
    def generate_comparison_summaries(
        self,
        bundles: List[Bundle],
        flights_map: Optional[Dict[int, List[FlightDeal]]] = None,
        hotels_map: Optional[Dict[int, List[HotelDeal]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate summaries for multiple bundles for comparison"""
        summaries = []
        
        for bundle in bundles:
            flights = flights_map.get(bundle.id) if flights_map else None
            hotels = hotels_map.get(bundle.id) if hotels_map else None
            summary = self.generate_bundle_summary(bundle, flights, hotels)
            summaries.append(summary)
        
        return summaries

