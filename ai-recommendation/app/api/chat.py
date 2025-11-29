"""Chat API endpoints for AI chatbot"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session
from typing import List, Dict, Any
from app.db.session import get_session
from app.services.nlu_parser import NLUParser
from app.services.concierge_agent import ConciergeAgent
from app.schemas.chat_schemas import (
    ChatMessage,
    ChatResponse,
    ParsedTripRequest,
    ChatContext
)
from app.schemas import BundleSearchParams
from app.services.chat_context import context_manager
import json
from datetime import datetime
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])

# Global NLU parser instance
nlu_parser = NLUParser()


@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_message: ChatMessage,
    session: Session = Depends(get_session)
):
    """
    Process a chat message and return AI response
    
    Example request:
    {
        "message": "Weekend in Tokyo under $900 for two, SFO departure, pet-friendly, near transit.",
        "user_id": 1
    }
    """
    try:
        # Get or create session ID
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Parse the natural language message
        parsed = nlu_parser.parse(chat_message.message)
        parsed_request = ParsedTripRequest(**parsed)
        
        # Merge with existing context
        merged_request = context_manager.merge_with_context(session_id, parsed_request)
        
        # Check what we have and what's missing
        missing_fields = context_manager.get_missing_fields(session_id)
        context = context_manager.get_context(session_id)
        
        requires_clarification = len(missing_fields) > 0
        clarification_questions = []
        
        # Only ask for missing information
        if 'origin' in missing_fields:
            clarification_questions.append("Where are you departing from?")
        if 'destination' in missing_fields:
            clarification_questions.append("Where would you like to go?")
        if 'budget' in missing_fields:
            clarification_questions.append("What's your budget for this trip?")
        
        # If we have enough information, get recommendations
        bundles = None
        response_message = ""
        
        # Use merged request for search
        search_request = merged_request
        
        if not requires_clarification:
            # Create concierge agent and get recommendations
            concierge = ConciergeAgent(session)
            
            # Convert merged request to search params
            search_params = BundleSearchParams(
                origin=search_request.origin,
                destination=search_request.destination,
                city=search_request.city,
                max_price=search_request.budget,
                tags=search_request.constraints if search_request.constraints else None
            )
            
            # Get bundles
            bundle_list = concierge.recommend_bundles(search_params, limit=3)
            
            # Format bundles for response
            bundles = []
            for bundle in bundle_list:
                bundles.append({
                    "id": bundle.id,
                    "name": bundle.name,
                    "description": bundle.description,
                    "total_price": bundle.total_price,
                    "savings": bundle.savings,
                    "tags": bundle.tags.split(",") if bundle.tags else []
                })
            
            # Generate response message
            if bundles:
                response_message = f"I found {len(bundles)} great deals for you! "
                response_message += f"Here are bundles starting at ${min(b['total_price'] for b in bundles):.2f}. "
                response_message += "Would you like to see more details about any of these?"
            else:
                response_message = "I couldn't find any bundles matching your criteria. "
                response_message += "Would you like to adjust your search?"
        else:
            # Need clarification - provide context-aware response
            response_message = ""
            
            # Acknowledge what we already know
            known_info = []
            if context.get('origin'):
                known_info.append(f"departing from {context['origin']}")
            if context.get('destination') or context.get('city'):
                dest = context.get('destination') or context.get('city')
                known_info.append(f"going to {dest}")
            if context.get('budget'):
                known_info.append(f"budget of ${context['budget']:.0f}")
            
            if known_info:
                response_message = f"Great! I have you {' and '.join(known_info)}. "
            else:
                response_message = "I'd like to help you find the perfect trip! "
            
            # Ask for missing information
            if clarification_questions:
                if len(clarification_questions) == 1:
                    response_message += clarification_questions[0]
                else:
                    response_message += "I still need to know: " + ", ".join(clarification_questions[:-1]) + ", and " + clarification_questions[-1] + "."
            else:
                response_message += "Could you provide more details about your trip?"
        
        return ChatResponse(
            message=response_message,
            parsed_request=merged_request,
            bundles=bundles,
            requires_clarification=requires_clarification,
            clarification_questions=clarification_questions
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")


@router.websocket("/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for real-time chat
    
    Usage:
    - Connect to: ws://localhost:8005/chat/ws/{user_id}
    - Send: {"message": "Weekend in Tokyo under $900..."}
    - Receive: ChatResponse JSON
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Parse message
            chat_message = ChatMessage(**message_data)
            
            # Get or create session ID
            session_id = chat_message.session_id or str(uuid.uuid4())
            
            # Get database session (simplified - in production use proper session management)
            from app.db.session import get_session
            session_gen = get_session()
            session = next(session_gen)
            
            try:
                # Process message
                parsed = nlu_parser.parse(chat_message.message)
                parsed_request = ParsedTripRequest(**parsed)
                
                # Merge with existing context
                merged_request = context_manager.merge_with_context(session_id, parsed_request)
                context = context_manager.get_context(session_id)
                missing_fields = context_manager.get_missing_fields(session_id)
                
                # Get recommendations if we have enough info
                bundles = None
                response_message = ""
                
                if not missing_fields:
                    concierge = ConciergeAgent(session)
                    search_params = BundleSearchParams(
                        origin=merged_request.origin,
                        destination=merged_request.destination,
                        city=merged_request.city,
                        max_price=merged_request.budget,
                        tags=merged_request.constraints if merged_request.constraints else None
                    )
                    
                    bundle_list = concierge.recommend_bundles(search_params, limit=3)
                    bundles = [
                        {
                            "id": b.id,
                            "name": b.name,
                            "description": b.description,
                            "total_price": b.total_price,
                            "savings": b.savings,
                            "tags": b.tags.split(",") if b.tags else []
                        }
                        for b in bundle_list
                    ]
                    
                    if bundles:
                        response_message = f"Found {len(bundles)} great deals! Starting at ${min(b['total_price'] for b in bundles):.2f}."
                    else:
                        response_message = "I couldn't find matching deals. Could you provide more details?"
                else:
                    # Need clarification - provide context-aware response
                    known_info = []
                    if context.get('origin'):
                        known_info.append(f"departing from {context['origin']}")
                    if context.get('destination') or context.get('city'):
                        dest = context.get('destination') or context.get('city')
                        known_info.append(f"going to {dest}")
                    if context.get('budget'):
                        known_info.append(f"budget of ${context['budget']:.0f}")
                    
                    if known_info:
                        response_message = f"Great! I have you {' and '.join(known_info)}. "
                    else:
                        response_message = "I'd like to help you find the perfect trip! "
                    
                    # Ask for missing information
                    questions = []
                    if 'origin' in missing_fields:
                        questions.append("Where are you departing from?")
                    if 'destination' in missing_fields:
                        questions.append("Where would you like to go?")
                    if 'budget' in missing_fields:
                        questions.append("What's your budget?")
                    
                    if questions:
                        if len(questions) == 1:
                            response_message += questions[0]
                        else:
                            response_message += "I still need to know: " + ", ".join(questions[:-1]) + ", and " + questions[-1] + "."
                
                # Send response
                response = ChatResponse(
                    message=response_message,
                    parsed_request=merged_request,
                    bundles=bundles,
                    requires_clarification=len(missing_fields) > 0
                )
                
                # Convert to dict and handle datetime serialization
                # Use model_dump with mode='json' for proper serialization
                response_dict = response.model_dump(mode='json')
                await websocket.send_json(response_dict)
            
            except Exception as e:
                # Send error response
                await websocket.send_json({
                    "message": f"Sorry, I encountered an error: {str(e)}",
                    "error": str(e)
                })
            
            finally:
                session.close()
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({
            "error": f"Error processing message: {str(e)}"
        })

