"""Bundle model - combines flights, hotels, and cars"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class BundleBase(SQLModel):
    name: str
    description: str
    total_price: float
    savings: float
    tags: str = Field(default="", description="Comma-separated tags")
    is_active: bool = Field(default=True)


class Bundle(BundleBase, table=True):
    """Bundle database model"""
    __tablename__ = "bundles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships would be handled via junction tables in a real implementation
    # For simplicity, we'll store IDs as JSON or use separate tables
    flight_deal_ids: str = Field(default="", description="Comma-separated flight deal IDs")
    hotel_deal_ids: str = Field(default="", description="Comma-separated hotel deal IDs")
    car_deal_ids: str = Field(default="", description="Comma-separated car deal IDs")

