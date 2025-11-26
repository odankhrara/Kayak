"""Watch Pydantic schemas for request/response"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WatchCreate(BaseModel):
    """Watch creation schema"""
    origin: Optional[str] = None
    destination: Optional[str] = None
    city: Optional[str] = None
    max_price: float = Field(gt=0, description="Maximum price to watch for")
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    watch_type: str = Field(default="flight", pattern="^(flight|hotel|car)$")


class WatchUpdate(BaseModel):
    """Watch update schema"""
    max_price: Optional[float] = Field(None, gt=0)
    active: Optional[bool] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None


class WatchResponse(BaseModel):
    """Watch response schema"""
    id: int
    user_id: int
    origin: Optional[str]
    destination: Optional[str]
    city: Optional[str]
    max_price: float
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    watch_type: str
    active: bool
    notification_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WatchNotification(BaseModel):
    """Watch notification schema for WebSocket"""
    watch_id: int
    message: str
    deal_details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

