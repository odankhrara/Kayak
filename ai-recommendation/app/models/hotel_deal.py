"""Hotel deal model"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class HotelDealBase(SQLModel):
    name: str
    city: str
    state: Optional[str] = None
    country: str
    address: str
    original_price_per_night: float
    discounted_price_per_night: float
    discount_percentage: float
    available_rooms: int
    rating: Optional[float] = None
    deal_score: float = Field(default=0.0, description="AI-calculated deal score")
    tags: str = Field(default="", description="Comma-separated tags")
    is_active: bool = Field(default=True)


class HotelDeal(HotelDealBase, table=True):
    """Hotel deal database model"""
    __tablename__ = "hotel_deals"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

