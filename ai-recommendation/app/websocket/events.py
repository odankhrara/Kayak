"""WebSocket events endpoint for real-time deal notifications"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Watch
from app.schemas import WatchNotification
from app.services.deal_selector import DealSelector
from typing import Dict, Set
import json
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}  # user_id -> set of websockets
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a WebSocket for a user"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Disconnect a WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to all connections for a user"""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)


manager = ConnectionManager()


@router.websocket("/events/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time deal notifications"""
    await manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected to deal notifications for user {user_id}",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back or process message
            await websocket.send_json({
                "type": "echo",
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


async def notify_watch_match(watch: Watch, deal_info: dict, session: Session):
    """Notify user when a watch matches a deal"""
    notification = WatchNotification(
        watch_id=watch.id,
        message=f"Deal found matching your watch! {deal_info.get('message', '')}",
        deal_details=deal_info,
        timestamp=datetime.utcnow()
    )
    
    await manager.send_personal_message(
        notification.model_dump(),
        watch.user_id
    )
    
    # Mark notification as sent
    watch.notification_sent = True
    session.add(watch)
    session.commit()

