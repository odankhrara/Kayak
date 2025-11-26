"""Deals agent package"""
from .deal_detector import DealDetector
from .offer_tagger import OfferTagger
from .ingestion_worker import IngestionWorker

__all__ = ["DealDetector", "OfferTagger", "IngestionWorker"]

