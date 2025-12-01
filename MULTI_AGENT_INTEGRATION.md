# Multi-Agent Integration for Hotels, Flights, and Cars

## Overview

The Kayak AI Recommendation System uses a **multi-agent architecture** where specialized agents work together to create personalized travel bundles combining flights, hotels, and cars.

---

## 🏗️ Agent Architecture

### 1. **NLUParser Agent**
**Role**: Natural Language Understanding
- Extracts intent from user queries
- Parses: origin, destination, budget, dates, travelers, constraints
- Maps city names ↔ airport codes (Mumbai ↔ BOM, Delhi ↔ DEL)
- Handles context-aware parsing for follow-up queries

**Location**: `ai-recommendation/app/services/nlu_parser.py`

### 2. **ConciergeAgent** (Orchestrator)
**Role**: Bundle Creation Coordinator
- Orchestrates the entire bundle creation process
- Coordinates with DealSelector for flights & hotels
- Combines deals into personalized bundles
- Calculates total prices and savings
- Allocates budget: 40% flights, 50% hotels, 10% cars (when implemented)

**Location**: `ai-recommendation/app/services/concierge_agent.py`

### 3. **DealSelector Agent**
**Role**: Specialized Deal Finder
- `get_best_flight_deals()` - Finds flights by route, price, preferences
- `get_best_hotel_deals()` - Finds hotels by city, price, rating
- Filters by route matching, price constraints
- Falls back to CSV data when database is empty
- Creates FlightDeal/HotelDeal objects from CSV on-the-fly

**Location**: `ai-recommendation/app/services/deal_selector.py`

### 4. **CSVQueryService Agent**
**Role**: Data Access Layer
- Searches indexed Kaggle datasets (csv_index.db)
- Handles city/airport code mapping
- Returns flights, hotels, airports, routes data
- Provides fallback when main database is empty

**Location**: `ai-recommendation/app/services/csv_query_service.py`

### 5. **BundleSummarizer Agent**
**Role**: Explanation Generator
- Creates human-readable bundle descriptions
- Explains why bundles were chosen
- Calculates travel times, neighborhoods, cancellation terms
- Generates "Why I recommend this" explanations

**Location**: `ai-recommendation/app/services/bundle_summarizer.py`

### 6. **ContextManager Agent**
**Role**: Conversation State Management
- Maintains conversation context across multiple turns
- Stores: origin, destination, budget, travelers, constraints
- Handles refinement queries (e.g., "hotels near airport")
- Prevents asking for same information repeatedly

**Location**: `ai-recommendation/app/services/chat_context.py`

---

## 🔄 Bundle Creation Flow

```
User Query: "Plan trip Mumbai → Delhi, budget $2500"
    ↓
NLUParser Agent
    ├─ Extracts: origin="BOM", destination="DEL", budget=2500
    └─ Maps: Mumbai → BOM, Delhi → DEL
    ↓
ContextManager
    └─ Stores context for conversation
    ↓
ConciergeAgent (Orchestrator)
    ├─→ Calls DealSelector.get_best_flight_deals(origin=BOM, dest=DEL)
    │     ├─→ Searches FlightDeal table
    │     ├─→ If empty, queries CSVQueryService
    │     └─→ Creates FlightDeal objects from CSV
    │
    ├─→ Calls DealSelector.get_best_hotel_deals(city=Delhi)
    │     ├─→ Searches HotelDeal table
    │     ├─→ Maps airport code DEL → city name "Delhi"
    │     ├─→ If empty, queries CSVQueryService
    │     └─→ Creates HotelDeal objects from CSV
    │
    └─→ Combines into Bundle
          ├─ flight_deal_ids: "1,2,3"
          ├─ hotel_deal_ids: "10,11,12"
          ├─ total_price: flight_price + hotel_price
          └─ savings: calculated discounts
    ↓
BundleSummarizer
    └─ Generates explanation and recommendations
    ↓
Response to User
```

---

## 📊 Data Integration

### **Flights Integration**

1. **Data Source**: Kaggle datasets → `csv_index.db` (flights table)
2. **Indexing**: `scripts/index_all_datasets.py` indexes all CSV files
3. **Query**: `CSVQueryService.search_flights(origin, destination, max_price)`
4. **Creation**: `DealSelector` creates `FlightDeal` objects from CSV
5. **Storage**: `FlightDeal` table in `ai_recommendations.db`
6. **Usage**: `ConciergeAgent` uses flights in bundle creation

**Key Features**:
- Route filtering (only matching origin → destination)
- City ↔ Airport code mapping
- Price-based filtering
- Automatic deal creation from CSV

### **Hotels Integration**

1. **Data Source**: Kaggle datasets → `csv_index.db` (hotels table)
2. **Indexing**: `scripts/index_all_datasets.py` indexes hotel data
3. **Query**: `CSVQueryService.search_hotels(city, max_price, min_rating)`
4. **Creation**: `DealSelector` creates `HotelDeal` objects from CSV
5. **Storage**: `HotelDeal` table in `ai_recommendations.db`
6. **Usage**: `ConciergeAgent` uses hotels in bundle creation

**Key Features**:
- City-based search (with airport code → city mapping)
- Price and rating filtering
- Automatic deal creation from CSV
- Room and amenity data integration

### **Cars Integration** (Partially Implemented)

1. **Data Source**: Sample data → MySQL `cars` table
2. **Population**: `scripts/populate_booking_database.py` creates car records
3. **Model Support**: `Bundle.car_deal_ids` field exists
4. **Schema Support**: `CarDealResponse` in bundle schemas
5. **Status**: ⚠️ Not yet integrated in `ConciergeAgent.create_bundle()`

**What's Missing**:
- `DealSelector.get_best_car_deals()` method
- Car deal creation from CSV data
- Car integration in bundle price calculation
- Car selection logic in ConciergeAgent

---

## 🎯 Multi-Agent Coordination

### Request Flow

```
┌─────────────────┐
│   User Query    │
│  (Chat API)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   NLUParser     │  ← Extracts intent, maps cities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ContextManager  │  ← Maintains conversation state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ConciergeAgent  │  ← Orchestrates bundle creation
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌─────────┐
│DealSel. │ │DealSel.│
│Flights  │ │Hotels  │
└────┬────┘ └────┬───┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│CSVQuery│ │CSVQuery│
│Service │ │Service │
└────┬───┘ └────┬────┘
     │          │
     └────┬─────┘
          │
          ▼
    ┌──────────┐
    │  Bundle  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│BundleSummarizer │  ← Generates explanations
└────────┬────────┘
         │
         ▼
    Response
```

---

## 💡 Key Integration Features

### 1. **Route-Based Filtering**
- Only shows bundles matching the requested route
- Prevents showing LAX→NY for BOM→DEL queries
- Validates origin/destination matches

### 2. **City ↔ Airport Code Mapping**
- Automatic conversion: Mumbai ↔ BOM, Delhi ↔ DEL
- Handles both city names and airport codes
- Uses `AirportMapper` for accurate mapping

### 3. **CSV Data Fallback**
- When database is empty, queries CSV index
- Creates deals on-the-fly from CSV data
- Ensures system always has data to work with

### 4. **Budget Allocation**
- Flights: 40% of budget
- Hotels: 50% of budget (3 nights)
- Cars: 10% (when implemented)

### 5. **Context-Aware Conversations**
- Maintains state across multiple turns
- Handles refinements: "hotels near airport"
- Remembers previous parameters

### 6. **Multi-Turn Refinement**
- User can refine searches without restarting
- Adds constraints to existing search
- Updates context intelligently

---

## 📈 Current Implementation Status

### ✅ **Fully Integrated**

**Flights**:
- ✅ NLU parsing
- ✅ Deal selection
- ✅ CSV integration
- ✅ Bundle creation
- ✅ Route filtering
- ✅ Price optimization

**Hotels**:
- ✅ NLU parsing
- ✅ Deal selection
- ✅ CSV integration
- ✅ Bundle creation
- ✅ City mapping
- ✅ Rating filtering

### ⚠️ **Partially Integrated**

**Cars**:
- ✅ Database model (`Bundle.car_deal_ids`)
- ✅ Database population (`populate_booking_database.py`)
- ✅ Schema support (`CarDealResponse`)
- ❌ Not in `ConciergeAgent.create_bundle()`
- ❌ No `get_best_car_deals()` method
- ❌ No CSV integration for cars

---

## 🔧 Technical Implementation

### Bundle Model Structure

```python
class Bundle:
    flight_deal_ids: str  # Comma-separated IDs
    hotel_deal_ids: str   # Comma-separated IDs
    car_deal_ids: str     # Comma-separated IDs (ready but unused)
    total_price: float
    savings: float
    tags: str
```

### ConciergeAgent.create_bundle()

```python
def create_bundle(self, origin, destination, city, max_price):
    # Get flights
    flights = self.deal_selector.get_best_flight_deals(
        origin=origin,
        destination=destination,
        max_price=max_price * 0.4
    )
    
    # Get hotels
    hotels = self.deal_selector.get_best_hotel_deals(
        city=city or destination,
        max_price=max_price * 0.5
    )
    
    # Create bundle
    bundle = Bundle(
        flight_deal_ids=",".join(str(f.id) for f in flights),
        hotel_deal_ids=",".join(str(h.id) for h in hotels),
        # car_deal_ids would go here when implemented
    )
    
    return bundle
```

---

## 🚀 Future Enhancements

1. **Complete Car Integration**
   - Add `get_best_car_deals()` to DealSelector
   - Integrate cars in ConciergeAgent
   - Add car CSV data indexing
   - Include cars in bundle price calculation

2. **Advanced Bundle Logic**
   - Smart car selection based on destination
   - Airport pickup/dropoff coordination
   - Multi-city trip support

3. **Enhanced Agent Communication**
   - Agent-to-agent messaging
   - Parallel deal fetching
   - Caching and optimization

---

## 📝 Summary

The multi-agent system successfully integrates **flights and hotels** through:
- Specialized agents for each function
- Coordinated bundle creation
- CSV data fallback
- Route-based filtering
- Context-aware conversations

**Cars** are partially integrated (model and database ready) but need:
- DealSelector method for cars
- ConciergeAgent integration
- CSV data indexing for cars

The architecture is designed to easily add cars once these components are implemented.

