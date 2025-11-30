# AI Chatbot Implementation Documentation

## Overview

This document describes the complete implementation of the AI Travel Assistant chatbot integrated into the Kayak Travel Booking System. The chatbot provides natural language understanding (NLU) capabilities to help users find travel deals through conversational interactions.

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Conversation Context Management](#conversation-context-management)
7. [Natural Language Understanding](#natural-language-understanding)
8. [Usage Guide](#usage-guide)
9. [Testing](#testing)

---

## Architecture

### Technology Stack

**Backend:**
- FastAPI (Python) - REST API and WebSocket server
- Pydantic v2 - Request/response validation
- SQLModel - ORM for database operations
- SQLite (local) / MySQL (production) - Database storage

**Frontend:**
- React with TypeScript
- WebSocket client for real-time communication
- Zustand for state management

**Key Components:**
- NLU Parser - Extracts trip information from natural language
- Chat Context Manager - Maintains conversation state
- Concierge Agent - Generates travel recommendations
- Bundle Search - Finds matching travel bundles

---

## Backend Implementation

### 1. Chat API Endpoints

**Location:** `ai-recommendation/app/api/chat.py`

#### POST `/chat/message`
Processes a chat message and returns AI response.

**Request:**
```json
{
  "message": "Weekend in Tokyo under $900 for two, SFO departure",
  "user_id": 1,
  "session_id": "session_1234567890_abc123"
}
```

**Response:**
```json
{
  "message": "I found 3 great deals for you!",
  "parsed_request": {
    "origin": "SFO",
    "destination": "Tokyo",
    "budget": 900.0,
    "travelers": 2,
    "dates": {...},
    "constraints": ["pet-friendly"]
  },
  "bundles": [...],
  "requires_clarification": false,
  "clarification_questions": []
}
```

#### WebSocket `/chat/ws/{user_id}`
Real-time chat interface via WebSocket.

**Connection:**
```
ws://localhost:8005/chat/ws/1
```

**Message Format:**
```json
{
  "message": "I want to travel to Miami",
  "user_id": 1,
  "session_id": "session_1234567890_abc123"
}
```

**Response Format:**
```json
{
  "message": "Great! I have you going to Miami and budget of $1000. Where are you departing from?",
  "parsed_request": {
    "origin": null,
    "destination": "Miami",
    "city": "Miami",
    "budget": 1000.0,
    "travelers": null,
    "dates": null,
    "constraints": [],
    "confidence": 0.65,
    "raw_message": "I want to travel to Miami"
  },
  "bundles": null,
  "requires_clarification": true,
  "clarification_questions": ["Where are you departing from?"],
  "timestamp": "2025-11-29T23:30:00.000000"
}
```

**Note:** All datetime fields are automatically serialized to ISO format strings for JSON compatibility.

### 2. Conversation Context Manager

**Location:** `ai-recommendation/app/services/chat_context.py`

Maintains conversation state across multiple messages in a session.

**Features:**
- Stores: origin, destination, budget, travelers, dates, constraints
- Merges new information with existing context
- Tracks missing required fields
- Session-based storage (in-memory, can be migrated to Redis)

**Key Methods:**
- `get_context(session_id)` - Retrieve conversation context
- `update_context(session_id, parsed)` - Update with new information
- `merge_with_context(session_id, parsed_request)` - Merge parsed request with context
- `get_missing_fields(session_id)` - Get list of missing required fields
- `clear_context(session_id)` - Clear conversation context

**Implementation Details:**
- Uses in-memory dictionary for session storage
- Each session maintains separate context
- Automatically merges new parsed information with existing context
- Only tracks missing required fields (origin, destination, budget)

### 3. Natural Language Understanding (NLU) Parser

**Location:** `ai-recommendation/app/services/nlu_parser.py`

Extracts structured trip information from free-text user input.

**Extracted Information:**
- **Origin:** Airport codes (SFO, JFK) or city names
- **Destination:** City names or regions
- **Budget:** Dollar amounts (e.g., "$900", "1000 dollars")
- **Travelers:** Number of people
- **Dates:** Specific dates, weekends, date ranges
- **Constraints:** Pet-friendly, near transit, avoid red-eyes, etc.

**Example Parsing:**
```
Input: "Weekend in Tokyo under $900 for two, SFO departure, pet-friendly"
Output: {
  "origin": "SFO",
  "destination": "Tokyo",
  "budget": 900.0,
  "travelers": 2,
  "dates": {"type": "weekend", "flexible": true},
  "constraints": ["pet-friendly"]
}
```

**Improvements Made:**
- Standalone numbers recognized as budget (e.g., "1000" → $1000 budget)
- Standalone city names recognized as destinations
- Better pattern matching for "travel to [city]"
- Improved origin detection from city names
- Removes "under" from city names (e.g., "Tokyo under $900" → "Tokyo")
- Validates budget range ($100 - $50,000)
- Better handling of date ranges and flexible dates

### 4. Bundle Query Endpoint

**Location:** `ai-recommendation/app/api/bundles.py`

#### POST `/bundles/query`
Accepts natural language queries for bundles.

**Query Parameters:**
- `query` (string) - Natural language query
- `user_id` (int) - User ID

**Request Body (alternative):**
```json
{
  "query": "Weekend in Tokyo under $900"
}
```

### 5. Watch Creation Endpoint

**Location:** `ai-recommendation/app/api/watches.py`

#### POST `/watches`
Creates price watches for users.

**Query Parameters:**
- `user_id` (int) - Required user ID

**Request Body:**
```json
{
  "origin": "SFO",
  "destination": "Tokyo",
  "maxPrice": 900,
  "watchType": "flight"
}
```

---

## Frontend Implementation

### 1. AI Assistant Component

**Location:** `frontend/src/components/chat/AIAssistant.tsx`

Floating chat button and panel component.

**Features:**
- Floating button (bottom-right corner)
- Expandable chat panel
- Real-time WebSocket communication
- Session ID management for conversation context
- Message history display
- Bundle recommendations display

**State Management:**
- Messages array
- WebSocket connection
- Session ID (generated on mount)
- Loading states

### 2. AI Assistant Page

**Location:** `frontend/src/pages/AIAssistantPage.tsx`

Full-page chat interface.

**Route:** `/ai-assistant`

**Features:**
- Full-screen chat interface
- Parsed request details display
- Bundle cards with pricing
- Protected route (requires authentication)

### 3. API Client

**Location:** `frontend/src/api/aiRecommendationsApi.ts`

TypeScript client for AI service endpoints.

**Methods:**
- `sendChatMessage(message, userId, sessionId)` - Send chat message
- `queryBundles(query, userId)` - Query bundles with natural language
- `createWatch(watch, userId)` - Create price watch
- `connectChatWebSocket(userId)` - WebSocket connection

### 4. Navigation Integration

**Location:** `frontend/src/components/layout/Header.tsx`

AI Assistant button added to:
- Desktop navigation menu
- Mobile menu
- Profile dropdown menu

**Styling:**
- Purple-to-pink gradient button
- Bot icon from lucide-react
- Visible to all users (redirects to login if not authenticated)

---

## Features

### 1. Natural Language Understanding

- Parses free-text trip requests
- Extracts: origin, destination, dates, budget, travelers, constraints
- Handles typos and variations
- Recognizes standalone numbers as budget
- Recognizes standalone city names as destinations

### 2. Conversation Context Management

- Maintains state across multiple messages
- Remembers previously provided information
- Only asks for missing information
- Context-aware responses

**Example Flow:**
1. User: "1000"
   - Bot: "Great! I have you budget of $1000. I still need to know: Where are you departing from?, and Where would you like to go?."

2. User: "San Francisco"
   - Bot: "Great! I have you going to San Francisco and budget of $1000. Where are you departing from?"

3. User: "New York"
   - Bot: Has all info → searches for bundles

### 3. Real-time Communication

- WebSocket support for instant responses
- HTTP fallback if WebSocket unavailable
- Automatic reconnection handling

### 4. Bundle Recommendations

- Searches for matching travel bundles
- Displays bundle cards with:
  - Name and description
  - Total price
  - Savings amount
  - Tags (pet-friendly, etc.)

### 5. Price Watching

- Create watches for price drops
- User-specific watches
- Tied to authenticated users

---

## API Endpoints

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/message` | Process chat message |
| WebSocket | `/chat/ws/{user_id}` | Real-time chat |

### Bundle Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bundles/query` | Natural language bundle query |
| GET | `/bundles` | List bundles with filters |
| GET | `/bundles/{id}` | Get bundle details |
| POST | `/bundles` | Create bundle |

### Watch Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/watches` | Create price watch |
| GET | `/watches/{user_id}` | Get user watches |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |

---

## Conversation Context Management

### How It Works

1. **Session Creation:**
   - Frontend generates unique session ID on component mount
   - Session ID persists across messages in same conversation

2. **Context Storage:**
   - In-memory storage (can be migrated to Redis for production)
   - Stores: origin, destination, budget, travelers, dates, constraints

3. **Information Merging:**
   - New parsed information merged with existing context
   - Missing fields tracked
   - Only asks for missing required information

4. **Context-Aware Responses:**
   - Acknowledges what bot already knows
   - Provides intelligent follow-up questions
   - Only asks for missing information

### Example Conversation

```
User: "I want to travel to Miami"
Bot: "I'd like to help you find the perfect trip! Where are you departing from? Where would you like to go? What's your budget for this trip?"

User: "1000"
Bot: "Great! I have you budget of $1000. I still need to know: Where are you departing from?, and Where would you like to go?."

User: "San Francisco"
Bot: "Great! I have you going to San Francisco and budget of $1000. Where are you departing from?"

User: "New York"
Bot: "I found 3 great deals for you! Here are bundles starting at $850.00. Would you like to see more details about any of these?"
```

---

## Natural Language Understanding

### Supported Patterns

#### Origin Detection
- Airport codes: "SFO", "JFK", "LAX"
- "from [city]": "from San Francisco"
- "departure from [city]": "departure from New York"
- Standalone city names (context-dependent)

#### Destination Detection
- "to [city]": "to Miami", "travel to Tokyo"
- "in [city]": "weekend in Paris"
- "going to [city]": "going to London"
- Standalone city names

#### Budget Detection
- "$900", "$1,200"
- "900 dollars", "1200 USD"
- "under $900", "below $1000"
- "budget of $500"
- Standalone numbers: "1000" → $1000

#### Travelers Detection
- "for two", "for 2 people"
- "two travelers", "2 adults"
- "family of 4"

#### Date Detection
- "weekend" → next weekend
- "Oct 25-27" → specific dates
- "next month" → flexible dates
- Date ranges with dateutil

#### Constraints Detection
- "pet-friendly"
- "near transit"
- "avoid red-eyes"
- "non-stop"
- "direct flight"

---

## Usage Guide

### For Users

1. **Access the Chatbot:**
   - Click "AI Assistant" button in header navigation
   - Or use floating button (bottom-right)
   - Navigate to `/ai-assistant` for full page

2. **Start a Conversation:**
   - Type your travel request in natural language
   - Example: "Weekend in Tokyo under $900 for two, SFO departure"

3. **Provide Information:**
   - Bot will ask for missing information
   - You can provide details one at a time
   - Bot remembers previous messages in the conversation

4. **View Recommendations:**
   - Bot displays matching bundles
   - Click on bundles for more details
   - Create watches for price drops

### For Developers

#### Starting the AI Service

```bash
cd ai-recommendation
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

#### Testing the API

```bash
# Test chat message
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Weekend in Tokyo under $900",
    "user_id": 1,
    "session_id": "test123"
  }'

# Test bundle query
curl -X POST "http://localhost:8005/bundles/query?query=Weekend%20in%20Tokyo&user_id=1"
```

#### Frontend Development

```bash
cd frontend
npm run dev
```

---

## Testing

### Manual Testing

1. **Test Conversation Context:**
   - Send "1000" → verify budget remembered
   - Send "San Francisco" → verify destination remembered
   - Send "New York" → verify origin remembered
   - Verify bot only asks for missing info

2. **Test NLU Parsing:**
   - "Weekend in Tokyo under $900" → verify all fields parsed
   - "I want to travel to Miami" → verify destination extracted
   - "1000" → verify budget extracted

3. **Test Bundle Search:**
   - Provide complete trip details
   - Verify bundles returned
   - Verify bundle cards displayed

### API Testing

```bash
# Test with session context
SESSION_ID="test_$(date +%s)"

# Message 1: Budget
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"1000\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"

# Message 2: Destination
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Miami\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"

# Message 3: Origin
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"San Francisco\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"
```

---

## File Structure

```
ai-recommendation/
├── app/
│   ├── api/
│   │   ├── chat.py              # Chat endpoints
│   │   ├── bundles.py           # Bundle endpoints
│   │   └── watches.py           # Watch endpoints
│   ├── services/
│   │   ├── nlu_parser.py        # NLU parsing logic
│   │   ├── chat_context.py      # Conversation context manager
│   │   └── concierge_agent.py   # Recommendation agent
│   ├── schemas/
│   │   └── chat_schemas.py      # Pydantic schemas
│   └── main.py                  # FastAPI app
│
frontend/
├── src/
│   ├── components/
│   │   └── chat/
│   │       ├── AIAssistant.tsx  # Floating chat component
│   │       └── AIAssistant.css  # Chat styles
│   ├── pages/
│   │   ├── AIAssistantPage.tsx  # Full page chat
│   │   └── AIAssistantPage.css  # Page styles
│   ├── api/
│   │   └── aiRecommendationsApi.ts  # API client
│   └── components/
│       └── layout/
│           └── Header.tsx       # Navigation with AI button
```

---

## Configuration

### Environment Variables

**AI Service (`ai-recommendation/.env`):**
```env
DATABASE_URL=sqlite:///./ai_recommendations.db
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_FEEDS=raw_supplier_feeds
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Frontend:**
- AI Service URL: `http://localhost:8005` (default)
- WebSocket URL: `ws://localhost:8005`

---

## Future Enhancements

1. **Persistent Context Storage:**
   - Migrate from in-memory to Redis
   - Support for long-term conversation history

2. **Advanced NLU:**
   - Machine learning-based intent recognition
   - Better handling of ambiguous queries
   - Multi-language support

3. **Conversation Memory:**
   - Long-term user preferences
   - Learning from past bookings
   - Personalized recommendations

4. **Integration:**
   - Connect to booking system
   - Real-time price updates
   - Email notifications for watches

---

## Troubleshooting

### Common Issues

1. **Bot not responding:**
   - Check if AI service is running on port 8005
   - Verify WebSocket connection
   - Check browser console for errors
   - HTTP fallback should work automatically if WebSocket fails

2. **Context not maintained:**
   - Verify session_id is being sent (check browser console)
   - Check if session_id is consistent across messages
   - Verify context manager is working
   - Session ID is auto-generated on component mount

3. **Parsing errors:**
   - Check NLU parser logs
   - Verify input format
   - Test with simpler queries first
   - Common issue: "Tokyo under $900" - now fixed to extract "Tokyo"

4. **Datetime serialization error:**
   - Error: "Object of type datetime is not JSON serializable"
   - **Fixed in v1.1.0** - All datetime fields now properly serialized
   - If still occurs, check if service was restarted after update

5. **WebSocket connection issues:**
   - Check if port 8005 is accessible
   - Verify CORS settings
   - HTTP fallback will be used automatically
   - Check browser console for connection errors

### Debug Commands

```bash
# Check AI service status
curl http://localhost:8005/health

# Check service logs
tail -f src/logs/ai-service.log

# Test NLU parsing directly
cd ai-recommendation
python3 -c "from app.services.nlu_parser import NLUParser; parser = NLUParser(); print(parser.parse('Weekend in Tokyo under $900'))"

# Test chat message with session context
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "1000",
    "user_id": 1,
    "session_id": "test123"
  }'

# Test conversation context
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "San Francisco",
    "user_id": 1,
    "session_id": "test123"
  }'
```

### Testing Conversation Context

```bash
# Test full conversation flow
SESSION_ID="test_$(date +%s)"

# Message 1: Budget
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"1000\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"

# Message 2: Destination (should remember budget)
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Miami\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"

# Message 3: Origin (should remember budget and destination)
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"San Francisco\", \"user_id\": 1, \"session_id\": \"$SESSION_ID\"}"
```

---

## Summary

This implementation provides a complete AI chatbot solution for the travel booking system with:

✅ Natural language understanding  
✅ Conversation context management (v1.1.0)  
✅ Real-time WebSocket communication  
✅ Bundle recommendations  
✅ Price watching  
✅ User-friendly UI  
✅ Session-based state management  
✅ Context-aware responses  
✅ Improved NLU parsing  
✅ Proper datetime serialization  
✅ Enhanced error handling  

The chatbot is fully integrated into the frontend and backend, providing a seamless user experience for finding travel deals through natural conversation. The conversation context management ensures the bot remembers previous messages and only asks for missing information, making interactions more natural and efficient.

### Key Features by Version

**v1.0.0:**
- Basic NLU parsing
- WebSocket communication
- Bundle recommendations
- Frontend integration

**v1.1.0:**
- Conversation context management
- Improved NLU parsing
- Fixed datetime serialization
- Enhanced error handling
- Context-aware responses

---

## Recent Updates & Bug Fixes

### Version 1.1.0 (November 29, 2025)

#### Conversation Context Management
- **Implemented session-based conversation state**
  - Created `ChatContextManager` to maintain conversation context across messages
  - Remembers: origin, destination, budget, travelers, dates, constraints
  - Only asks for missing information
  - Provides context-aware responses

- **Example:**
  ```
  User: "1000"
  Bot: "Great! I have you budget of $1000. I still need to know: Where are you departing from?, and Where would you like to go?."
  
  User: "San Francisco"
  Bot: "Great! I have you going to San Francisco and budget of $1000. Where are you departing from?"
  ```

#### NLU Parsing Improvements
- **Enhanced destination extraction:**
  - Removes "under" from city names (e.g., "Tokyo under $900" → "Tokyo")
  - Better handling of standalone numbers as budget
  - Improved pattern matching for "travel to [city]"
  - Standalone city names recognized as destinations

- **Budget detection:**
  - Standalone numbers (e.g., "1000") recognized as budget
  - Validates reasonable budget range ($100 - $50,000)

- **Origin detection:**
  - Better handling of city names as origins
  - Improved pattern matching for "from [city]" and "departure from [city]"

#### WebSocket & Response Handling
- **Fixed datetime JSON serialization error:**
  - Added proper datetime serialization in `ChatResponse` schema
  - Uses `model_dump(mode='json')` for WebSocket responses
  - Converts datetime objects to ISO format strings
  - Prevents "Object of type datetime is not JSON serializable" error

- **Improved WebSocket message handling:**
  - Proper error handling and logging
  - Loading state management
  - HTTP fallback on WebSocket failure
  - Better error messages for users

#### Frontend Improvements
- **Session ID management:**
  - Auto-generates unique session IDs on component mount
  - Maintains session across messages
  - Passes session_id to all API calls

- **Enhanced error handling:**
  - Console logging for debugging
  - User-friendly error messages
  - Automatic HTTP fallback on WebSocket errors

#### Bug Fixes
1. **Fixed destination parsing:** "Tokyo under $900" now correctly extracts "Tokyo"
2. **Fixed datetime serialization:** WebSocket responses now properly serialize datetime objects
3. **Fixed loading state:** Loading indicator properly resets on response/error
4. **Fixed WebSocket responses:** Messages now properly received and displayed
5. **Fixed context persistence:** Conversation context maintained across all messages

#### Technical Details

**Chat Context Manager (`ai-recommendation/app/services/chat_context.py`):**
- In-memory session storage (can be migrated to Redis for production)
- Methods: `get_context()`, `update_context()`, `merge_with_context()`, `get_missing_fields()`
- Tracks missing required fields: origin, destination, budget

**Updated Schemas:**
- `ChatResponse` now includes JSON encoders for datetime
- `ParsedTripRequest` handles date serialization
- All datetime fields converted to ISO format strings

**WebSocket Endpoint:**
- Proper exception handling
- Error responses sent as JSON
- Session ID support for context management

---

## Changelog

### v1.1.0 (November 29, 2025)
- ✅ Added conversation context management
- ✅ Improved NLU parsing (destination, budget, origin)
- ✅ Fixed datetime JSON serialization
- ✅ Enhanced WebSocket error handling
- ✅ Added session ID management
- ✅ Improved user experience with context-aware responses

### v1.0.0 (November 29, 2025)
- ✅ Initial AI chatbot implementation
- ✅ Natural language understanding
- ✅ WebSocket support
- ✅ Bundle recommendations
- ✅ Frontend integration

---

**Last Updated:** November 29, 2025  
**Current Version:** 1.1.0

