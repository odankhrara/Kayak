"""Deal Scanner - Periodic background scanner for discovering great deals"""
import asyncio
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import FlightDeal, HotelDeal
from app.deals_agent.deal_detector import DealDetector
from app.websocket.events import manager as websocket_manager
from app.data.price_history import PriceHistoryTracker
from typing import Dict, Any, List
from datetime import datetime
import os


class DealScanner:
    """
    Proactive deal scanner that periodically discovers great deals
    and pushes them to users via WebSocket.
    
    This makes the service behave like a proactive teammate rather than
    just a search box.
    """
    
    def __init__(self, scan_interval_minutes: int = 5):
        """
        Initialize deal scanner
        
        Args:
            scan_interval_minutes: How often to scan for new deals (default: 5 minutes)
        """
        self.scan_interval = scan_interval_minutes * 60  # Convert to seconds
        self.running = False
        self.deal_detector = DealDetector()
    
    async def scan_for_deals(self) -> Dict[str, Any]:
        """
        Scan database for new great deals and notify users
        
        Returns:
            Statistics about discovered deals
        """
        session_gen = get_session()
        session = next(session_gen)
        
        stats = {
            "flight_deals": 0,
            "hotel_deals": 0,
            "notifications_sent": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            # Scan for new/updated flight deals
            flight_statement = select(FlightDeal).where(
                FlightDeal.is_active == True,
                FlightDeal.deal_score >= 60.0  # Only great deals
            ).order_by(FlightDeal.deal_score.desc()).limit(10)
            
            flight_deals = list(session.exec(flight_statement).all())
            stats["flight_deals"] = len(flight_deals)
            
            # Scan for new/updated hotel deals
            hotel_statement = select(HotelDeal).where(
                HotelDeal.is_active == True,
                HotelDeal.deal_score >= 60.0  # Only great deals
            ).order_by(HotelDeal.deal_score.desc()).limit(10)
            
            hotel_deals = list(session.exec(hotel_statement).all())
            stats["hotel_deals"] = len(hotel_deals)
            
            # Notify users about great deals (broadcast to all connected users)
            # In production, you'd match deals to user preferences/watches
            for deal in flight_deals[:3]:  # Top 3 flight deals
                savings = deal.original_price - deal.discounted_price
                notification = {
                    "type": "deal_discovered",
                    "deal_type": "flight",
                    "message": f"🔥 Great flight deal! {deal.airline} {deal.origin} → {deal.destination} "
                              f"${deal.discounted_price:.2f} (${savings:.2f} off)",
                    "deal": {
                        "id": deal.id,
                        "airline": deal.airline,
                        "origin": deal.origin,
                        "destination": deal.destination,
                        "price": deal.discounted_price,
                        "savings": savings,
                        "deal_score": deal.deal_score,
                        "tags": deal.tags.split(",") if deal.tags else []
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Broadcast to all connected users (in production, filter by preferences)
                # For now, we'll send to a demo user (user_id=1)
                await websocket_manager.send_personal_message(notification, user_id=1)
                stats["notifications_sent"] += 1
            
            for deal in hotel_deals[:3]:  # Top 3 hotel deals
                notification = {
                    "type": "deal_discovered",
                    "deal_type": "hotel",
                    "message": f"🏨 Amazing hotel deal! {deal.name} in {deal.city} "
                              f"${deal.discounted_price_per_night:.2f}/night "
                              f"({deal.discount_percentage:.1f}% off)",
                    "deal": {
                        "id": deal.id,
                        "name": deal.name,
                        "city": deal.city,
                        "price_per_night": deal.discounted_price_per_night,
                        "savings_per_night": deal.original_price_per_night - deal.discounted_price_per_night,
                        "deal_score": deal.deal_score,
                        "tags": deal.tags.split(",") if deal.tags else []
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Broadcast to all connected users
                await websocket_manager.send_personal_message(notification, user_id=1)
                stats["notifications_sent"] += 1
            
            print(f"[DealScanner] Discovered {stats['flight_deals']} flight deals, "
                  f"{stats['hotel_deals']} hotel deals, sent {stats['notifications_sent']} notifications")
            
        except Exception as e:
            print(f"[DealScanner] Error scanning for deals: {e}")
        finally:
            session.close()
        
        return stats
    
    async def start_periodic_scans(self):
        """
        Start periodic deal scanning in the background
        
        This runs continuously, scanning for deals at regular intervals
        """
        self.running = True
        print(f"[DealScanner] Starting periodic scans (every {self.scan_interval // 60} minutes)")
        
        # Do an initial scan
        await self.scan_for_deals()
        
        # Then scan periodically
        while self.running:
            try:
                await asyncio.sleep(self.scan_interval)
                if self.running:
                    await self.scan_for_deals()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[DealScanner] Error in periodic scan: {e}")
                # Continue running even if one scan fails
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop(self):
        """Stop the periodic scanner"""
        self.running = False
        print("[DealScanner] Stopped periodic scans")
    
    async def scan_now(self) -> Dict[str, Any]:
        """
        Manually trigger a scan (useful for testing or API endpoints)
        
        Returns:
            Statistics about discovered deals
        """
        return await self.scan_for_deals()

