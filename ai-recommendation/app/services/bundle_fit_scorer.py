"""Bundle Fit Scorer - Computes fit score for bundles based on price, amenities, and location"""
from typing import Dict, Any, Optional, List
from sqlmodel import Session
from app.models import FlightDeal, HotelDeal, Bundle
from app.data.price_history import PriceHistoryTracker


class BundleFitScorer:
    """
    Computes Fit Score for bundles:
    - Price vs budget/median (0-40 points)
    - Amenity/policy match (0-30 points)
    - Simple location tag (0-30 points)
    Total: 0-100
    """
    
    def __init__(self, session: Session):
        self.session = session
        # PriceHistoryTracker uses static methods, no instantiation needed
    
    def compute_fit_score(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        user_budget: Optional[float] = None,
        user_preferences: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compute fit score for a bundle
        
        Args:
            bundle: Bundle to score
            flights: List of flight deals in bundle
            hotels: List of hotel deals in bundle
            user_budget: User's budget (optional)
            user_preferences: List of preference tags (e.g., ["pet-friendly", "refundable"])
        
        Returns:
            Dictionary with fit_score (0-100) and breakdown
        """
        score_breakdown = {
            "price_score": 0.0,
            "amenity_score": 0.0,
            "location_score": 0.0,
            "total_score": 0.0
        }
        
        # 1. Price vs budget/median (0-40 points)
        price_score = self._compute_price_score(bundle, flights, hotels, user_budget)
        score_breakdown["price_score"] = price_score
        
        # 2. Amenity/policy match (0-30 points)
        amenity_score = self._compute_amenity_score(bundle, flights, hotels, user_preferences)
        score_breakdown["amenity_score"] = amenity_score
        
        # 3. Simple location tag (0-30 points)
        location_score = self._compute_location_score(bundle, hotels)
        score_breakdown["location_score"] = location_score
        
        # Total score
        total_score = price_score + amenity_score + location_score
        score_breakdown["total_score"] = min(100.0, total_score)  # Cap at 100
        
        return {
            "fit_score": round(score_breakdown["total_score"], 1),
            "breakdown": score_breakdown,
            "interpretation": self._interpret_score(score_breakdown["total_score"])
        }
    
    def _compute_price_score(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        user_budget: Optional[float]
    ) -> float:
        """Compute price score (0-40 points)"""
        score = 0.0
        
        # If user budget provided, compare against it
        if user_budget and bundle.total_price > 0:
            budget_ratio = bundle.total_price / user_budget
            if budget_ratio <= 0.8:  # Under 80% of budget
                score = 40
            elif budget_ratio <= 0.9:  # 80-90% of budget
                score = 35
            elif budget_ratio <= 1.0:  # 90-100% of budget
                score = 30
            elif budget_ratio <= 1.1:  # 100-110% of budget
                score = 20
            else:  # Over 110% of budget
                score = max(0, 20 - (budget_ratio - 1.1) * 50)
        else:
            # Compare against median prices
            # Get median prices for similar routes/destinations
            if flights:
                flight = flights[0]
                # Try to get historical median
                median_flight_price = self._get_median_price("flight", flight.origin, flight.destination)
                if median_flight_price and flight.discounted_price > 0:
                    price_ratio = flight.discounted_price / median_flight_price
                    if price_ratio <= 0.85:  # 15%+ below median
                        score += 20
                    elif price_ratio <= 1.0:  # At or below median
                        score += 15
                    else:  # Above median
                        score += max(5, 15 - (price_ratio - 1.0) * 20)
                else:
                    # Fallback: use deal score as proxy
                    score += min(20, flight.deal_score * 0.2)
            
            if hotels:
                hotel = hotels[0]
                median_hotel_price = self._get_median_price("hotel", hotel.city)
                if median_hotel_price and hotel.discounted_price_per_night > 0:
                    price_ratio = hotel.discounted_price_per_night / median_hotel_price
                    if price_ratio <= 0.85:  # 15%+ below median
                        score += 20
                    elif price_ratio <= 1.0:  # At or below median
                        score += 15
                    else:  # Above median
                        score += max(5, 15 - (price_ratio - 1.0) * 20)
                else:
                    # Fallback: use deal score as proxy
                    score += min(20, hotel.deal_score * 0.2)
        
        return min(40.0, score)
    
    def _compute_amenity_score(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        user_preferences: Optional[List[str]]
    ) -> float:
        """Compute amenity/policy match score (0-30 points)"""
        if not user_preferences:
            return 15.0  # Neutral score if no preferences
        
        score = 0.0
        max_score_per_preference = 30.0 / len(user_preferences) if user_preferences else 0
        
        # Check bundle tags
        bundle_tags = [tag.strip().lower() for tag in bundle.tags.split(",") if tag.strip()] if bundle.tags else []
        
        # Check hotel tags
        hotel_tags = []
        for hotel in hotels:
            if hotel.tags:
                hotel_tags.extend([tag.strip().lower() for tag in hotel.tags.split(",") if tag.strip()])
        
        # Check flight tags
        flight_tags = []
        for flight in flights:
            if flight.tags:
                flight_tags.extend([tag.strip().lower() for tag in flight.tags.split(",") if tag.strip()])
        
        all_tags = list(set(bundle_tags + hotel_tags + flight_tags))
        
        # Match preferences
        for preference in user_preferences:
            pref_lower = preference.lower()
            # Check for exact match or partial match
            matched = False
            for tag in all_tags:
                if pref_lower in tag or tag in pref_lower:
                    score += max_score_per_preference
                    matched = True
                    break
            
            if not matched:
                # Partial credit for related tags
                related_keywords = {
                    "pet": ["pet", "dog", "cat", "animal"],
                    "refundable": ["refund", "cancel", "flexible"],
                    "breakfast": ["breakfast", "meal", "continental"],
                    "wifi": ["wifi", "internet", "wireless"],
                    "parking": ["parking", "park", "valet"]
                }
                for key, keywords in related_keywords.items():
                    if key in pref_lower:
                        for keyword in keywords:
                            if any(keyword in tag for tag in all_tags):
                                score += max_score_per_preference * 0.5
                                break
        
        return min(30.0, score)
    
    def _compute_location_score(self, bundle: Bundle, hotels: List[HotelDeal]) -> float:
        """Compute location score based on simple location tags (0-30 points)"""
        score = 0.0
        
        if not hotels:
            return 10.0  # Neutral score
        
        hotel = hotels[0]
        
        # Location tags that add value
        premium_location_tags = {
            "downtown": 10,
            "city-center": 10,
            "beachfront": 8,
            "near-transit": 7,
            "airport": 5,
            "waterfront": 8
        }
        
        # Check hotel tags
        if hotel.tags:
            hotel_tags_lower = hotel.tags.lower()
            for tag, points in premium_location_tags.items():
                if tag in hotel_tags_lower:
                    score += points
                    break  # Only count best match
        
        # Base score for having location info
        if hotel.city:
            score += 5
        if hotel.address:
            score += 5
        
        # Bonus for good ratings (location often correlates with ratings)
        if hotel.rating and hotel.rating >= 4.0:
            score += 5
        
        return min(30.0, score)
    
    def _get_median_price(self, deal_type: str, *args) -> Optional[float]:
        """Get median price for similar deals"""
        try:
            if deal_type == "flight" and len(args) >= 2:
                origin, destination = args[0], args[1]
                # Use price history tracker to get average
                # For now, return None (would need to implement median calculation)
                return None
            elif deal_type == "hotel" and len(args) >= 1:
                city = args[0]
                # Use price history tracker
                return None
        except:
            pass
        return None
    
    def _interpret_score(self, score: float) -> str:
        """Interpret the fit score"""
        if score >= 80:
            return "Excellent fit"
        elif score >= 65:
            return "Very good fit"
        elif score >= 50:
            return "Good fit"
        elif score >= 35:
            return "Moderate fit"
        else:
            return "Limited fit"

