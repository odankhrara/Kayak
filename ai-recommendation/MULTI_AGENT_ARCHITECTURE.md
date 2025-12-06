# Multi-Agent Travel Concierge Architecture

## Overview

The AI Recommendation Service is a **multi-agent travel concierge** that behaves like a proactive teammate rather than just a search box. It periodically discovers great deals, reasons about user needs in conversation, and turns those insights into actionable trip recommendations.

## Architecture Components

### 1. **Deals Agent** (Backend Worker)
**Purpose**: Periodically discovers great deals from supplier feeds

**Components**:
- **Feed Ingestion Scheduler**: Ingests CSV datasets every 30 minutes
- **Normalization Worker**: Normalizes raw feeds into standard format
- **Deal Detector Worker**: Detects deals using price drop rules (≥15% discount)
- **Offer Tagger Worker**: Tags deals (pet-friendly, refundable, near transit, etc.)
- **Deal Scanner**: Scans database every 5 minutes for new great deals and pushes via WebSocket

**Pipeline**:
```
CSV Files → Kafka (raw_supplier_feeds) → Normalization → Deal Detection → Tagging → Database
                                                                                      ↓
                                                                              Deal Scanner
                                                                                      ↓
                                                                              WebSocket Push
```

### 2. **Concierge Agent** (Chat-Facing)
**Purpose**: Interacts with users via natural language chat, reasons about needs, and creates personalized bundles

**Capabilities**:
- **Intent Understanding**: Parses user queries using NLU parser
  - Extracts: origin, destination, budget, dates, travelers, preferences
  - Handles: "BOM to DEL flights", "Weekend in Tokyo under $900"
- **Trip Planning**: Composes flight + hotel + car bundles
- **Explanation Generation**: Explains WHY recommendations were made (adaptive reasoning)
- **Policy Q&A**: Answers questions about cancellation, pets, parking, etc.
- **Watch Service**: Monitors price/inventory thresholds

**Technologies**:
- **Groq API**: Ultra-fast LLM inference (70x faster than GPT-4) for real-time responses
- **Ollama**: Local LLM option for privacy-sensitive deployments
- **NLU Parser**: Rule-based + AI-powered natural language understanding

### 3. **Proactive Concierge** (NEW - Adaptive Recommendations)
**Purpose**: Monitors conversation context and proactively pushes recommendations

**Features**:
- **Context Monitoring**: Tracks user preferences from conversation
- **Proactive Recommendations**: Pushes bundles every 2 minutes based on conversation context
- **Adaptive Learning**: Learns from user preferences and adapts recommendations
- **WebSocket Push**: Sends proactive recommendations via WebSocket without user asking

**How It Works**:
1. User chats with concierge agent
2. Proactive concierge monitors conversation context
3. Updates user preferences (origin, destination, budget, constraints)
4. Every 2 minutes, checks if new deals match user preferences
5. Pushes recommendations via WebSocket: "💡 Based on our conversation, I found great deals for you!"

## Multi-Agent Behavior

### Proactive vs Reactive

**Reactive (Traditional Search)**:
- User asks → System searches → Returns results
- No recommendations until user explicitly asks

**Proactive (Our Implementation)**:
- User chats → System learns preferences → System proactively pushes recommendations
- Recommendations appear even when user hasn't explicitly asked
- System explains reasoning: "I noticed you're interested in BOM → DEL. These bundles match your preferences."

### Adaptive Reasoning

The concierge adapts explanations based on:
- **User Context**: Preferences, budget, constraints from conversation
- **Conversation History**: Previous searches, rejected bundles, accepted recommendations
- **Deal Quality**: Deal scores, availability, price history

**Example**:
```
User: "I want to go to Delhi from Bombay"
Concierge: "I found 1 great deal! Here are bundles starting at $1938.85.

**Why I recommend this:**
💰 **Value**: This bundle saves you $744.68 (27.7% off) compared to booking separately.
✈️ **Flight Choice**: I selected SpiceJet because it offers the best deal score (85.0/100) with 16.7% savings.
🏨 **Hotel Choice**: [Hotel details]
🏷️ **Features**: This bundle includes: economy. These tags help match your preferences."
```

### Scheduled Scans

**Deal Scanner** runs every 5 minutes:
1. Scans database for new/updated deals with deal_score ≥ 60
2. Finds top 3 flight deals and top 3 hotel deals
3. Pushes notifications to all connected users via WebSocket
4. Message format: "🔥 Great flight deal! SpiceJet BOM → DEL $1938.85 ($744.68 off)"

**Feed Ingestion** runs every 30 minutes:
1. Processes CSV files from `data/raw/`
2. Publishes to Kafka for deal detection pipeline
3. Ensures fresh data is always available

## WebSocket Integration

### Endpoints

1. **`/chat/ws/{user_id}`** - Real-time chat with concierge agent
   - Sends: User messages
   - Receives: AI responses, bundles, explanations
   - Features: Context-aware parsing, adaptive recommendations

2. **`/events/{user_id}`** - Real-time deal notifications
   - Receives: Proactive deal discoveries, watch matches
   - Features: Kafka event relay, proactive recommendations

### Message Flow

```
User Message → WebSocket → NLU Parser → Concierge Agent → Bundle Creation
                                                                    ↓
                                                          Proactive Concierge
                                                                    ↓
                                                          WebSocket Push (proactive)
```

## FastAPI Implementation

### HTTP Endpoints
- `POST /chat/message` - Chat with concierge agent
- `GET /bundles` - Get recommended bundles
- `POST /bundles` - Create bundle
- `GET /bundles/{id}` - Get bundle details
- `POST /watches` - Create price watch

### WebSocket Endpoints
- `WS /chat/ws/{user_id}` - Real-time chat
- `WS /events/{user_id}` - Real-time deal notifications

### Background Workers
- Deal Scanner (periodic scans)
- Feed Ingestion Scheduler (CSV processing)
- Normalization Worker (Kafka consumer)
- Deal Detector Worker (Kafka consumer)
- Offer Tagger Worker (Kafka consumer)
- Event Emitter (Kafka consumer)
- **Proactive Concierge** (NEW - adaptive recommendations)

## Key Features

### ✅ Periodic Deal Discovery
- Deal Scanner runs every 5 minutes
- Feed Ingestion runs every 30 minutes
- Pushes discoveries via WebSocket

### ✅ Conversation Reasoning
- NLU parser extracts user intent
- Context manager preserves conversation state
- Adaptive explanations based on user preferences

### ✅ Proactive Recommendations
- Monitors conversation context
- Pushes recommendations every 2 minutes
- Explains why recommendations match user needs

### ✅ Adaptive Behavior
- Learns from user preferences
- Adapts explanations to user context
- Adjusts recommendations based on conversation history

### ✅ WebSocket Push Updates
- Real-time deal notifications
- Proactive bundle recommendations
- Watch match notifications

## Example Flow

1. **User**: "I want to go to Delhi from Bombay"
2. **Concierge**: "Great! I have you departing from BOM and going to DEL. What's your budget?"
3. **User**: "$2000"
4. **Concierge**: "I found 1 great deal! Here are bundles starting at $1938.85. [Explanation]"
5. **Proactive Concierge** (2 minutes later): "💡 Based on our conversation, I found 2 more great deals for you! [Bundles with explanations]"
6. **Deal Scanner** (5 minutes later): "🔥 Great flight deal! SpiceJet BOM → DEL $1800 ($200 off)"

## Configuration

### Environment Variables
- `USE_AI=true` - Enable AI-powered explanations
- `GROQ_API_KEY` - Groq API key for fast LLM inference
- `USE_OLLAMA=false` - Use local Ollama instead of Groq
- `KAFKA_BOOTSTRAP_SERVERS=localhost:9092` - Kafka connection
- `DATABASE_URL=sqlite:///./ai_recommendations.db` - Database connection

### Intervals
- Deal Scanner: 5 minutes (configurable)
- Feed Ingestion: 30 minutes (configurable)
- Proactive Concierge: 2 minutes (configurable)

## Summary

The AI Recommendation Service is a **multi-agent system** that:
1. ✅ **Periodically discovers deals** (scheduled scans every 5 minutes)
2. ✅ **Reasons about user needs** (context-aware NLU parsing, adaptive explanations)
3. ✅ **Turns insights into recommendations** (bundle creation, proactive pushes)
4. ✅ **Behaves like a proactive teammate** (pushes recommendations without being asked)
5. ✅ **Plans, explains, and adapts** (explanations, context learning, adaptive recommendations)
6. ✅ **Uses FastAPI + WebSockets** (HTTP endpoints + real-time WebSocket push)

This makes it behave less like a search box and more like a proactive travel planning assistant that learns your preferences and actively helps you find the best deals.

