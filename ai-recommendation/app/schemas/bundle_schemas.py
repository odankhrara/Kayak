"""Bundle Pydantic schemas for request/response"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class FlightDealResponse(BaseModel):
    """Flight deal response schema"""
    id: int
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
    deal_score: float
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class HotelDealResponse(BaseModel):
    """Hotel deal response schema"""
    id: int
    name: str
    city: str
    state: Optional[str]
    country: str
    address: str
    original_price_per_night: float
    discounted_price_per_night: float
    discount_percentage: float
    available_rooms: int
    rating: Optional[float]
    deal_score: float
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CarDealResponse(BaseModel):
    """Car deal response schema"""
    id: int
    make: str
    model: str
    year: int
    rental_company: str
    location: str
    original_price_per_day: float
    discounted_price_per_day: float
    discount_percentage: float
    deal_score: float
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class BundleResponse(BaseModel):
    """Bundle response schema"""
    id: int
    name: str
    description: str
    total_price: float
    savings: float
    tags: List[str] = Field(default_factory=list)
    flights: List[FlightDealResponse] = Field(default_factory=list)
    hotels: List[HotelDealResponse] = Field(default_factory=list)
    cars: List[CarDealResponse] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class BundleCreate(BaseModel):
    """Bundle creation schema"""
    name: str
    description: str
    flight_deal_ids: List[int] = Field(default_factory=list)
    hotel_deal_ids: List[int] = Field(default_factory=list)
    car_deal_ids: List[int] = Field(default_factory=list)


class BundleSearchParams(BaseModel):
    """Bundle search parameters"""
    origin: Optional[str] = None
    destination: Optional[str] = None
    city: Optional[str] = None
    max_price: Optional[float] = None
    tags: Optional[List[str]] = None

