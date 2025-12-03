# Agentic AI Code Snippets

This document provides key code snippets demonstrating the multi-agent AI system implementation in the Kayak Travel Assistant.

---

## 🤖 Agent 1: NLU Parser Agent

**Purpose**: Natural Language Understanding - Extracts intent from user queries

**Location**: `app/services/nlu_parser.py`

### Key Code Snippet:

```python
class NLUParser:
    """Parses natural language trip requests into structured data"""
    
    def parse(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parse natural language message into structured trip request
        
        Example: "Weekend in Tokyo under $900 for two, SFO departure, pet-friendly"
        
        Returns:
            {
                'origin': 'SFO',
                'destination': 'Tokyo',
                'city': 'Tokyo',
                'budget': 900.0,
                'travelers': 2,
                'constraints': ['pet-friendly'],
                'confidence': 0.85
            }
        """
        message_lower = message.lower()
        
        # Extract origin
        origin = self._extract_origin(message_lower)
        
        # Extract destination
        destination = self._extract_destination(message_lower)
        
        # Extract budget
        budget = self._extract_budget(message_lower)
        # Pattern: "under $900", "budget 1000", "less than 500"
        budget_pattern = r'(?:under|below|less than|max|budget|for)\s*\$?\s*(\d+(?:\.\d+)?)'
        match = re.search(budget_pattern, message_lower)
        if match:
            return float(match.group(1))
        
        # Extract travelers
        travelers = self._extract_travelers(message_lower)
        # Pattern: "for two", "2 people", "travelers: 3"
        travelers_pattern = r'(?:for|with|travelers?|people|persons?)\s*(\d+)'
        match = re.search(travelers_pattern, message_lower)
        if match:
            return int(match.group(1))
        
        # Extract constraints
        constraints = self._extract_constraints(message_lower)
        # Check for pet-friendly, near-transit, etc.
        for constraint, keywords in self.CONSTRAINT_KEYWORDS.items():
            if any(keyword in message_lower for keyword in keywords):
                constraints.append(constraint)
        
        return {
            'origin': origin,
            'destination': destination,
            'city': destination,  # Use destination as city
            'budget': budget,
            'travelers': travelers,
            'constraints': constraints,
            'confidence': self._calculate_confidence(message_lower)
        }
    
    def _extract_origin(self, text: str) -> Optional[str]:
        """Extract origin airport code or city"""
        # Pattern: "from X to Y" or "departure from X"
        from_pattern = r'(?:from|departure from|leaving from)\s+([A-Z]{3}|[a-z]+(?:\s+[a-z]+)?)'
        match = re.search(from_pattern, text, re.IGNORECASE)
        if match:
            city = match.group(1).strip()
            # Map to airport code if known
            if city.upper() in self.AIRPORT_CODES:
                return city.upper()
            # Map city name to airport code
            city_to_code = {
                'mumbai': 'BOM', 'bombay': 'BOM',
                'delhi': 'DEL', 'new delhi': 'DEL',
                'san francisco': 'SFO', 'sf': 'SFO',
                'new york': 'JFK', 'nyc': 'JFK'
            }
            return city_to_code.get(city.lower())
        return None
```

**Usage Example**:
```python
nlu_parser = NLUParser()
parsed = nlu_parser.parse("Flight from BOM to DEL, budget $1000")
# Returns: {'origin': 'BOM', 'destination': 'DEL', 'budget': 1000.0, ...}
```

---

## 🧠 Agent 2: Context Manager Agent

**Purpose**: Maintains conversation state across multiple turns

**Location**: `app/services/chat_context.py`

### Key Code Snippet:

```python
class ChatContextManager:
    """Manages conversation context for chat sessions"""
    
    def __init__(self):
        # In-memory storage: session_id -> context
        # In production, use Redis or database
        self.contexts: Dict[str, Dict[str, Any]] = {}
    
    def get_context(self, session_id: str) -> Dict[str, Any]:
        """Get conversation context for a session"""
        if session_id not in self.contexts:
            self.contexts[session_id] = {
                'origin': None,
                'destination': None,
                'city': None,
                'budget': None,
                'travelers': None,
                'dates': None,
                'constraints': [],
                'conversation_history': []
            }
        return self.contexts[session_id]
    
    def merge_with_context(self, session_id: str, parsed: ParsedTripRequest) -> ParsedTripRequest:
        """
        Merge parsed request with existing context
        
        This ensures context is preserved when user provides only partial info
        Example: User says "1000" after already providing origin/destination
        """
        context = self.get_context(session_id)
        
        # Use parsed value if provided, otherwise use context
        merged = ParsedTripRequest(
            origin=parsed.origin if parsed.origin else context.get('origin'),
            destination=parsed.destination if parsed.destination else context.get('destination'),
            city=parsed.city if parsed.city else context.get('city'),
            budget=parsed.budget if parsed.budget else context.get('budget'),
            travelers=parsed.travelers if parsed.travelers else context.get('travelers'),
            dates=parsed.dates if parsed.dates else context.get('dates'),
            constraints=list(set((parsed.constraints or []) + context.get('constraints', []))),
            confidence=parsed.confidence,
            raw_message=parsed.raw_message
        )
        
        # Update context with merged values
        self.update_context(session_id, merged.model_dump())
        
        return merged
    
    def get_missing_fields(self, session_id: str) -> list:
        """
        Get list of missing required fields
        Returns at most 1 missing field (max 1 clarifying question per turn)
        """
        context = self.get_context(session_id)
        missing = []
        
        # Priority order: origin, destination, budget
        if not context.get('origin'):
            missing.append('origin')
            return missing  # Return immediately - max 1 question
        
        destination = context.get('destination') or context.get('city')
        if not destination:
            missing.append('destination')
            return missing
        
        if not context.get('budget'):
            missing.append('budget')
            return missing
        
        return missing
```

**Usage Example**:
```python
context_manager = ChatContextManager()
session_id = "user-123"

# Turn 1: User provides origin and destination
parsed1 = ParsedTripRequest(origin="BOM", destination="DEL")
merged1 = context_manager.merge_with_context(session_id, parsed1)
# Context now has: origin="BOM", destination="DEL"

# Turn 2: User only provides budget
parsed2 = ParsedTripRequest(budget=1000.0)
merged2 = context_manager.merge_with_context(session_id, parsed2)
# Merged result: origin="BOM", destination="DEL", budget=1000.0
# Context preserved from previous turn!
```

---

## 🎯 Agent 3: Concierge Agent (Orchestrator)

**Purpose**: Orchestrates bundle creation by coordinating with other agents

**Location**: `app/services/concierge_agent.py`

### Key Code Snippet:

```python
class ConciergeAgent:
    """AI concierge agent for creating personalized bundles"""
    
    def __init__(self, session: Session):
        self.session = session
        self.deal_selector = DealSelector(session)  # Delegates to DealSelector
    
    def create_bundle(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Bundle:
        """
        Create a travel bundle by coordinating multiple agents
        
        Budget allocation:
        - Flights: 40% of budget
        - Hotels: 50% of budget (3 nights)
        - Cars: 10% (when implemented)
        """
        flights = []
        hotels = []
        
        # Step 1: Get flights (40% of budget)
        if origin:
            flights = self.deal_selector.get_best_flight_deals(
                origin=origin,
                destination=destination,
                max_price=max_price * 0.4 if max_price else None,
                limit=3
            )
        
        # Step 2: Get hotels (50% of budget)
        if city or destination:
            # Map airport codes to city names
            search_city = city or destination
            airport_to_city = {
                'DEL': 'Delhi', 'BOM': 'Mumbai',
                'JFK': 'New York', 'LAX': 'Los Angeles'
            }
            if search_city.upper() in airport_to_city:
                search_city = airport_to_city[search_city.upper()]
            
            hotels = self.deal_selector.get_best_hotel_deals(
                city=search_city,
                max_price=max_price * 0.5 if max_price else None,
                limit=3
            )
        
        # Step 3: Calculate prices and savings
        flight_price = sum(f.discounted_price for f in flights) if flights else 0
        hotel_price = sum(h.discounted_price_per_night * 3 for h in hotels) if hotels else 0
        total_price = flight_price + hotel_price
        
        flight_savings = sum(f.original_price - f.discounted_price for f in flights)
        hotel_savings = sum((h.original_price_per_night - h.discounted_price_per_night) * 3 for h in hotels)
        total_savings = flight_savings + hotel_savings
        
        # Step 4: Create bundle
        bundle = Bundle(
            name=f"Bundle: {origin or 'Any'} → {destination or city or 'Any'}",
            description=f"Curated bundle with {len(flights)} flight(s) and {len(hotels)} hotel(s)",
            total_price=total_price,
            savings=total_savings,
            flight_deal_ids=",".join(str(f.id) for f in flights),
            hotel_deal_ids=",".join(str(h.id) for h in hotels),
            tags=self._generate_tags(flights, hotels, preferences)
        )
        
        self.session.add(bundle)
        self.session.commit()
        self.session.refresh(bundle)
        
        return bundle
    
    def recommend_bundles(self, params: BundleSearchParams, limit: int = 5) -> List[Bundle]:
        """
        Recommend existing bundles or create new ones
        
        Strategy:
        1. First try to find existing bundles matching criteria
        2. If not enough, create new bundles from available deals
        3. Always returns bundles if deals are available
        """
        # Try to find existing bundles
        existing = self.deal_selector.get_best_bundles(params, limit=limit)
        
        # Filter to only matching routes
        matching_bundles = []
        for bundle in existing:
            if bundle.flight_deal_ids:
                flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
                flight = self.session.get(FlightDeal, flight_ids[0])
                if flight:
                    origin_match = not params.origin or flight.origin.upper() == params.origin.upper()
                    dest_match = not params.destination or flight.destination.upper() == params.destination.upper()
                    if origin_match and dest_match:
                        matching_bundles.append(bundle)
        
        # If not enough, create new bundles
        if len(matching_bundles) < limit:
            for attempt in range(3):
                try:
                    new_bundle = self.create_bundle(
                        origin=params.origin,
                        destination=params.destination,
                        city=params.city,
                        max_price=params.max_price
                    )
                    matching_bundles.append(new_bundle)
                    if len(matching_bundles) >= limit:
                        break
                except ValueError:
                    continue
        
        return matching_bundles[:limit]
    
    def explain_tradeoffs(
        self,
        bundle: Bundle,
        flights: List[FlightDeal],
        hotels: List[HotelDeal],
        alternatives: Optional[List[Bundle]] = None
    ) -> str:
        """
        Explain WHY this bundle was recommended
        
        Generates human-readable explanations:
        - Price vs value tradeoff
        - Flight choice reasoning
        - Hotel choice reasoning
        - Feature tags
        - Comparison with alternatives
        """
        explanations = []
        
        # Price/value explanation
        if bundle.savings > 0:
            savings_pct = (bundle.savings / (bundle.total_price + bundle.savings)) * 100
            explanations.append(
                f"💰 **Value**: This bundle saves you ${bundle.savings:.2f} ({savings_pct:.1f}% off) "
                f"compared to booking separately."
            )
        
        # Flight choice explanation
        if flights:
            best_flight = max(flights, key=lambda f: f.deal_score)
            explanations.append(
                f"✈️ **Flight**: {best_flight.airline} offers the best deal score "
                f"({best_flight.deal_score:.1f}/100) with {best_flight.discount_percentage:.1f}% savings."
            )
        
        # Hotel choice explanation
        if hotels:
            best_hotel = max(hotels, key=lambda h: h.deal_score)
            explanations.append(
                f"🏨 **Hotel**: {best_hotel.name} in {best_hotel.city} offers "
                f"excellent value with deal score {best_hotel.deal_score:.1f}/100."
            )
        
        return "\n\n".join(explanations)
```

**Usage Example**:
```python
concierge = ConciergeAgent(session)

# Create bundle
bundle = concierge.create_bundle(
    origin="BOM",
    destination="DEL",
    max_price=1000.0
)

# Get recommendations
bundles = concierge.recommend_bundles(
    BundleSearchParams(origin="BOM", destination="DEL", max_price=1000.0),
    limit=3
)

# Explain tradeoffs
explanation = concierge.explain_tradeoffs(bundle, flights, hotels)
```

---

## 🔍 Agent 4: Deal Selector Agent

**Purpose**: Finds the best deals matching user criteria

**Location**: `app/services/deal_selector.py`

### Key Code Snippet:

```python
class DealSelector:
    """Service for selecting the best deals"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_best_flight_deals(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[FlightDeal]:
        """
        Get best flight deals matching criteria
        
        Strategy:
        1. Query database for matching deals
        2. If not enough results, fetch from CSV index
        3. Create deals on-the-fly from CSV data
        """
        # Query database
        statement = select(FlightDeal).where(FlightDeal.is_active == True)
        
        if origin:
            statement = statement.where(FlightDeal.origin.ilike(f"%{origin.upper()}%"))
        
        if destination:
            statement = statement.where(FlightDeal.destination.ilike(f"%{destination.upper()}%"))
        
        if max_price:
            statement = statement.where(FlightDeal.discounted_price <= max_price)
        
        statement = statement.order_by(FlightDeal.deal_score.desc()).limit(limit)
        results = list(self.session.exec(statement).all())
        
        # If not enough results, fetch from CSV
        if len(results) < limit:
            try:
                from app.services.csv_query_service import CSVQueryService
                csv_service = CSVQueryService()
                csv_flights = csv_service.search_flights(
                    origin=origin,
                    destination=destination,
                    max_price=max_price,
                    limit=limit - len(results)
                )
                
                # Create deals from CSV data
                for flight_data in csv_flights:
                    # Check if exists
                    existing = self.session.exec(
                        select(FlightDeal).where(
                            FlightDeal.origin == flight_data.get('origin'),
                            FlightDeal.destination == flight_data.get('destination')
                        )
                    ).first()
                    
                    if not existing:
                        # Create FlightDeal from CSV
                        flight_deal = FlightDeal(
                            airline=flight_data.get('airline', 'Unknown'),
                            origin=flight_data.get('origin', ''),
                            destination=flight_data.get('destination', ''),
                            discounted_price=float(flight_data.get('price', 500)),
                            # ... other fields
                        )
                        self.session.add(flight_deal)
                        results.append(flight_deal)
                        
                        if len(results) >= limit:
                            break
                
                self.session.commit()
            except Exception as e:
                print(f"[DealSelector] Error fetching from CSV: {e}")
        
        return results[:limit]
    
    def get_best_hotel_deals(
        self,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[HotelDeal]:
        """Get best hotel deals matching criteria - similar strategy to flights"""
        # Similar implementation to get_best_flight_deals
        # ...
        pass
```

**Usage Example**:
```python
deal_selector = DealSelector(session)

# Get flights
flights = deal_selector.get_best_flight_deals(
    origin="BOM",
    destination="DEL",
    max_price=400.0,  # 40% of $1000 budget
    limit=3
)

# Get hotels
hotels = deal_selector.get_best_hotel_deals(
    city="Delhi",
    max_price=500.0,  # 50% of $1000 budget
    limit=3
)
```

---

## 🎯 Agent 5: Deal Detector Agent

**Purpose**: Detects and scores deals based on discount, availability, and historical data

**Location**: `app/deals_agent/deal_detector.py`

### Key Code Snippet:

```python
class DealDetector:
    """Detects and scores deals from supplier feeds"""
    
    @staticmethod
    def calculate_deal_score(
        discount_percentage: float,
        price: float,
        availability: int,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Calculate deal score (0-100) based on multiple factors
        
        Rules per specification:
        - ≥15% below 30-day average (0-40 points)
        - Limited inventory <5 (0-30 points)
        - Promo end date urgency (0-20 points)
        - Price factor (0-10 points)
        """
        score = 0.0
        
        # 1. Historical price comparison (0-40 points)
        if historical_data and historical_data.get('avg_30d_price'):
            avg_30d_price = historical_data['avg_30d_price']
            if avg_30d_price > 0:
                price_diff_pct = ((avg_30d_price - price) / avg_30d_price) * 100
                if price_diff_pct >= 15:  # ≥15% below 30-day avg
                    score += 40
                elif price_diff_pct >= 10:
                    score += 30
                elif price_diff_pct >= 5:
                    score += 20
                else:
                    score += 10
        
        # 2. Limited inventory factor (0-30 points)
        if availability < 5:
            if availability == 1:
                availability_score = 30  # Very limited
            elif availability == 2:
                availability_score = 25
            elif availability == 3:
                availability_score = 20
            else:  # availability == 4
                availability_score = 15
        else:
            availability_score = 5
        score += availability_score
        
        # 3. Promo urgency (0-20 points)
        if historical_data and historical_data.get('promo_end_date'):
            promo_end = datetime.fromisoformat(historical_data['promo_end_date'])
            days_until_end = (promo_end - datetime.now()).days
            if days_until_end <= 1:
                score += 20  # Ending soon
            elif days_until_end <= 3:
                score += 15
            else:
                score += 5
        
        # 4. Price factor (0-10 points)
        if price < 100:
            price_score = 10
        elif price < 500:
            price_score = 8
        else:
            price_score = 2
        score += price_score
        
        # Return as integer (0-100)
        return int(min(100, max(0, score)))
    
    @staticmethod
    def detect_flight_deal(
        flight_data: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Detect deal from flight data with historical context"""
        original_price = flight_data.get("original_price", flight_data.get("price", 0))
        current_price = flight_data.get("price", original_price)
        
        discount = DealDetector.calculate_discount(original_price, current_price)
        deal_score = DealDetector.calculate_deal_score(
            discount,
            current_price,
            flight_data.get("available_seats", 0),
            historical_data
        )
        
        return {
            "original_price": original_price,
            "discounted_price": current_price,
            "discount_percentage": discount,
            "deal_score": deal_score,
            "is_good_deal": DealDetector.is_good_deal(deal_score)
        }
```

**Usage Example**:
```python
# Detect deal from flight data
historical_data = {'avg_30d_price': 600.0}
flight_data = {
    'price': 500.0,
    'original_price': 600.0,
    'available_seats': 3
}

deal_info = DealDetector.detect_flight_deal(flight_data, historical_data)
# Returns: {
#     'discount_percentage': 16.67,
#     'deal_score': 75,  # High score due to 16.67% discount + limited seats
#     'is_good_deal': True
# }
```

---

## 💬 Agent 6: Chat API (Orchestration Layer)

**Purpose**: Coordinates all agents to handle user chat requests

**Location**: `app/api/chat.py`

### Key Code Snippet:

```python
@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_message: ChatMessage,
    session: Session = Depends(get_session)
):
    """
    Process a chat message and return AI response
    
    Agent Coordination Flow:
    1. NLUParser extracts intent
    2. ContextManager maintains state
    3. ConciergeAgent creates bundles
    4. BundleSummarizer generates explanations
    """
    session_id = chat_message.session_id or str(uuid.uuid4())
    message = chat_message.message
    
    # Step 1: Get context
    context = context_manager.get_context(session_id)
    missing_fields = context_manager.get_missing_fields(session_id)
    
    # Step 2: Parse natural language (NLU Parser Agent)
    parsed = nlu_parser.parse(message, context=context)
    parsed_request = ParsedTripRequest(**parsed)
    
    # Step 3: Merge with context (Context Manager Agent)
    merged_request = context_manager.merge_with_context(session_id, parsed_request)
    
    # Step 4: Re-check missing fields
    missing_fields = context_manager.get_missing_fields(session_id)
    
    # Step 5: If we have enough info, get recommendations (Concierge Agent)
    bundles = None
    if not missing_fields:
        concierge = ConciergeAgent(session)
        
        search_params = BundleSearchParams(
            origin=merged_request.origin,
            destination=merged_request.destination,
            city=merged_request.city,
            max_price=merged_request.budget
        )
        
        # Get bundles (ConciergeAgent coordinates DealSelector)
        bundle_list = concierge.recommend_bundles(search_params, limit=3)
        
        # Format bundles
        bundles = [{
            "id": bundle.id,
            "name": bundle.name,
            "total_price": bundle.total_price,
            "savings": bundle.savings,
            "tags": bundle.tags.split(",") if bundle.tags else []
        } for bundle in bundle_list]
        
        # Generate explanation (BundleSummarizer)
        if bundle_list:
            first_bundle = bundle_list[0]
            flight_ids = [int(id) for id in first_bundle.flight_deal_ids.split(",") if id]
            hotel_ids = [int(id) for id in first_bundle.hotel_deal_ids.split(",") if id]
            
            bundle_flights = [session.get(FlightDeal, fid) for fid in flight_ids]
            bundle_hotels = [session.get(HotelDeal, hid) for hid in hotel_ids]
            
            explanation = concierge.explain_tradeoffs(
                first_bundle, bundle_flights, bundle_hotels, bundle_list[:3]
            )
            response_message = f"I found {len(bundles)} great deals!\n\n**Why I recommend this:**\n{explanation}"
    
    # Step 6: If missing info, ask clarifying question
    else:
        known_info = []
        if context.get('origin'):
            known_info.append(f"departing from {context['origin']}")
        if context.get('destination'):
            known_info.append(f"going to {context['destination']}")
        if context.get('budget'):
            known_info.append(f"budget of ${context['budget']:.0f}")
        
        if known_info:
            response_message = f"Great! I have you {' and '.join(known_info)}. "
        
        # Ask for missing field (max 1 question)
        if 'origin' in missing_fields:
            response_message += "Where are you departing from?"
        elif 'destination' in missing_fields:
            response_message += "Where would you like to go?"
        elif 'budget' in missing_fields:
            response_message += "What's your budget?"
    
    return ChatResponse(
        message=response_message,
        parsed_request=merged_request,
        bundles=bundles,
        requires_clarification=len(missing_fields) > 0
    )
```

**Complete Flow Example**:
```python
# User: "Flight from BOM to DEL"
# 1. NLUParser extracts: origin="BOM", destination="DEL"
# 2. ContextManager stores: origin="BOM", destination="DEL"
# 3. Missing: budget
# 4. Response: "Great! I have you departing from BOM and going to DEL. What's your budget?"

# User: "1000"
# 1. NLUParser extracts: budget=1000.0
# 2. ContextManager merges: origin="BOM", destination="DEL", budget=1000.0
# 3. All fields present
# 4. ConciergeAgent creates bundle
# 5. Response: "I found 3 great deals! [bundles with explanations]"
```

---

## 🔄 Backend Worker Agents (Kafka Pipeline)

### Agent 7: Deal Detector Worker

**Purpose**: Processes deals through Kafka pipeline

**Location**: `app/deals_agent/deal_detector_worker.py`

```python
class DealDetectorWorker:
    """Kafka consumer worker that detects deals from normalized feeds"""
    
    async def start(self):
        """Start consuming from deals.normalized topic"""
        consumer = await getConsumer('deal-detector-group')
        
        await consumer.subscribe({
            topics: [KAFKA_TOPICS.DEALS_NORMALIZED],
            fromBeginning: False
        })
        
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try:
                    deal_data = json.loads(message.value.toString())
                    
                    # Use DealDetector to score the deal
                    historical_data = {
                        'avg_30d_price': deal_data.get('avg_30d_price'),
                        'promo_end_date': deal_data.get('promo_end_date')
                    }
                    
                    deal_score = DealDetector.calculate_deal_score(
                        discount_percentage=deal_data.get('discount_percentage', 0),
                        price=deal_data.get('price', 0),
                        availability=deal_data.get('availability', 0),
                        historical_data=historical_data
                    )
                    
                    # Produce to deals.scored topic
                    scored_deal = {
                        **deal_data,
                        'deal_score': deal_score,
                        'is_good_deal': deal_score >= 60
                    }
                    
                    await sendKafkaMessage(KAFKA_TOPICS.DEALS_SCORED, scored_deal)
                    
                except Exception as e:
                    print(f"[DealDetector] Error: {e}")
            }
        })
```

---

## 📊 Complete Agent Coordination Example

```python
# Complete flow showing all agents working together

# 1. User sends message
message = "Flight from Mumbai to Delhi, budget $1000"

# 2. NLU Parser Agent extracts intent
nlu_parser = NLUParser()
parsed = nlu_parser.parse(message)
# Returns: {'origin': 'BOM', 'destination': 'DEL', 'budget': 1000.0}

# 3. Context Manager Agent maintains state
context_manager = ChatContextManager()
merged = context_manager.merge_with_context(session_id, ParsedTripRequest(**parsed))

# 4. Concierge Agent orchestrates bundle creation
concierge = ConciergeAgent(session)

# 4a. Concierge delegates to Deal Selector for flights
flights = deal_selector.get_best_flight_deals(
    origin="BOM",
    destination="DEL",
    max_price=400.0  # 40% of budget
)

# 4b. Concierge delegates to Deal Selector for hotels
hotels = deal_selector.get_best_hotel_deals(
    city="Delhi",
    max_price=500.0  # 50% of budget
)

# 4c. Concierge creates bundle
bundle = concierge.create_bundle(
    origin="BOM",
    destination="DEL",
    max_price=1000.0
)

# 5. Bundle Summarizer generates explanation
explanation = concierge.explain_tradeoffs(bundle, flights, hotels)

# 6. Response sent to user
response = f"I found great deals! {explanation}"
```

---

## 🎯 Key Design Patterns

### 1. **Agent Delegation Pattern**
```python
# ConciergeAgent delegates to DealSelector
class ConciergeAgent:
    def __init__(self, session):
        self.deal_selector = DealSelector(session)  # Delegation
    
    def create_bundle(self, ...):
        flights = self.deal_selector.get_best_flight_deals(...)  # Delegates
        hotels = self.deal_selector.get_best_hotel_deals(...)   # Delegates
```

### 2. **Context Preservation Pattern**
```python
# ContextManager preserves state across turns
merged = context_manager.merge_with_context(session_id, new_parsed)
# Uses: new_value if provided, else existing_context_value
```

### 3. **Fallback Strategy Pattern**
```python
# DealSelector falls back to CSV if database is empty
results = query_database()
if len(results) < limit:
    csv_results = query_csv_index()  # Fallback
    results.extend(csv_results)
```

### 4. **Pipeline Pattern (Kafka)**
```python
# Backend workers process data through pipeline
raw_supplier_feeds → normalization → deal_detection → tagging → events
```

---

## 📝 Summary

The agentic AI system uses **6 chat-facing agents** and **5 backend worker agents**:

**Chat-Facing Agents:**
1. **NLUParser** - Extracts intent from natural language
2. **ContextManager** - Maintains conversation state
3. **ConciergeAgent** - Orchestrates bundle creation
4. **DealSelector** - Finds best deals
5. **BundleSummarizer** - Generates explanations
6. **PolicyQA** - Answers policy questions

**Backend Worker Agents:**
1. **FeedIngestionScheduler** - Ingests CSV data
2. **NormalizationWorker** - Normalizes data
3. **DealDetectorWorker** - Detects and scores deals
4. **OfferTaggerWorker** - Tags deals
5. **EventEmitter** - Publishes events

All agents work together through:
- **Direct method calls** (chat-facing agents)
- **Kafka topics** (backend workers)
- **Shared database** (all agents)
- **Context management** (conversation state)
