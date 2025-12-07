"""Enhanced Chat Handler - Handles all user interaction scenarios"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List, Dict, Any, Optional
from app.db.session import get_session
from app.services.nlu_parser import NLUParser
from app.services.concierge_agent import ConciergeAgent
from app.services.policy_qa import PolicyQA
from app.services.bundle_summarizer import BundleSummarizer
from app.services.rate_comparator import RateComparator
from app.services.quote_generator import QuoteGenerator
from app.models import FlightDeal, HotelDeal, Bundle, Watch
from app.schemas.chat_schemas import ChatMessage, ChatResponse, ParsedTripRequest
from app.schemas import BundleSearchParams
from app.services.chat_context import context_manager
import re
import uuid
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

nlu_parser = NLUParser()


def _detect_intent(message: str) -> str:
    """Detect user intent from message"""
    message_lower = message.lower()
    
    # Watch creation
    if any(word in message_lower for word in ["track", "watch", "alert", "notify", "monitor"]):
        return "create_watch"
    
    # Rate comparison
    if any(word in message_lower for word in ["is this good", "is this rate good", "good deal", "worth it"]):
        return "rate_comparison"
    
    # Quote/booking
    if any(word in message_lower for word in ["book", "quote", "reserve", "confirm"]):
        return "generate_quote"
    
    # Refinement
    if any(word in message_lower for word in ["make it", "add", "also", "and", "plus"]):
        return "refine"
    
    # Policy question
    policy_keywords = ["refund", "cancel", "pet", "breakfast", "fee", "neighborhood", "alternative"]
    if any(keyword in message_lower for keyword in policy_keywords):
        return "policy_question"
    
    return "search"


@router.post("/message", response_model=ChatResponse)
async def enhanced_chat_message(
    chat_message: ChatMessage,
    session: Session = Depends(get_session)
):
    """
    Enhanced chat endpoint that handles all scenarios:
    1. Tell me what I should book - generates 2-3 bundle summaries
    2. Refine without starting over - preserves context, highlights changes
    3. Keep an eye on it - creates watches with price/inventory thresholds
    4. Decide with confidence - compares rates with historical data
    5. Book or hand off - generates complete quotes
    """
    try:
        session_id = chat_message.session_id or str(uuid.uuid4())
        message = chat_message.message
        user_id = chat_message.user_id or 1
        
        # Detect intent
        intent = _detect_intent(message)
        context = context_manager.get_context(session_id)
        
        # Handle different intents
        if intent == "create_watch":
            return await _handle_watch_creation(message, user_id, session, context)
        
        elif intent == "rate_comparison":
            return await _handle_rate_comparison(message, session, context)
        
        elif intent == "generate_quote":
            return await _handle_quote_generation(message, session, context)
        
        elif intent == "refine":
            return await _handle_refinement(message, session_id, session, context)
        
        elif intent == "policy_question":
            policy_qa = PolicyQA(session)
            bundle_id = context.get('last_bundle_id')
            answer = policy_qa.answer_question(message, bundle_id=bundle_id)
            return ChatResponse(
                message=answer["answer"],
                parsed_request=None,
                bundles=None,
                requires_clarification=False
            )
        
        else:  # search
            return await _handle_search(message, session_id, session, context, user_id)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


async def _handle_search(
    message: str,
    session_id: str,
    session: Session,
    context: Dict[str, Any],
    user_id: int
) -> ChatResponse:
    """Handle initial search - generate 2-3 bundle summaries"""
    parsed = nlu_parser.parse(message)
    parsed_request = ParsedTripRequest(**parsed)
    
    # Merge with context
    merged_request = context_manager.merge_with_context(session_id, parsed_request)
    missing_fields = context_manager.get_missing_fields(session_id)
    
    if missing_fields:
        # Need clarification
        questions = []
        if 'origin' in missing_fields:
            questions.append("Where are you departing from?")
        if 'destination' in missing_fields:
            questions.append("Where would you like to go?")
        if 'budget' in missing_fields:
            questions.append("What's your budget?")
        
        return ChatResponse(
            message=f"I need a bit more info: {', '.join(questions)}",
            parsed_request=merged_request,
            requires_clarification=True,
            clarification_questions=questions
        )
    
    # Extract dates from parsed request
    start_date = None
    end_date = None
    if merged_request.dates and merged_request.dates.get('start'):
        try:
            from datetime import datetime
            start_date = datetime.fromisoformat(merged_request.dates['start'])
        except:
            pass
    if merged_request.dates and merged_request.dates.get('end'):
        try:
            from datetime import datetime
            end_date = datetime.fromisoformat(merged_request.dates['end'])
        except:
            pass
    
    # Get bundles
    concierge = ConciergeAgent(session)
    search_params = BundleSearchParams(
        origin=merged_request.origin,
        destination=merged_request.destination,
        city=merged_request.city,
        max_price=merged_request.budget,
        tags=merged_request.constraints if merged_request.constraints else None,
        start_date=start_date,
        end_date=end_date
    )
    
    bundle_list = concierge.recommend_bundles(search_params, limit=3)
    
    if not bundle_list:
        return ChatResponse(
            message="I couldn't find bundles matching your criteria. Would you like me to set up a watch?",
            parsed_request=merged_request,
            bundles=None
        )
    
    # Generate summaries
    summarizer = BundleSummarizer(session)
    summaries = []
    flights_map = {}
    hotels_map = {}
    
    for bundle in bundle_list:
        # Load flights and hotels
        flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id] if bundle.flight_deal_ids else []
        hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id] if bundle.hotel_deal_ids else []
        
        flights = [session.get(FlightDeal, fid) for fid in flight_ids if fid]
        hotels = [session.get(HotelDeal, hid) for hid in hotel_ids if hid]
        flights = [f for f in flights if f]
        hotels = [h for h in hotels if h]
        
        flights_map[bundle.id] = flights
        hotels_map[bundle.id] = hotels
        
        summary = summarizer.generate_bundle_summary(bundle, flights, hotels)
        summaries.append(summary)
    
    # Format response
    response_parts = [f"I found {len(summaries)} great options for you:\n"]
    
    for i, summary in enumerate(summaries, 1):
        response_parts.append(f"\n**Option {i}: {summary['name']}**")
        response_parts.append(f"💰 Price: ${summary['price']['total']:.2f} total (${summary['price']['per_person']:.2f}/person)")
        if summary['travel_time']:
            response_parts.append(f"⏱️ Travel time: {summary['travel_time']}")
        if summary['hotel_neighborhood']['name']:
            response_parts.append(f"📍 Hotel: {summary['hotel_neighborhood']['name']} - {summary['hotel_neighborhood']['description']}")
        if summary['cancellation_terms']['refundable']:
            response_parts.append(f"✅ Cancellation: Free cancellation available")
        else:
            response_parts.append(f"⚠️ Cancellation: Terms vary")
        response_parts.append(f"💡 Why this works: {summary['why_this_pick']}")
    
    # Store in context
    context['last_bundles'] = [s['bundle_id'] for s in summaries]
    context['last_bundle_id'] = summaries[0]['bundle_id'] if summaries else None
    context['flights_map'] = {bundle.id: flights_map.get(bundle.id, []) for bundle in bundle_list}
    context['hotels_map'] = {bundle.id: hotels_map.get(bundle.id, []) for bundle in bundle_list}
    
    bundles_data = [{
        "id": s['bundle_id'],
        "name": s['name'],
        "total_price": s['price']['total'],
        "summary": s
    } for s in summaries]
    
    return ChatResponse(
        message="\n".join(response_parts),
        parsed_request=merged_request,
        bundles=bundles_data,
        requires_clarification=False
    )


async def _handle_refinement(
    message: str,
    session_id: str,
    session: Session,
    context: Dict[str, Any]
) -> ChatResponse:
    """Handle refinement - preserve context, regenerate, highlight changes"""
    # Get previous bundles for comparison
    previous_bundles = context.get('last_bundles', [])
    previous_flights = context.get('flights_map', {})
    previous_hotels = context.get('hotels_map', {})
    
    # Parse new constraints
    parsed = nlu_parser.parse(message)
    parsed_request = ParsedTripRequest(**parsed)
    
    # Merge with existing context (preserves origin, destination, budget, dates)
    merged_request = context_manager.merge_with_context(session_id, parsed_request)
    
    # Get updated bundles
    concierge = ConciergeAgent(session)
    search_params = BundleSearchParams(
        origin=merged_request.origin,
        destination=merged_request.destination,
        city=merged_request.city,
        max_price=merged_request.budget,
        tags=merged_request.constraints if merged_request.constraints else None
    )
    
    bundle_list = concierge.recommend_bundles(search_params, limit=3)
    
    if not bundle_list:
        return ChatResponse(
            message="I couldn't find bundles with the new constraints. Would you like to adjust your search?",
            parsed_request=merged_request
        )
    
    # Generate summaries and compare
    summarizer = BundleSummarizer(session)
    summaries = []
    changes = []
    
    for bundle in bundle_list:
        flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id] if bundle.flight_deal_ids else []
        hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id] if bundle.hotel_deal_ids else []
        
        flights = [session.get(FlightDeal, fid) for fid in flight_ids if fid]
        hotels = [session.get(HotelDeal, hid) for hid in hotel_ids if hid]
        flights = [f for f in flights if f]
        hotels = [h for h in hotels if h]
        
        summary = summarizer.generate_bundle_summary(bundle, flights, hotels)
        summaries.append(summary)
        
        # Compare with previous (if available)
        if previous_bundles and bundle.id in previous_bundles:
            prev_idx = previous_bundles.index(bundle.id)
            # Could compare prices, times, etc.
            pass
    
    # Highlight what changed (per specification: "+ $38, earlier departure, 20-minute longer connection")
    new_constraints = parsed_request.constraints or []
    old_constraints = context.get('constraints', [])
    added_constraints = [c for c in new_constraints if c not in old_constraints]
    
    # Compare prices with previous bundles
    previous_price = context.get('last_bundle_price')
    price_changes = []
    
    response_parts = [f"Updated options with your new preferences:\n"]
    if added_constraints:
        response_parts.append(f"✅ Added: {', '.join(added_constraints)}\n")
    
    for i, summary in enumerate(summaries, 1):
        current_price = summary['price']['total']
        change_info = []
        
        # Calculate price change
        if previous_price:
            price_diff = current_price - previous_price
            if abs(price_diff) > 1:  # Only show if significant
                if price_diff > 0:
                    change_info.append(f"+ ${price_diff:.0f}")
                else:
                    change_info.append(f"- ${abs(price_diff):.0f}")
        
        # Check for flight time changes (if we had previous flights)
        if previous_flights and flights:
            prev_flight = previous_flights.get(bundle_list[0].id, [])
            if prev_flight and flights:
                prev_dep = prev_flight[0].departure_time if prev_flight else None
                curr_dep = flights[0].departure_time if flights else None
                if prev_dep and curr_dep:
                    # Compare departure times
                    if curr_dep < prev_dep:
                        change_info.append("earlier departure")
                    elif curr_dep > prev_dep:
                        change_info.append("later departure")
        
        # Check for connection changes (if multiple flights)
        if len(flights) > 1 and previous_flights:
            prev_flight_count = len(previous_flights.get(bundle_list[0].id, []))
            if prev_flight_count == 1 and len(flights) > 1:
                change_info.append("now includes connection")
            elif prev_flight_count > 1 and len(flights) == 1:
                change_info.append("now direct flight")
        
        response_parts.append(f"\n**Option {i}: {summary['name']}**")
        response_parts.append(f"💰 ${current_price:.2f} total")
        if change_info:
            response_parts.append(f"📊 Changes: {', '.join(change_info)}")
        response_parts.append(f"💡 {summary['why_this_pick']}")
    
    # Update context
    context['last_bundles'] = [s['bundle_id'] for s in summaries]
    context['last_bundle_id'] = summaries[0]['bundle_id'] if summaries else None
    context['constraints'] = new_constraints
    
    return ChatResponse(
        message="\n".join(response_parts),
        parsed_request=merged_request,
        bundles=[{"id": s['bundle_id'], "name": s['name'], "total_price": s['price']['total']} for s in summaries]
    )


async def _handle_watch_creation(
    message: str,
    user_id: int,
    session: Session,
    context: Dict[str, Any]
) -> ChatResponse:
    """Handle watch creation with price and inventory thresholds"""
    # Extract bundle ID, price threshold, inventory threshold
    bundle_id = context.get('last_bundle_id')
    
    # Parse price threshold
    price_match = re.search(r'\$?(\d+)', message)
    price_threshold = float(price_match.group(1)) if price_match else None
    
    # Parse inventory threshold
    inv_match = re.search(r'(\d+)\s*(?:rooms?|inventory)', message, re.IGNORECASE)
    inventory_threshold = int(inv_match.group(1)) if inv_match else None
    
    if not bundle_id:
        return ChatResponse(
            message="I need to know which bundle to track. Please select a bundle first.",
            requires_clarification=True
        )
    
    bundle = session.get(Bundle, bundle_id)
    if not bundle:
        return ChatResponse(
            message="Bundle not found. Please search for bundles first.",
            requires_clarification=True
        )
    
    # Create watch
    watch = Watch(
        user_id=user_id,
        bundle_id=bundle_id,
        max_price=price_threshold or bundle.total_price * 0.9,  # 10% below current
        min_inventory=inventory_threshold or 5,
        active=True
    )
    
    session.add(watch)
    session.commit()
    session.refresh(watch)
    
    response = f"✅ Watch created! I'll alert you if:\n"
    if price_threshold:
        response += f"  • Price drops below ${price_threshold:.2f}\n"
    if inventory_threshold:
        response += f"  • Inventory drops below {inventory_threshold} rooms\n"
    response += f"\nYou'll receive notifications via WebSocket when these conditions are met."
    
    return ChatResponse(
        message=response,
        bundles=None
    )


async def _handle_rate_comparison(
    message: str,
    session: Session,
    context: Dict[str, Any]
) -> ChatResponse:
    """Handle rate comparison questions"""
    bundle_id = context.get('last_bundle_id')
    
    if not bundle_id:
        return ChatResponse(
            message="Which rate would you like me to check? Please select a bundle first.",
            requires_clarification=True
        )
    
    bundle = session.get(Bundle, bundle_id)
    if not bundle:
        return ChatResponse(
            message="Bundle not found.",
            requires_clarification=True
        )
    
    # Get hotel from bundle
    hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id] if bundle.hotel_deal_ids else []
    if not hotel_ids:
        return ChatResponse(
            message="No hotel found in this bundle for comparison.",
            requires_clarification=True
        )
    
    hotel = session.get(HotelDeal, hotel_ids[0])
    if not hotel:
        return ChatResponse(
            message="Hotel not found.",
            requires_clarification=True
        )
    
    # Compare rate
    comparator = RateComparator(session)
    comparison = comparator.is_rate_good(hotel, days=60)
    
    response = f"📊 Rate Analysis for {hotel.name}:\n\n"
    response += f"{comparison['explanation']}\n\n"
    
    if comparison['alternatives']:
        response += "Similar options nearby:\n"
        for alt in comparison['alternatives'][:3]:
            price_diff = alt['price_diff']
            sign = "+" if price_diff > 0 else ""
            response += f"  • {alt['name']}: ${alt['price_per_night']:.2f}/night ({sign}${abs(price_diff):.2f})\n"
    
    return ChatResponse(
        message=response,
        bundles=None
    )


async def _handle_quote_generation(
    message: str,
    session: Session,
    context: Dict[str, Any]
) -> ChatResponse:
    """Handle quote generation for booking"""
    bundle_id = context.get('last_bundle_id')
    
    if not bundle_id:
        return ChatResponse(
            message="Which bundle would you like a quote for? Please select a bundle first.",
            requires_clarification=True
        )
    
    bundle = session.get(Bundle, bundle_id)
    if not bundle:
        return ChatResponse(
            message="Bundle not found.",
            requires_clarification=True
        )
    
    # Generate quote
    quote_gen = QuoteGenerator(session)
    flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id] if bundle.flight_deal_ids else []
    hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id] if bundle.hotel_deal_ids else []
    
    flights = [session.get(FlightDeal, fid) for fid in flight_ids if fid]
    hotels = [session.get(HotelDeal, hid) for hid in hotel_ids if hid]
    flights = [f for f in flights if f]
    hotels = [h for h in hotels if h]
    
    quote = quote_gen.generate_quote(bundle, flights, hotels, travelers=2)
    
    # Format quote response
    response_parts = [
        f"📋 Complete Quote: {quote['bundle_name']}\n",
        f"Quote ID: {quote['quote_id']}\n",
        f"Valid until: {quote['valid_until']}\n\n",
        "**Pricing:**",
        f"  Subtotal: ${quote['pricing']['subtotal']:.2f}",
        f"  Taxes & Fees: ${quote['pricing']['taxes_and_fees']:.2f}",
        f"  Total: ${quote['pricing']['total']:.2f}",
        f"  Savings: ${quote['pricing']['savings']:.2f}\n",
        "**Flights:**"
    ]
    
    for flight in quote['flights']:
        response_parts.append(f"  {flight['airline']} {flight['flight_number']}: {flight['route']}")
        response_parts.append(f"    Fare class: {flight['fare_class']}")
        response_parts.append(f"    Price: ${flight['price']:.2f}")
        response_parts.append(f"    Refundable: {'Yes' if flight['refundable'] else 'Check policy'}\n")
    
    response_parts.append("**Hotels:**")
    for hotel in quote['hotels']:
        response_parts.append(f"  {hotel['name']}, {hotel['city']}")
        response_parts.append(f"    ${hotel['price_per_night']:.2f}/night × {hotel['nights']} nights = ${hotel['total']:.2f}")
        response_parts.append(f"    Refundable: {'Yes' if hotel['refundable'] else 'Check policy'}\n")
    
    response_parts.append("**Terms:**")
    response_parts.append(f"  Cancellation: {quote['terms']['cancellation']['flight_cancellation']}")
    response_parts.append(f"  Baggage: {quote['terms']['baggage']['included']}")
    response_parts.append(f"  Check-in: {quote['terms']['check_in']}")
    response_parts.append(f"  Check-out: {quote['terms']['check_out']}\n")
    
    response_parts.append("**Estimated Additional Fees:**")
    response_parts.append(f"  ${quote['fees']['estimated_total_fees']:.2f} (baggage, resort fees, etc.)\n")
    
    response_parts.append("✅ This quote is ready for booking. Proceed to partner booking flow.")
    
    return ChatResponse(
        message="\n".join(response_parts),
        bundles=[{"id": bundle_id, "quote": quote}]
    )

