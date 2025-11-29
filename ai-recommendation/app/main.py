"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health_router, bundles_router, watches_router, chat_router
from app.websocket import websocket_router
from app.db.session import create_db_and_tables
import os

# Create FastAPI app
app = FastAPI(
    title="AI Recommendation Service",
    description="AI-powered recommendation service for Kayak Travel Booking System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(bundles_router)
app.include_router(watches_router)
app.include_router(chat_router)
app.include_router(websocket_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_db_and_tables()
    print("AI Recommendation Service started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("AI Recommendation Service shutting down")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Recommendation Service",
        "version": "1.0.0",
        "status": "running"
    }

