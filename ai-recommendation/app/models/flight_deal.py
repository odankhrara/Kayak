"""Flight deal model"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class FlightDealBase(SQLModel):
    airline: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    original_price: float
    discounted_price: float
    discount_percentage: float
    available_seats: int
    deal_score: float = Field(default=0.0, description="AI-calculated deal score")
    tags: str = Field(default="", description="Comma-separated tags")
    is_active: bool = Field(default=True)


class FlightDeal(FlightDealBase, table=True):
    """Flight deal database model"""
    __tablename__ = "flight_deals"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_price_update: Optional[datetime] = Field(default=None, description="Last price update timestamp for history tracking")

