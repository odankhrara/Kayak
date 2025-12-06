# AI Recommendation Service

FastAPI-based AI recommendation service for the Kayak Travel Booking System. This service provides intelligent deal detection, bundle creation, and price watching capabilities.

## Features

- **Deal Detection**: Automatically detects and scores deals from supplier feeds
- **Bundle Creation**: AI-powered concierge agent creates personalized travel bundles
- **Price Watching**: Users can set up watches for price drops
- **Real-time Notifications**: WebSocket support for live deal updates
- **Kafka Integration**: Consumes raw supplier feeds and processes deals

## Setup

### Prerequisites

- Python 3.11+
- Poetry (recommended) or pip
- Kafka running (optional - for ingestion worker)
- **SQLite3** (default - no setup required, database file created automatically)
- MySQL (optional - for production, set `USE_MYSQL=true`)

### Installation

```bash
# Using Poetry
poetry install

# Or using pip
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file:

```env
# Database Configuration (SQLite is default - no setup required)
USE_MYSQL=false                    # Set to false to use SQLite (default)
DATABASE_URL=sqlite:///./ai_recommendations.db  # SQLite database file (auto-created)

# OR for MySQL (optional):
# USE_MYSQL=true
# MYSQL_HOST=localhost
# MYSQL_PORT=3307
# MYSQL_USER=root
# MYSQL_PASSWORD=password
# MYSQL_DATABASE=kayak

# AI Configuration
USE_AI=true
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Kafka Configuration (optional)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_FEEDS=raw_supplier_feeds
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Note:** SQLite3 is the default database. The database file `ai_recommendations.db` will be created automatically in the `ai-recommendation` directory when you first run the service. No database setup is required!

### Running the Service

```bash
# Development
uvicorn app.main:app --reload --port 8005

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8005
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Bundles
- `GET /bundles` - Get bundles (with search params)
- `GET /bundles/{bundle_id}` - Get bundle by ID
- `POST /bundles` - Create new bundle

### Watches
- `POST /watches` - Create a watch
- `GET /watches/user/{user_id}` - Get user's watches
- `GET /watches/{watch_id}` - Get watch by ID
- `PUT /watches/{watch_id}` - Update watch
- `DELETE /watches/{watch_id}` - Delete watch

### WebSocket
- `WS /events/{user_id}` - Real-time deal notifications

## Architecture

- **Models**: SQLModel entities for deals, bundles, and watches
- **Schemas**: Pydantic v2 schemas for request/response validation
- **Services**: Business logic (concierge agent, deal selector)
- **Deals Agent**: Deal detection, tagging, and ingestion
- **Kafka**: Producer/consumer for event streaming
- **WebSocket**: Real-time notifications

## Development

```bash
# Run tests
pytest

# Format code
black app/

# Lint
ruff check app/
```

