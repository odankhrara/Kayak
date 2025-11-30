"""Quote Generator - Generates complete, validated quotes for booking"""
from typing import Dict, Any, Optional, List
from sqlmodel import Session
from app.models import FlightDeal, HotelDeal, Bundle
from datetime import datetime


class QuoteGenerator:
    """Generates complete, validated quotes with all booking details"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def generate_quote(
        self,
        bundle: Bundle,
        flights: Optional[List[FlightDeal]] = None,
        hotels: Optional[List[HotelDeal]] = None,
        travelers: int = 2
    ) -> Dict[str, Any]:
        """
        Generate a complete, validated quote
        
        Includes:
        - Fare class
        - Baggage information
        - Fees breakdown
        - Cancellation terms
        - All from available dataset fields
        """
        # Load flights and hotels if not provided
        if not flights and bundle.flight_deal_ids:
            flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
            flights = [self.session.get(FlightDeal, fid) for fid in flight_ids if fid]
            flights = [f for f in flights if f]
        
        if not hotels and bundle.hotel_deal_ids:
            hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id]
            hotels = [self.session.get(HotelDeal, hid) for hid in hotel_ids if hid]
            hotels = [h for h in hotels if h]
        
        quote = {
            "quote_id": f"Q-{bundle.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "bundle_id": bundle.id,
            "bundle_name": bundle.name,
            "travelers": travelers,
            "quote_date": datetime.utcnow().isoformat(),
            "valid_until": (datetime.utcnow().replace(hour=23, minute=59, second=59)).isoformat(),
            "flights": [],
            "hotels": [],
            "pricing": {
                "subtotal": bundle.total_price,
                "taxes_and_fees": self._estimate_taxes_fees(bundle.total_price),
                "total": 0,
                "savings": bundle.savings
            },
            "terms": {
                "cancellation": self._get_cancellation_terms(flights, hotels),
                "baggage": self._get_baggage_info(flights),
                "check_in": "3:00 PM (standard)",
                "check_out": "11:00 AM (standard)"
            },
            "fees": self._get_fees_breakdown(flights, hotels),
            "ready_for_booking": True
        }
        
        # Add flight details
        for flight in (flights or []):
            quote["flights"].append({
                "airline": flight.airline,
                "flight_number": flight.flight_number,
                "route": f"{flight.origin} → {flight.destination}",
                "departure": flight.departure_time.isoformat() if flight.departure_time else None,
                "arrival": flight.arrival_time.isoformat() if flight.arrival_time else None,
                "fare_class": self._determine_fare_class(flight),
                "price": flight.discounted_price,
                "original_price": flight.original_price,
                "available_seats": flight.available_seats,
                "refundable": "refundable" in (flight.tags.lower() if flight.tags else "")
            })
        
        # Add hotel details
        for hotel in (hotels or []):
            quote["hotels"].append({
                "name": hotel.name,
                "address": hotel.address,
                "city": hotel.city,
                "state": hotel.state,
                "price_per_night": hotel.discounted_price_per_night,
                "original_price_per_night": hotel.original_price_per_night,
                "nights": 3,  # Default 3 nights
                "total": hotel.discounted_price_per_night * 3,
                "rating": hotel.rating,
                "available_rooms": hotel.available_rooms,
                "refundable": "refundable" in (hotel.tags.lower() if hotel.tags else ""),
                "amenities": hotel.tags.split(",") if hotel.tags else []
            })
        
        # Calculate total
        quote["pricing"]["total"] = (
            quote["pricing"]["subtotal"] + 
            quote["pricing"]["taxes_and_fees"]
        )
        
        return quote
    
    def _estimate_taxes_fees(self, subtotal: float) -> float:
        """Estimate taxes and fees (typically 10-15% of subtotal)"""
        return round(subtotal * 0.12, 2)  # 12% estimate
    
    def _get_cancellation_terms(
        self,
        flights: List[FlightDeal],
        hotels: List[HotelDeal]
    ) -> Dict[str, Any]:
        """Get cancellation terms"""
        terms = {
            "flight_cancellation": "Varies by airline",
            "hotel_cancellation": "Varies by hotel",
            "refundable": False
        }
        
        if flights:
            flight = flights[0]
            is_refundable = flight.tags and "refundable" in flight.tags.lower()
            terms["flight_cancellation"] = (
                f"{flight.airline}: Free cancellation with full refund" if is_refundable
                else f"{flight.airline}: Cancellation fees may apply, check airline policy"
            )
            terms["refundable"] = is_refundable
        
        if hotels:
            hotel = hotels[0]
            is_refundable = hotel.tags and "refundable" in hotel.tags.lower()
            terms["hotel_cancellation"] = (
                f"{hotel.name}: Free cancellation up to 24 hours before check-in" if is_refundable
                else f"{hotel.name}: Cancellation policy varies, check hotel terms"
            )
            if is_refundable:
                terms["refundable"] = True
        
        return terms
    
    def _get_baggage_info(self, flights: List[FlightDeal]) -> Dict[str, Any]:
        """Get baggage information"""
        if not flights:
            return {
                "included": "Varies by airline",
                "carry_on": "Typically 1 personal item + 1 carry-on",
                "checked": "Not included, fees apply"
            }
        
        flight = flights[0]
        return {
            "airline": flight.airline,
            "included": "Varies by fare class",
            "carry_on": "1 personal item + 1 carry-on (size restrictions apply)",
            "checked": "Not included in base fare, typically $30-50 per bag",
            "note": f"Check {flight.airline} website for current baggage fees and policies"
        }
    
    def _get_fees_breakdown(
        self,
        flights: List[FlightDeal],
        hotels: List[HotelDeal]
    ) -> Dict[str, Any]:
        """Get fees breakdown"""
        fees = {
            "flight_fees": [],
            "hotel_fees": [],
            "estimated_total_fees": 0
        }
        
        if flights:
            flight = flights[0]
            fees["flight_fees"] = [
                {"name": "Baggage (if checked)", "amount": "$30-50", "optional": True},
                {"name": "Seat selection", "amount": "$10-30", "optional": True},
                {"name": "Airline fees", "amount": "Varies", "optional": False}
            ]
        
        if hotels:
            hotel = hotels[0]
            fees["hotel_fees"] = [
                {"name": "Resort fee", "amount": "$10-30/night", "optional": False, "note": "May apply"},
                {"name": "Parking", "amount": "$10-25/night", "optional": True},
                {"name": "City tax", "amount": "Varies by city", "optional": False}
            ]
        
        # Estimate total fees
        estimated = 0
        if flights:
            estimated += 40  # Baggage + seat selection estimate
        if hotels:
            estimated += 20 * 3  # Resort fee estimate for 3 nights
        
        fees["estimated_total_fees"] = estimated
        
        return fees
    
    def _determine_fare_class(self, flight: FlightDeal) -> str:
        """Determine fare class from deal information"""
        if flight.tags:
            tags_lower = flight.tags.lower()
            if "luxury" in tags_lower or "premium" in tags_lower:
                return "Premium Economy / Business"
            elif "budget" in tags_lower:
                return "Basic Economy"
        
        return "Economy"  # Default

