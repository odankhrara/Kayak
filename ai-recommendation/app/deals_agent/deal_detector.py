"""Deal detector - computes discounts and scores"""
from typing import Dict, Any, Optional
from datetime import datetime


class DealDetector:
    """Detects and scores deals from supplier feeds"""
    
    @staticmethod
    def calculate_discount(original_price: float, current_price: float) -> float:
        """Calculate discount percentage"""
        if original_price <= 0:
            return 0.0
        return ((original_price - current_price) / original_price) * 100
    
    @staticmethod
    def calculate_deal_score(
        discount_percentage: float,
        price: float,
        availability: int,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> float:
        """Calculate deal score (0-100) based on multiple factors"""
        score = 0.0
        
        # Discount factor (0-50 points)
        discount_score = min(discount_percentage * 0.5, 50)
        score += discount_score
        
        # Price factor (0-30 points) - lower prices score higher
        if price < 100:
            price_score = 30
        elif price < 500:
            price_score = 25 - (price - 100) * 0.05
        elif price < 1000:
            price_score = 15 - (price - 500) * 0.02
        else:
            price_score = max(5, 10 - (price - 1000) * 0.01)
        score += price_score
        
        # Availability factor (0-20 points)
        if availability > 10:
            availability_score = 20
        elif availability > 5:
            availability_score = 15
        elif availability > 0:
            availability_score = 10
        else:
            availability_score = 0
        score += availability_score
        
        # Historical trend factor (if available)
        if historical_data:
            avg_price = historical_data.get("avg_price", price)
            if current_price < avg_price * 0.8:
                score += 10  # Bonus for significant price drop
        
        return min(score, 100.0)
    
    @staticmethod
    def is_good_deal(deal_score: float, threshold: float = 60.0) -> bool:
        """Determine if a deal is worth highlighting"""
        return deal_score >= threshold
    
    @staticmethod
    def detect_flight_deal(flight_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect deal from flight data"""
        original_price = flight_data.get("original_price", flight_data.get("price", 0))
        current_price = flight_data.get("price", original_price)
        
        discount = DealDetector.calculate_discount(original_price, current_price)
        deal_score = DealDetector.calculate_deal_score(
            discount,
            current_price,
            flight_data.get("available_seats", 0)
        )
        
        return {
            "original_price": original_price,
            "discounted_price": current_price,
            "discount_percentage": discount,
            "deal_score": deal_score,
            "is_good_deal": DealDetector.is_good_deal(deal_score)
        }
    
    @staticmethod
    def detect_hotel_deal(hotel_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect deal from hotel data"""
        original_price = hotel_data.get("original_price", hotel_data.get("price_per_night", 0))
        current_price = hotel_data.get("price_per_night", original_price)
        
        discount = DealDetector.calculate_discount(original_price, current_price)
        deal_score = DealDetector.calculate_deal_score(
            discount,
            current_price,
            hotel_data.get("available_rooms", 0)
        )
        
        return {
            "original_price_per_night": original_price,
            "discounted_price_per_night": current_price,
            "discount_percentage": discount,
            "deal_score": deal_score,
            "is_good_deal": DealDetector.is_good_deal(deal_score)
        }

