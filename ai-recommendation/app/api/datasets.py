"""Dataset management API endpoints"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.data.dataset_fetcher import DatasetFetcher
import asyncio

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/status")
async def get_dataset_status():
    """Get status of all datasets"""
    fetcher = DatasetFetcher()
    
    return {
        "available": fetcher.get_available_datasets(),
        "missing": fetcher.get_missing_datasets(),
        "kaggle_available": fetcher.kaggle_available,
        "total": len(fetcher.DATASETS)
    }


@router.post("/fetch/{dataset_name}")
async def fetch_dataset(dataset_name: str):
    """Fetch a specific dataset"""
    fetcher = DatasetFetcher()
    result = await fetcher.fetch_dataset(dataset_name)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to fetch dataset")
        )
    
    return result


@router.post("/fetch-all")
async def fetch_all_datasets():
    """Fetch all missing datasets"""
    fetcher = DatasetFetcher()
    results = await fetcher.fetch_all_missing_datasets()
    
    return {
        "results": results,
        "summary": {
            "total": len(results),
            "successful": sum(1 for r in results.values() if r.get("success")),
            "failed": sum(1 for r in results.values() if not r.get("success")),
            "skipped": sum(1 for r in results.values() if r.get("skipped"))
        }
    }


@router.get("/recommendations/check")
async def check_recommendation_data():
    """
    Check if we have enough data for recommendations
    
    Returns information about what data is available for:
    - Flight recommendations
    - Hotel recommendations
    - Bundle creation
    """
    from app.db.session import get_session
    from sqlmodel import select, func
    from app.models import FlightDeal, HotelDeal, Bundle
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        # Count available deals
        flight_count = session.exec(select(func.count(FlightDeal.id)).where(FlightDeal.is_active == True)).one()
        hotel_count = session.exec(select(func.count(HotelDeal.id)).where(HotelDeal.is_active == True)).one()
        bundle_count = session.exec(select(func.count(Bundle.id)).where(Bundle.is_active == True)).one()
        
        # Check datasets
        fetcher = DatasetFetcher()
        available_datasets = fetcher.get_available_datasets()
        
        return {
            "recommendations_ready": flight_count > 0 and hotel_count > 0,
            "data_available": {
                "flights": {
                    "count": flight_count,
                    "ready": flight_count > 0
                },
                "hotels": {
                    "count": hotel_count,
                    "ready": hotel_count > 0
                },
                "bundles": {
                    "count": bundle_count,
                    "ready": bundle_count > 0
                }
            },
            "datasets": {
                "available": available_datasets,
                "missing": fetcher.get_missing_datasets()
            },
            "status": "ready" if (flight_count > 0 and hotel_count > 0) else "needs_data"
        }
    finally:
        session.close()

