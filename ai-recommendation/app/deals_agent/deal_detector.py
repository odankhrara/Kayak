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
    ) -> int:
        """
        Calculate deal score (0-100) as small integer based on multiple factors
        
        Rules per specification:
        - ≥15% below 30-day average
        - Limited inventory (<5)
        - Promo end date
        """
        score = 0.0
        
        # Historical price comparison (0-40 points)
        # Check if ≥15% below 30-day average (per specification)
        if historical_data and historical_data.get('avg_30d_price'):
            avg_30d_price = historical_data['avg_30d_price']
            if avg_30d_price > 0:
                price_diff_pct = ((avg_30d_price - price) / avg_30d_price) * 100
                if price_diff_pct >= 15:  # ≥15% below 30-day avg
                    score += 40
                elif price_diff_pct >= 10:
                    score += 30
                elif price_diff_pct >= 5:
                    score += 20
                else:
                    score += 10
        else:
            # Fallback: use discount percentage
            discount_score = min(discount_percentage * 0.4, 40)
            score += discount_score
        
        # Limited inventory factor (0-30 points)
        # Mark Limited availability (<5) per specification
        if availability < 5:
            # Limited inventory - higher score
            if availability == 0:
                availability_score = 0
            elif availability == 1:
                availability_score = 30  # Very limited
            elif availability == 2:
                availability_score = 25
            elif availability == 3:
                availability_score = 20
            else:  # availability == 4
                availability_score = 15
        elif availability < 10:
            availability_score = 10
        else:
            availability_score = 5
        score += availability_score
        
        # Promo end date factor (0-20 points)
        # Check if promo is ending soon
        if historical_data and historical_data.get('promo_end_date'):
            from datetime import datetime
            try:
                promo_end = datetime.fromisoformat(historical_data['promo_end_date'])
                days_until_end = (promo_end - datetime.now()).days
                if days_until_end <= 1:
                    score += 20  # Ending today/tomorrow
                elif days_until_end <= 3:
                    score += 15
                elif days_until_end <= 7:
                    score += 10
                else:
                    score += 5
            except:
                score += 5
        else:
            score += 5  # Default if no promo end date
        
        # Price factor (0-10 points) - lower prices score higher
        if price < 100:
            price_score = 10
        elif price < 500:
            price_score = 8
        elif price < 1000:
            price_score = 5
        else:
            price_score = 2
        score += price_score
        
        # Return as small integer (0-100)
        return int(min(100, max(0, score)))
    
    @staticmethod
    def is_good_deal(deal_score: float, threshold: float = 60.0) -> bool:
        """Determine if a deal is worth highlighting"""
        return deal_score >= threshold
    
    @staticmethod
    def detect_flight_deal(
        flight_data: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Detect deal from flight data with historical context"""
        original_price = flight_data.get("original_price", flight_data.get("price", 0))
        current_price = flight_data.get("price", original_price)
        
        discount = DealDetector.calculate_discount(original_price, current_price)
        deal_score = DealDetector.calculate_deal_score(
            discount,
            current_price,
            flight_data.get("available_seats", 0),
            historical_data
        )
        
        return {
            "original_price": original_price,
            "discounted_price": current_price,
            "discount_percentage": discount,
            "deal_score": deal_score,
            "is_good_deal": DealDetector.is_good_deal(deal_score),
            "historical_avg_30d": historical_data.get("avg_price_30d") if historical_data else None
        }
    
    @staticmethod
    def detect_hotel_deal(
        hotel_data: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Detect deal from hotel data with historical context"""
        original_price = hotel_data.get("original_price", hotel_data.get("price_per_night", 0))
        current_price = hotel_data.get("price_per_night", original_price)
        
        discount = DealDetector.calculate_discount(original_price, current_price)
        deal_score = DealDetector.calculate_deal_score(
            discount,
            current_price,
            hotel_data.get("available_rooms", 0),
            historical_data
        )
        
        # Get 30-day average for deal detection
        avg_30d = None
        if historical_data:
            avg_30d = historical_data.get("avg_30d_price") or historical_data.get("avg_price_30d")
        
        return {
            "original_price_per_night": original_price,
            "discounted_price_per_night": current_price,
            "discount_percentage": discount,
            "deal_score": deal_score,
            "is_good_deal": DealDetector.is_good_deal(deal_score),
            "historical_avg_30d": avg_30d
        }

