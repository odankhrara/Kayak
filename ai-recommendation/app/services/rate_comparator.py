"""Rate Comparator - Compares rates with historical data and alternatives"""
from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
from app.models import HotelDeal, FlightDeal
from app.data.price_history import PriceHistoryTracker
from datetime import datetime, timedelta


class RateComparator:
    """Compares rates with historical data and similar alternatives"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def is_rate_good(
        self,
        deal: HotelDeal,
        days: int = 60
    ) -> Dict[str, Any]:
        """
        Determine if a rate is good by comparing with historical data
        
        Returns explanation like:
        "This is 19% below its 60-day rolling average for these dates;
         similar 4 star options nearby are $25–$60 higher per night."
        """
        # Get historical data
        listing_id = deal.name
        historical_data = PriceHistoryTracker.get_historical_data(
            self.session, "hotel", listing_id, days=days
        )
        
        current_price = deal.discounted_price_per_night
        avg_price = historical_data.get("avg_price_30d") or historical_data.get("avg_price_60d")
        
        comparison = {
            "current_price": current_price,
            "historical_avg": avg_price,
            "days_analyzed": days,
            "is_good_deal": False,
            "explanation": "",
            "alternatives": []
        }
        
        if avg_price and current_price < avg_price:
            discount_pct = ((avg_price - current_price) / avg_price) * 100
            comparison["is_good_deal"] = True
            comparison["discount_percentage"] = discount_pct
            comparison["savings_vs_avg"] = avg_price - current_price
            
            # Find similar alternatives
            alternatives = self._find_similar_alternatives(deal)
            comparison["alternatives"] = alternatives
            
            # Build explanation
            explanation_parts = [
                f"This is {discount_pct:.0f}% below its {days}-day rolling average for these dates"
            ]
            
            if alternatives:
                price_diffs = [alt["price_diff"] for alt in alternatives if alt.get("price_diff")]
                if price_diffs:
                    min_diff = min(price_diffs)
                    max_diff = max(price_diffs)
                    explanation_parts.append(
                        f"similar {deal.rating or 4}-star options nearby are "
                        f"${min_diff:.0f}–${max_diff:.0f} higher per night"
                    )
            
            comparison["explanation"] = "; ".join(explanation_parts) + "."
        elif avg_price:
            # Price is at or above average
            premium_pct = ((current_price - avg_price) / avg_price) * 100
            comparison["is_good_deal"] = False
            comparison["premium_percentage"] = premium_pct
            comparison["explanation"] = (
                f"This rate is {premium_pct:.0f}% above the {days}-day average. "
                f"You might find better deals by adjusting your dates or considering nearby options."
            )
        else:
            comparison["explanation"] = (
                f"Insufficient historical data to compare. "
                f"Current rate: ${current_price:.2f}/night. "
                f"Deal score: {deal.deal_score:.1f}/100."
            )
        
        return comparison
    
    def _find_similar_alternatives(
        self,
        deal: HotelDeal,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Find similar hotel alternatives in the same city"""
        if not deal.city:
            return []
        
        # Find hotels in same city with similar rating
        statement = select(HotelDeal).where(
            HotelDeal.city == deal.city,
            HotelDeal.id != deal.id,
            HotelDeal.is_active == True
        )
        
        if deal.rating:
            # Find hotels with similar rating (±0.5 stars)
            statement = statement.where(
                HotelDeal.rating >= deal.rating - 0.5,
                HotelDeal.rating <= deal.rating + 0.5
            )
        
        alternatives = list(self.session.exec(statement.order_by(HotelDeal.deal_score.desc()).limit(limit)).all())
        
        result = []
        for alt in alternatives:
            price_diff = alt.discounted_price_per_night - deal.discounted_price_per_night
            result.append({
                "name": alt.name,
                "price_per_night": alt.discounted_price_per_night,
                "price_diff": price_diff,
                "rating": alt.rating,
                "deal_score": alt.deal_score
            })
        
        return result

