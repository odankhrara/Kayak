"""Schemas package"""
from .bundle_schemas import (
    BundleResponse,
    BundleCreate,
    BundleSearchParams,
    FlightDealResponse,
    HotelDealResponse,
    CarDealResponse,
)
from .watch_schemas import (
    WatchCreate,
    WatchUpdate,
    WatchResponse,
    WatchNotification,
)

__all__ = [
    "BundleResponse",
    "BundleCreate",
    "BundleSearchParams",
    "FlightDealResponse",
    "HotelDealResponse",
    "CarDealResponse",
    "WatchCreate",
    "WatchUpdate",
    "WatchResponse",
    "WatchNotification",
]

