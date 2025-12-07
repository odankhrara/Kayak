"""Chat API endpoints for AI chatbot"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session
from typing import List, Dict, Any
from app.db.session import get_session
from app.services.nlu_parser import NLUParser
from app.services.concierge_agent import ConciergeAgent
from app.services.policy_qa import PolicyQA
from app.services.bundle_summarizer import BundleSummarizer
from app.services.rate_comparator import RateComparator
from app.services.quote_generator import QuoteGenerator
from app.models import FlightDeal, HotelDeal, Bundle, Watch
from app.schemas.chat_schemas import (
    ChatMessage,
    ChatResponse,
    ParsedTripRequest,
    ChatContext
)
from app.schemas import BundleSearchParams
from app.services.chat_context import context_manager
import json
import re
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
        user_id = chat_message.user_id or 1
        message = chat_message.message
        message_lower = message.lower()
        
        # Get context
        context = context_manager.get_context(session_id)
        
        # Handle simple follow-up responses
        if message_lower in ['yes', 'yep', 'yeah', 'ok', 'okay', 'sure']:
            # Check if we were asking for clarification
            if context.get('awaiting_clarification'):
                # User is confirming they want to provide details
                return ChatResponse(
                    message="Great! Please provide the details I need. For example: 'I want to go to Miami from SFO, budget $1000 for 2 people, dates Oct 25-27'",
                    requires_clarification=True,
                    clarification_questions=["Where are you departing from?", "Where would you like to go?", "What's your budget?"]
                )
            # Check if we were asking about watch creation
            if context.get('awaiting_watch_confirmation'):
                # Create watch with stored parameters
                bundle_id = context.get('watch_bundle_id')
                price_threshold = context.get('watch_price_threshold')
                inventory_threshold = context.get('watch_inventory_threshold')
                
                if bundle_id:
                    bundle = session.get(Bundle, bundle_id)
                    if bundle:
                        watch = Watch(
                            user_id=user_id,
                            bundle_id=bundle_id,
                            max_price=price_threshold or bundle.total_price * 0.9,
                            min_inventory=inventory_threshold or 5,
                            active=True
                        )
                        session.add(watch)
                        session.commit()
                        session.refresh(watch)
                        
                        # Clear context flags
                        context.pop('awaiting_watch_confirmation', None)
                        context.pop('watch_bundle_id', None)
                        context.pop('watch_price_threshold', None)
                        context.pop('watch_inventory_threshold', None)
                        
                        response = f"✅ Watch created! I'll alert you if:\n"
                        if price_threshold:
                            response += f"  • Price drops below ${price_threshold:.2f}\n"
                        if inventory_threshold:
                            response += f"  • Inventory drops below {inventory_threshold} rooms\n"
                        response += f"\nYou'll receive notifications via WebSocket when these conditions are met."
                        
                        return ChatResponse(message=response, bundles=None)
        
        # Check if this is a watch creation request
        is_watch_request = any(word in message_lower for word in ['track', 'watch', 'alert', 'notify', 'monitor', 'keep an eye'])
        if is_watch_request:
            # Extract price and inventory thresholds
            price_match = re.search(r'\$?(\d+)', message)
            price_threshold = float(price_match.group(1)) if price_match else None
            
            inv_match = re.search(r'(\d+)\s*(?:rooms?|inventory)', message_lower)
            inventory_threshold = int(inv_match.group(1)) if inv_match else None
            
            # Try to find bundle from context or message
            bundle_id = context.get('last_bundle_id')
            
            # If no bundle in context, try to find by city name
            if not bundle_id:
                city_match = re.search(r'\b(miami|tokyo|new york|nyc|los angeles|la|chicago|san francisco|sf)\b', message_lower)
                if city_match:
                    city = city_match.group(1)
                    # Search for bundles with this city
                    from sqlmodel import select
                    statement = select(Bundle).where(Bundle.is_active == True).limit(10)
                    bundles = list(session.exec(statement).all())
                    for b in bundles:
                        if b.hotel_deal_ids:
                            hotel_ids = [int(id) for id in b.hotel_deal_ids.split(",") if id]
                            for hid in hotel_ids:
                                hotel = session.get(HotelDeal, hid)
                                if hotel and city.lower() in hotel.city.lower() if hotel.city else False:
                                    bundle_id = b.id
                                    break
                        if bundle_id:
                            break
            
            if bundle_id:
                bundle = session.get(Bundle, bundle_id)
                if bundle:
                    watch = Watch(
                        user_id=user_id,
                        bundle_id=bundle_id,
                        max_price=price_threshold or bundle.total_price * 0.9,
                        min_inventory=inventory_threshold or 5,
                        active=True
                    )
                    session.add(watch)
                    session.commit()
                    session.refresh(watch)
                    
                    response = f"✅ Watch created for {bundle.name}!\n"
                    response += f"I'll alert you if:\n"
                    if price_threshold:
                        response += f"  • Price drops below ${price_threshold:.2f}\n"
                    else:
                        response += f"  • Price drops below ${bundle.total_price * 0.9:.2f} (10% off)\n"
                    if inventory_threshold:
                        response += f"  • Inventory drops below {inventory_threshold} rooms\n"
                    else:
                        response += f"  • Inventory drops below 5 rooms\n"
                    response += f"\nYou'll receive notifications via WebSocket when these conditions are met."
                    
                    return ChatResponse(message=response, bundles=None)
            else:
                # No bundle found, ask user to select one first
                context['awaiting_watch_confirmation'] = True
                context['watch_price_threshold'] = price_threshold
                context['watch_inventory_threshold'] = inventory_threshold
                return ChatResponse(
                    message="I need to know which package to track. Please search for bundles first, then I can set up a watch. For example: 'I want to go to Miami from SFO, budget $1000'",
                    requires_clarification=True
                )
        
        # Check if this is a refinement query (follow-up to previous search)
        is_refinement = any(word in message_lower for word in ['what about', 'how about', 'also', 'add', 'make it', 'change', 'instead', 'near', 'with'])
        has_context = context and (context.get('origin') or context.get('destination') or context.get('budget'))
        
        # Check if this is a policy/logistics question (skip for search queries)
        # Only treat as policy question if it's clearly a question, not a search request
        is_search_query = any(word in message_lower for word in ['find', 'search', 'show', 'book', 'trip', 'weekend', 'vacation', 'go to', 'departure', 'from'])
        is_policy_question = not is_search_query and not is_refinement and (
            any(
                keyword in message_lower 
                for keywords in PolicyQA(session).POLICY_KEYWORDS.values() 
                for keyword in keywords
            ) or (any(
                q_word in message_lower 
                for q_word in ['what', 'how', 'when', 'where', 'why', 'is', 'does', 'can', 'do']
            ) and not is_watch_request)
        )
        
        # If it's a policy question, answer it directly (with timeout)
        if is_policy_question:
            try:
                # Try to get bundle/flight/hotel from context
                context = context_manager.get_context(session_id)
                bundle_id = context.get('last_bundle_id') if context else None
                
                policy_qa = PolicyQA(session)
                answer = policy_qa.answer_question(
                    chat_message.message,
                    bundle_id=bundle_id
                )
                
                return ChatResponse(
                    message=answer["answer"],
                    parsed_request=None,
                    bundles=None,
                    requires_clarification=False,
                    clarification_questions=[]
                )
            except Exception as e:
                # If policy QA fails, continue with search
                print(f"[Chat] Policy QA error: {e}, continuing with search")
        
        # Get context first to help with parsing
        context = context_manager.get_context(session_id)
        missing_fields = context_manager.get_missing_fields(session_id)
        
        # Add missing fields to context for parser
        context['_missing_fields'] = missing_fields
        
        # Parse the natural language message with context
        parsed = nlu_parser.parse(message, context=context)
        parsed_request = ParsedTripRequest(**parsed)
        
        # Merge with existing context
        merged_request = context_manager.merge_with_context(session_id, parsed_request)
        
        # Re-check what we have and what's missing after merge
        missing_fields = context_manager.get_missing_fields(session_id)
        context = context_manager.get_context(session_id)
        
        # Mark if we're awaiting clarification
        if missing_fields:
            context['awaiting_clarification'] = True
        else:
            context.pop('awaiting_clarification', None)
        
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
            
            # Clean up destination - remove "from" if accidentally captured
            destination = search_request.destination
            if destination and 'from' in destination.lower():
                destination = destination.lower().split('from')[0].strip().title()
            
            city = search_request.city
            if city and 'from' in city.lower():
                city = city.lower().split('from')[0].strip().title()
            
            # Validate origin and destination are different
            origin = search_request.origin
            if origin and destination:
                # Normalize to uppercase for comparison
                origin_upper = origin.upper().strip()
                dest_upper = destination.upper().strip()
                
                # Map city names to airport codes for comparison
                city_to_code = {
                    'MUMBAI': 'BOM', 'BOMBAY': 'BOM',
                    'DELHI': 'DEL', 'NEW DELHI': 'DEL',
                    'TOKYO': 'NRT', 'NRT': 'NRT', 'HND': 'HND',
                    'NEW YORK': 'JFK', 'NYC': 'JFK',
                    'LOS ANGELES': 'LAX', 'LA': 'LAX',
                    'MIAMI': 'MIA',
                    'SAN FRANCISCO': 'SFO', 'SF': 'SFO',
                    'CHICAGO': 'ORD',
                }
                
                origin_code = city_to_code.get(origin_upper, origin_upper)
                dest_code = city_to_code.get(dest_upper, dest_upper)
                
                if origin_code == dest_code:
                    return ChatResponse(
                        message=f"I notice you mentioned {origin} for both origin and destination. Please specify different airports. For example: 'Find flights from {origin} to Delhi' or 'BOM to DEL'.",
                        parsed_request=parsed_request,
                        bundles=None,
                        requires_clarification=True,
                        clarification_questions=["Where would you like to go?"]
                    )
            
            # Convert merged request to search params
            # For refinements, add a helpful message
            refinement_msg = ""
            if is_refinement and has_context and parsed_request.constraints:
                constraint_names = [c.replace('-', ' ') for c in parsed_request.constraints]
                refinement_msg = f"I've updated your search to include: {', '.join(constraint_names)}. "
            
            search_params = BundleSearchParams(
                origin=search_request.origin,
                destination=destination,
                city=city or destination,
                max_price=search_request.budget,
                tags=search_request.constraints if search_request.constraints else None
            )
            
            # Get bundles (this will create them if deals exist)
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
            
            # Generate response message with tradeoff explanations
            if bundles:
                response_message = refinement_msg if refinement_msg else ""
                response_message += f"I found {len(bundles)} great deals for you! "
                response_message += f"Here are bundles starting at ${min(b['total_price'] for b in bundles):.2f}. "
                
                # Add tradeoff explanation for the first bundle
                if bundles:
                    first_bundle = bundle_list[0]
                    # Get flights and hotels for explanation
                    flight_ids = [int(id) for id in first_bundle.flight_deal_ids.split(",") if id] if first_bundle.flight_deal_ids else []
                    hotel_ids = [int(id) for id in first_bundle.hotel_deal_ids.split(",") if id] if first_bundle.hotel_deal_ids else []
                    
                    bundle_flights = [session.get(FlightDeal, fid) for fid in flight_ids if fid]
                    bundle_hotels = [session.get(HotelDeal, hid) for hid in hotel_ids if hid]
                    bundle_flights = [f for f in bundle_flights if f]
                    bundle_hotels = [h for h in bundle_hotels if h]
                    
                    # Generate explanation with user context for adaptive reasoning
                    concierge = ConciergeAgent(session)
                    explanation = concierge.explain_tradeoffs(
                        first_bundle, bundle_flights, bundle_hotels, bundle_list[:3],
                        user_context=context
                    )
                    response_message += f"\n\n**Why I recommend this:**\n{explanation}"
                    
                    # Store bundle ID in context for policy questions
                    context_manager.get_context(session_id)['last_bundle_id'] = first_bundle.id
                    
                    # Update proactive concierge with user preferences for future recommendations
                    try:
                        from app.services.proactive_concierge import ProactiveConcierge
                        from app.db.session import get_session
                        proactive_session_gen = get_session()
                        proactive_session = next(proactive_session_gen)
                        proactive_concierge = ProactiveConcierge(proactive_session)
                        proactive_concierge.update_user_preferences(user_id, context)
                    except Exception as e:
                        print(f"[Chat] Error updating proactive concierge: {e}")
                
                response_message += "\n\nWould you like to see more details, ask about policies (refunds, pets, breakfast, etc.), or set up a price watch?"
            else:
                # No bundles found - provide helpful guidance
                response_message = "I couldn't find any bundles matching your criteria right now. "
                
                # Check if we have partial information
                if search_request.origin or search_request.destination or search_request.city:
                    response_message += f"\n\nI have: "
                    info_parts = []
                    if search_request.origin:
                        info_parts.append(f"origin: {search_request.origin}")
                    if search_request.destination or search_request.city:
                        dest = search_request.destination or search_request.city
                        info_parts.append(f"destination: {dest}")
                    if search_request.budget:
                        info_parts.append(f"budget: ${search_request.budget:.0f}")
                    response_message += ", ".join(info_parts)
                    response_message += "\n\nWould you like to:\n"
                    response_message += "1. Adjust your search criteria?\n"
                    response_message += "2. Set up a watch to be notified when deals become available?\n"
                    response_message += "3. Try a different destination or dates?"
                else:
                    response_message += "Please provide more details about your trip. For example:\n"
                    response_message += "- 'I want to go to Miami from SFO, budget $1000 for 2 people, dates Oct 25-27'\n"
                    response_message += "- 'Weekend trip to Tokyo under $900, pet-friendly'"
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
                # Process message with timeout protection
                print(f"[WebSocket] Received message: {chat_message.message[:50]}...")
                parsed = nlu_parser.parse(chat_message.message)
                print(f"[WebSocket] Parsed request: origin={parsed.get('origin')}, destination={parsed.get('destination')}")
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
                    
                    # Generate response message with explanations
                    if bundles:
                        response_message = f"I found {len(bundles)} great deals for you! "
                        response_message += f"Here are bundles starting at ${min(b['total_price'] for b in bundles):.2f}. "
                        
                        # Add explanation for first bundle (adaptive reasoning)
                        if bundle_list:
                            first_bundle = bundle_list[0]
                            flight_ids = [int(id) for id in first_bundle.flight_deal_ids.split(",") if id] if first_bundle.flight_deal_ids else []
                            hotel_ids = [int(id) for id in first_bundle.hotel_deal_ids.split(",") if id] if first_bundle.hotel_deal_ids else []
                            
                            bundle_flights = [session.get(FlightDeal, fid) for fid in flight_ids if fid]
                            bundle_hotels = [session.get(HotelDeal, hid) for hid in hotel_ids if hid]
                            bundle_flights = [f for f in bundle_flights if f]
                            bundle_hotels = [h for h in bundle_hotels if h]
                            
                            concierge = ConciergeAgent(session)
                            explanation = concierge.explain_tradeoffs(
                                first_bundle, bundle_flights, bundle_hotels, bundle_list[:3],
                                user_context=context
                            )
                            response_message += f"\n\n**Why I recommend this:**\n{explanation}"
                            
                            # Store bundle ID in context for policy questions
                            context_manager.get_context(session_id)['last_bundle_id'] = first_bundle.id
                            
                            # Update proactive concierge with user preferences for future recommendations
                            try:
                                from app.services.proactive_concierge import ProactiveConcierge
                                from app.db.session import get_session
                                session_gen = get_session()
                                proactive_session = next(session_gen)
                                proactive_concierge = ProactiveConcierge(proactive_session, check_interval_minutes=2)
                                proactive_concierge.update_user_preferences(user_id, context)
                            except Exception as e:
                                print(f"[WebSocket] Error updating proactive concierge: {e}")
                        
                        response_message += "\n\nWould you like to see more details, ask about policies (refunds, pets, breakfast, etc.), or set up a price watch?"
                    else:
                        response_message = "I couldn't find matching deals. Would you like me to set up a watch to notify you when deals become available?"
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
                # Send error response with detailed logging
                import traceback
                error_trace = traceback.format_exc()
                print(f"[WebSocket] Error processing message: {e}")
                print(f"[WebSocket] Traceback: {error_trace}")
                await websocket.send_json({
                    "message": f"Sorry, I encountered an error processing your request. Please try again.",
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

