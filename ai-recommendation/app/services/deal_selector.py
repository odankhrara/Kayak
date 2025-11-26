"""Deal selector service - picks best deals from cache/DB"""
from sqlmodel import Session, select
from typing import List, Optional
from app.models import FlightDeal, HotelDeal, Bundle
from app.schemas import BundleSearchParams


class DealSelector:
    """Service for selecting the best deals"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_best_flight_deals(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[FlightDeal]:
        """Get best flight deals matching criteria"""
        statement = select(FlightDeal).where(FlightDeal.is_active == True)
        
        if origin:
            statement = statement.where(FlightDeal.origin.ilike(f"%{origin}%"))
        if destination:
            statement = statement.where(FlightDeal.destination.ilike(f"%{destination}%"))
        if max_price:
            statement = statement.where(FlightDeal.discounted_price <= max_price)
        
        statement = statement.order_by(FlightDeal.deal_score.desc()).limit(limit)
        return list(self.session.exec(statement).all())
    
    def get_best_hotel_deals(
        self,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[HotelDeal]:
        """Get best hotel deals matching criteria"""
        statement = select(HotelDeal).where(HotelDeal.is_active == True)
        
        if city:
            statement = statement.where(HotelDeal.city.ilike(f"%{city}%"))
        if max_price:
            statement = statement.where(HotelDeal.discounted_price_per_night <= max_price)
        
        statement = statement.order_by(HotelDeal.deal_score.desc()).limit(limit)
        return list(self.session.exec(statement).all())
    
    def get_best_bundles(self, params: BundleSearchParams, limit: int = 10) -> List[Bundle]:
        """Get best bundles matching search parameters"""
        statement = select(Bundle).where(Bundle.is_active == True)
        
        if params.max_price:
            statement = statement.where(Bundle.total_price <= params.max_price)
        
        statement = statement.order_by(Bundle.savings.desc()).limit(limit)
        bundles = list(self.session.exec(statement).all())
        
        # Filter by tags if provided
        if params.tags:
            filtered = []
            for bundle in bundles:
                bundle_tags = [tag.strip() for tag in bundle.tags.split(",") if tag.strip()]
                if any(tag in bundle_tags for tag in params.tags):
                    filtered.append(bundle)
            return filtered
        
        return bundles
    
    def get_deal_by_id(self, deal_id: int, deal_type: str) -> Optional[FlightDeal | HotelDeal]:
        """Get deal by ID and type"""
        if deal_type == "flight":
            return self.session.get(FlightDeal, deal_id)
        elif deal_type == "hotel":
            return self.session.get(HotelDeal, deal_id)
        return None

