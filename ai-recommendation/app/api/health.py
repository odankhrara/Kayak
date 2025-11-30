"""Health check endpoint"""
from fastapi import APIRouter
from app.deals_agent.deal_scanner import DealScanner

router = APIRouter()

# Global scanner instance (will be set by main.py)
scanner_instance: DealScanner = None


def set_scanner(scanner: DealScanner):
    """Set the global scanner instance"""
    global scanner_instance
    scanner_instance = scanner


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-recommendation",
        "version": "1.0.0"
    }


@router.post("/scan-now")
async def trigger_scan():
    """
    Manually trigger a deal scan (useful for testing)
    
    This endpoint allows you to immediately scan for deals without
    waiting for the next scheduled scan interval.
    """
    if not scanner_instance:
        return {
            "error": "Deal scanner not initialized",
            "status": "unavailable"
        }
    
    try:
        stats = await scanner_instance.scan_now()
        return {
            "status": "success",
            "message": "Deal scan completed",
            "stats": stats
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

