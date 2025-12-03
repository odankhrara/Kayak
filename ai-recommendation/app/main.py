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
from dotenv import load_dotenv
import os
import asyncio
from contextlib import asynccontextmanager

# Load environment variables from .env file
load_dotenv()

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
    
    # Initialize CSV data indexer (if datasets exist) - run in background to not block startup
    async def init_csv_indexer():
        try:
            from app.services.csv_data_indexer import CSVDataIndexer
            from pathlib import Path
            import os
            
            data_dir = os.getenv("DATASETS_DIR", "./data/raw")
            csv_files = list(Path(data_dir).glob("*.csv"))
            
            if csv_files:
                print(f"📊 Found {len(csv_files)} CSV files, checking indexer...")
                index_db_path = os.getenv("CSV_INDEX_DB", "./csv_index.db")
                if Path(index_db_path).exists():
                    print("✅ CSV index database exists")
                else:
                    print("ℹ️  CSV index not found. Run: python scripts/index_all_datasets.py")
            else:
                print("ℹ️  No CSV files found in data/raw")
        except Exception as e:
            print(f"⚠️  CSV indexer check failed: {e}")
    
    # Run CSV indexer check in background (non-blocking)
    csv_task = asyncio.create_task(init_csv_indexer())
    background_tasks.append(csv_task)
    
    # Check datasets in background (non-blocking)
    async def check_datasets():
        try:
            from app.data.dataset_fetcher import DatasetFetcher
            fetcher = DatasetFetcher()
            missing = fetcher.get_missing_datasets()
            if missing:
                print(f"📥 Missing datasets detected: {', '.join(missing)}")
                # Don't auto-fetch on startup, just notify
            else:
                available = fetcher.get_available_datasets()
                print(f"✅ All datasets available: {', '.join(available)}")
        except Exception as e:
            print(f"⚠️  Dataset fetcher not available: {e}")
    
    dataset_task = asyncio.create_task(check_datasets())
    background_tasks.append(dataset_task)
    
    print("AI Recommendation Service started")
    
    global ingestion_worker, deal_scanner, feed_scheduler
    global normalization_worker, deal_detector_worker, offer_tagger_worker, event_emitter
    
    # Start workers in background (non-blocking) - create tasks without awaiting
    try:
        feed_scheduler = FeedIngestionScheduler(ingestion_interval_minutes=30)
        feed_task = asyncio.create_task(feed_scheduler.start_periodic_ingestion())
        background_tasks.append(feed_task)
        print("✅ Feed ingestion scheduler started")
    except Exception as e:
        print(f"⚠️  Feed scheduler not started: {e}")
    
    try:
        normalization_worker = NormalizationWorker()
        norm_task = asyncio.create_task(normalization_worker.start())
        background_tasks.append(norm_task)
        print("✅ Normalization worker started")
    except Exception as e:
        print(f"⚠️  Normalization worker not started: {e}")
    
    try:
        deal_detector_worker = DealDetectorWorker()
        detector_task = asyncio.create_task(deal_detector_worker.start())
        background_tasks.append(detector_task)
        print("✅ Deal detector worker started")
    except Exception as e:
        print(f"⚠️  Deal detector worker not started: {e}")
    
    try:
        offer_tagger_worker = OfferTaggerWorker()
        tagger_task = asyncio.create_task(offer_tagger_worker.start())
        background_tasks.append(tagger_task)
        print("✅ Offer tagger worker started")
    except Exception as e:
        print(f"⚠️  Offer tagger worker not started: {e}")
    
    try:
        event_emitter = EventEmitter()
        emitter_task = asyncio.create_task(event_emitter.start())
        background_tasks.append(emitter_task)
        print("✅ Event emitter started")
    except Exception as e:
        print(f"⚠️  Event emitter not started: {e}")
    
    try:
        deal_scanner = DealScanner()
        scanner_task = asyncio.create_task(deal_scanner.start_periodic_scans())
        background_tasks.append(scanner_task)
        
        from app.api.health import set_scanner
        set_scanner(deal_scanner)
        
        print("✅ Deal scanner started")
    except Exception as e:
        print(f"⚠️  Deal scanner not started: {e}")
    
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

