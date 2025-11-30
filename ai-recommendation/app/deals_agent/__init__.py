"""Deals agent package"""
from .deal_detector import DealDetector
from .offer_tagger import OfferTagger
from .ingestion_worker import IngestionWorker
from .deal_scanner import DealScanner
from .feed_ingestion_scheduler import FeedIngestionScheduler

__all__ = ["DealDetector", "OfferTagger", "IngestionWorker", "DealScanner", "FeedIngestionScheduler"]

