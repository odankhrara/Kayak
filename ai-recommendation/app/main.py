"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health_router, bundles_router, watches_router, chat_router
from app.websocket import websocket_router
from app.db.session import create_db_and_tables
from app.deals_agent.ingestion_worker import IngestionWorker
from app.deals_agent.deal_scanner import DealScanner
from app.deals_agent.feed_ingestion_scheduler import FeedIngestionScheduler
from app.deals_agent.normalization_worker import NormalizationWorker
from app.deals_agent.deal_detector_worker import DealDetectorWorker
from app.deals_agent.offer_tagger_worker import OfferTaggerWorker
from app.deals_agent.event_emitter import EventEmitter
import os
import asyncio
from contextlib import asynccontextmanager

# Global references for background tasks
ingestion_worker = None
deal_scanner = None
feed_scheduler = None
normalization_worker = None
deal_detector_worker = None
offer_tagger_worker = None
event_emitter = None
background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    
    try:
        from app.data.airport_mapper import AirportMapper
        airport_mapper = AirportMapper()
        print(f"✅ Airport mapper loaded ({len(airport_mapper.airports)} airports)")
    except Exception as e:
        print(f"⚠️  Airport mapper not loaded: {e}")
    
    try:
        from app.data.dataset_fetcher import DatasetFetcher
        fetcher = DatasetFetcher()
        missing = fetcher.get_missing_datasets()
        if missing:
            print(f"📥 Missing datasets detected: {', '.join(missing)}")
            fetch_task = asyncio.create_task(fetcher.fetch_all_missing_datasets())
            background_tasks.append(fetch_task)
        else:
            available = fetcher.get_available_datasets()
            print(f"✅ All datasets available: {', '.join(available)}")
    except Exception as e:
        print(f"⚠️  Dataset fetcher not available: {e}")
    
    print("AI Recommendation Service started")
    
    global ingestion_worker, deal_scanner, feed_scheduler
    global normalization_worker, deal_detector_worker, offer_tagger_worker, event_emitter
    
    feed_scheduler = FeedIngestionScheduler(ingestion_interval_minutes=30)
    feed_task = asyncio.create_task(feed_scheduler.start_periodic_ingestion())
    background_tasks.append(feed_task)
    print("✅ Feed ingestion scheduler started")
    
    normalization_worker = NormalizationWorker()
    norm_task = asyncio.create_task(normalization_worker.start())
    background_tasks.append(norm_task)
    print("✅ Normalization worker started")
    
    deal_detector_worker = DealDetectorWorker()
    detector_task = asyncio.create_task(deal_detector_worker.start())
    background_tasks.append(detector_task)
    print("✅ Deal detector worker started")
    
    offer_tagger_worker = OfferTaggerWorker()
    tagger_task = asyncio.create_task(offer_tagger_worker.start())
    background_tasks.append(tagger_task)
    print("✅ Offer tagger worker started")
    
    event_emitter = EventEmitter()
    emitter_task = asyncio.create_task(event_emitter.start())
    background_tasks.append(emitter_task)
    print("✅ Event emitter started")
    
    deal_scanner = DealScanner()
    scanner_task = asyncio.create_task(deal_scanner.start_periodic_scans())
    background_tasks.append(scanner_task)
    
    from app.api.health import set_scanner
    set_scanner(deal_scanner)
    
    print("✅ Deal scanner started")
    
    yield
    
    print("Shutting down background workers...")
    if feed_scheduler:
        await feed_scheduler.stop()
    if normalization_worker:
        await normalization_worker.stop()
    if deal_detector_worker:
        await deal_detector_worker.stop()
    if offer_tagger_worker:
        await offer_tagger_worker.stop()
    if event_emitter:
        await event_emitter.stop()
    if ingestion_worker:
        await ingestion_worker.stop()
    if deal_scanner:
        await deal_scanner.stop()
    
    # Cancel all background tasks
    for task in background_tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    
    print("AI Recommendation Service shutting down")


# Create FastAPI app with lifespan
app = FastAPI(
    title="AI Recommendation Service",
    description="AI-powered recommendation service for Kayak Travel Booking System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(bundles_router)
app.include_router(watches_router)
app.include_router(chat_router)
try:
    if datasets_router:
        app.include_router(datasets_router)
except NameError:
    pass  # datasets_router not available
app.include_router(websocket_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Recommendation Service",
        "version": "1.0.0",
        "status": "running"
    }

