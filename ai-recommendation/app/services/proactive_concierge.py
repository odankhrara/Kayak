"""Proactive Concierge Service - Pushes recommendations based on conversation context"""
import asyncio
from sqlmodel import Session, select
from typing import Dict, Any, List, Optional
from app.models import FlightDeal, HotelDeal, Bundle
from app.services.concierge_agent import ConciergeAgent
from app.services.chat_context import context_manager
from app.schemas import BundleSearchParams
from app.websocket.events import manager as websocket_manager
from datetime import datetime, timedelta
import os


class ProactiveConcierge:
    """
    Proactive concierge that reasons about user needs and pushes recommendations
    
    This service:
    1. Monitors conversation context for user preferences
    2. Periodically scans for deals matching user interests
    3. Pushes proactive recommendations via WebSocket
    4. Adapts recommendations based on conversation history
    5. Explains reasoning behind recommendations
    """
    
    def __init__(self, session: Session, check_interval_minutes: int = 2):
        """
        Initialize proactive concierge
        
        Args:
            session: Database session
            check_interval_minutes: How often to check for proactive recommendations (default: 2 minutes)
        """
        self.session = session
        self.check_interval = check_interval_minutes * 60
        self.running = False
        self.concierge = ConciergeAgent(session)
        self.user_preferences: Dict[int, Dict[str, Any]] = {}  # user_id -> preferences
    
    def update_user_preferences(self, user_id: int, context: Dict[str, Any]):
        """
        Update user preferences from conversation context
        
        This allows the concierge to learn and adapt to user needs
        """
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {
                'origin': None,
                'destination': None,
                'city': None,
                'budget': None,
                'constraints': [],
                'last_updated': datetime.utcnow(),
                'conversation_count': 0
            }
        
        prefs = self.user_preferences[user_id]
        
        # Update preferences from context (only if provided)
        if context.get('origin'):
            prefs['origin'] = context['origin']
        if context.get('destination') or context.get('city'):
            prefs['destination'] = context.get('destination') or context.get('city')
            prefs['city'] = context.get('city') or context.get('destination')
        if context.get('budget'):
            prefs['budget'] = context['budget']
        if context.get('constraints'):
            # Merge constraints without duplicates
            existing = set(prefs['constraints'])
            new_constraints = set(context['constraints'])
            prefs['constraints'] = list(existing | new_constraints)
        
        prefs['last_updated'] = datetime.utcnow()
        prefs['conversation_count'] = prefs.get('conversation_count', 0) + 1
    
    async def check_and_push_recommendations(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Check if we should push proactive recommendations to a user
        
        Returns:
            Recommendation data if pushed, None otherwise
        """
        # Get user's conversation context
        # For now, we'll use a default session_id pattern
        # In production, you'd track session_id per user_id
        session_id = f"user_{user_id}_session"
        context = context_manager.get_context(session_id)
        
        # Update preferences from context
        self.update_user_preferences(user_id, context)
        prefs = self.user_preferences.get(user_id, {})
        
        # Only push if we have enough information (origin + destination + budget)
        if not (prefs.get('origin') and (prefs.get('destination') or prefs.get('city'))):
            return None
        
        # Check if we recently pushed recommendations (avoid spam)
        last_push = prefs.get('last_recommendation_push')
        if last_push:
            time_since_push = (datetime.utcnow() - last_push).total_seconds()
            if time_since_push < 300:  # Don't push more than once every 5 minutes
                return None
        
        # Generate proactive recommendations
        try:
            search_params = BundleSearchParams(
                origin=prefs.get('origin'),
                destination=prefs.get('destination'),
                city=prefs.get('city'),
                max_price=prefs.get('budget'),
                tags=prefs.get('constraints') if prefs.get('constraints') else None
            )
            
            bundles = self.concierge.recommend_bundles(search_params, limit=2)
            
            if bundles:
                # Get explanation for the top bundle
                top_bundle = bundles[0]
                flight_ids = [int(id) for id in top_bundle.flight_deal_ids.split(",") if id] if top_bundle.flight_deal_ids else []
                hotel_ids = [int(id) for id in top_bundle.hotel_deal_ids.split(",") if id] if top_bundle.hotel_deal_ids else []
                
                bundle_flights = [self.session.get(FlightDeal, fid) for fid in flight_ids if fid]
                bundle_hotels = [self.session.get(HotelDeal, hid) for hid in hotel_ids if hid]
                bundle_flights = [f for f in bundle_flights if f]
                bundle_hotels = [h for h in bundle_hotels if h]
                
                explanation = self.concierge.explain_tradeoffs(
                    top_bundle, bundle_flights, bundle_hotels, bundles
                )
                
                # Format bundles for WebSocket
                bundles_data = []
                for bundle in bundles:
                    bundles_data.append({
                        "id": bundle.id,
                        "name": bundle.name,
                        "description": bundle.description,
                        "total_price": bundle.total_price,
                        "savings": bundle.savings,
                        "tags": bundle.tags.split(",") if bundle.tags else []
                    })
                
                recommendation = {
                    "type": "proactive_recommendation",
                    "message": f"💡 Based on our conversation, I found {len(bundles)} great deals for you!",
                    "explanation": explanation,
                    "bundles": bundles_data,
                    "reasoning": f"I noticed you're interested in {prefs.get('origin')} → {prefs.get('destination') or prefs.get('city')}. "
                                f"These bundles match your preferences and budget.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Push via WebSocket
                await websocket_manager.send_personal_message(recommendation, user_id)
                
                # Update last push time
                prefs['last_recommendation_push'] = datetime.utcnow()
                
                return recommendation
            
        except Exception as e:
            print(f"[ProactiveConcierge] Error generating recommendations for user {user_id}: {e}")
        
        return None
    
    async def start_proactive_monitoring(self):
        """
        Start proactive monitoring loop
        
        This continuously checks for opportunities to push recommendations
        """
        self.running = True
        print(f"[ProactiveConcierge] Starting proactive monitoring (checking every {self.check_interval // 60} minutes)")
        
        while self.running:
            try:
                # Check all users with active preferences
                for user_id, prefs in list(self.user_preferences.items()):
                    # Only check if user has been active recently (within last hour)
                    last_updated = prefs.get('last_updated')
                    if last_updated:
                        time_since_update = (datetime.utcnow() - last_updated).total_seconds()
                        if time_since_update < 3600:  # Only check active users (within 1 hour)
                            await self.check_and_push_recommendations(user_id)
                
                await asyncio.sleep(self.check_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[ProactiveConcierge] Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop(self):
        """Stop proactive monitoring"""
        self.running = False
        print("[ProactiveConcierge] Stopped proactive monitoring")
    
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Get current preferences for a user"""
        return self.user_preferences.get(user_id, {})
    
    def clear_user_preferences(self, user_id: int):
        """Clear preferences for a user (e.g., after booking)"""
        if user_id in self.user_preferences:
            del self.user_preferences[user_id]

