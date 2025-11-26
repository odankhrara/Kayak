"""Models package"""
from .flight_deal import FlightDeal, FlightDealBase
from .hotel_deal import HotelDeal, HotelDealBase
from .bundle import Bundle, BundleBase
from .watch import Watch, WatchBase

__all__ = [
    "FlightDeal",
    "FlightDealBase",
    "HotelDeal",
    "HotelDealBase",
    "Bundle",
    "BundleBase",
    "Watch",
    "WatchBase",
]

