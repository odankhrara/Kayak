"""Watch model - user price watches"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class WatchBase(SQLModel):
    user_id: int
    origin: Optional[str] = None
    destination: Optional[str] = None
    city: Optional[str] = None
    max_price: float
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    watch_type: str = Field(default="flight", description="flight, hotel, or car")
    active: bool = Field(default=True)
    notification_sent: bool = Field(default=False)


class Watch(WatchBase, table=True):
    """Watch database model"""
    __tablename__ = "watches"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

