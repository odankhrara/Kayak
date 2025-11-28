"""Price history tracking for 30-day averages"""
from sqlmodel import Session, select, func
from app.db.session import get_session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict


class PriceHistoryTracker:
    """Tracks price history and calculates 30-day averages"""
    
    @staticmethod
    def get_price_history_key(listing_type: str, listing_id: str) -> str:
        """Generate a unique key for price history"""
        return f"{listing_type}:{listing_id}"
    
    @staticmethod
    def calculate_30_day_average(
        session: Session,
        listing_type: str,
        listing_id: str,
        current_date: Optional[datetime] = None
    ) -> Optional[float]:
        """Calculate 30-day average price for a listing"""
        if current_date is None:
            current_date = datetime.now()
        
        thirty_days_ago = current_date - timedelta(days=30)
        
        # In a real implementation, this would query a price_history table
        # For now, we'll use a simplified approach with the deals table
        try:
            if listing_type == "hotel":
                from app.models import HotelDeal
                statement = select(
                    func.avg(HotelDeal.original_price_per_night)
                ).where(
                    HotelDeal.name == listing_id,
                    HotelDeal.created_at >= thirty_days_ago
                )
            elif listing_type == "flight":
                from app.models import FlightDeal
                statement = select(
                    func.avg(FlightDeal.original_price)
                ).where(
                    FlightDeal.flight_number == listing_id,
                    FlightDeal.created_at >= thirty_days_ago
                )
            else:
                return None
            
            result = session.exec(statement).first()
            return float(result) if result else None
        except Exception as e:
            print(f"Error calculating 30-day average: {e}")
            return None
    
    @staticmethod
    def store_price_point(
        session: Session,
        listing_type: str,
        listing_id: str,
        price: float,
        timestamp: Optional[datetime] = None
    ):
        """Store a price point in history"""
        if timestamp is None:
            timestamp = datetime.now()
        
        # In a real implementation, this would insert into a price_history table
        # For now, we'll just update the deal record with a timestamp
        try:
            if listing_type == "hotel":
                from app.models import HotelDeal
                statement = select(HotelDeal).where(HotelDeal.name == listing_id)
                deal = session.exec(statement).first()
                if deal:
                    deal.last_price_update = timestamp
                    session.add(deal)
            elif listing_type == "flight":
                from app.models import FlightDeal
                statement = select(FlightDeal).where(FlightDeal.flight_number == listing_id)
                deal = session.exec(statement).first()
                if deal:
                    deal.last_price_update = timestamp
                    session.add(deal)
            
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Error storing price point: {e}")
    
    @staticmethod
    def get_historical_data(
        session: Session,
        listing_type: str,
        listing_id: str
    ) -> Dict[str, Any]:
        """Get historical price data for a listing"""
        avg_30d = PriceHistoryTracker.calculate_30_day_average(
            session, listing_type, listing_id
        )
        
        return {
            "avg_price_30d": avg_30d,
            "listing_type": listing_type,
            "listing_id": listing_id
        }

