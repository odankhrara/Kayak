# Steps to Run the AI Agent

## Prerequisites

1. **Python 3.11+** installed
2. **MySQL 8.0** (required - Docker container or local installation)
3. **pymysql** Python package (`pip install pymysql`)
4. **Kafka** (optional - for deal ingestion, service works without it)
5. **Groq API Key** (optional, for AI-powered features)

## Step-by-Step Setup

### Step 1: Navigate to AI Recommendation Directory

```bash
cd ai-recommendation
```

### Step 2: Create Python Virtual Environment (if not already created)

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt
```

**Key dependencies:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlmodel` - Database ORM (works with MySQL via pymysql)
- `pymysql` - Pure Python MySQL client
- `groq` - Groq API client (for AI features)
- `aiokafka` - Kafka async client (optional)

### Step 4: Configure Environment Variables

Create or update `.env` file in the `ai-recommendation` directory:

```bash
# Database Configuration - MySQL (Required)
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak
CSV_INDEX_DB_NAME=kayak_csv_index

# AI Configuration
USE_AI=true
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Optional: Ollama (local LLM) as fallback
USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Kafka Configuration (optional - service works without Kafka)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_FEEDS=raw_supplier_feeds
KAFKA_TOPIC_EVENTS=deal.events

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# CSV Data Configuration
DATASETS_DIR=./data/raw
```

**Important Notes:**
- **MySQL is required** - Ensure MySQL is running (Docker or local installation)
- The service uses `kayak` database for deals and `kayak_csv_index` for CSV index
- Databases are created automatically if they don't exist
- Get your Groq API key from: https://console.groq.com/

### Step 5: Database Initialization

**MySQL Setup:**
- Ensure MySQL is running (check with `docker ps | grep mysql` or `mysql --version`)
- The databases (`kayak` and `kayak_csv_index`) are created automatically if they don't exist
- Tables are created automatically on first run
- **MySQL must be accessible** at the configured host and port

To verify database initialization:
```bash
python3 -c "from app.db.session import create_db_and_tables; create_db_and_tables(); print('✅ MySQL database initialized')"
```

### Step 6: (Optional) Index CSV Datasets

If you want to use CSV data for recommendations:

```bash
# Index CSV files into MySQL database (kayak_csv_index)
python3 scripts/index_all_datasets.py

# Populate deals from CSV
python3 scripts/populate_all_datasets.py
```

**Note:** This creates/updates the MySQL database `kayak_csv_index` for fast CSV queries.

### Step 7: Start the AI Agent Service

#### Development Mode (with auto-reload):

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Start the service
uvicorn app.main:app --reload --port 8005
```

#### Production Mode:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8005
```

### Step 8: Verify Service is Running

Open your browser or use curl:

```bash
# Check health endpoint
curl http://localhost:8005/health

# Check root endpoint
curl http://localhost:8005/

# View API documentation
# Open in browser: http://localhost:8005/docs
```

## Expected Output

When the service starts successfully, you should see:

```
✅ Airport mapper loaded (X airports)
✅ CSV index database exists
✅ All datasets available
✅ Feed ingestion scheduler started
✅ Normalization worker started
✅ Deal detector worker started
✅ Offer tagger worker started
✅ Event emitter started
✅ Deal scanner started
✅ Proactive concierge started (adaptive recommendations)
AI Recommendation Service started
INFO:     Uvicorn running on http://0.0.0.0:8005 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## MySQL Databases

The service uses MySQL and connects to these databases:

1. **`kayak` database** - Main database for:
   - `flight_deals` - AI-processed flight deals
   - `hotel_deals` - AI-processed hotel deals
   - `bundles` - Travel bundles (flight + hotel combinations)
   - `watches` - Price/inventory watches
   - `price_history` - Historical price data

2. **`kayak_csv_index` database** - CSV data index (created by indexing script):
   - `flights` - Indexed flight data from CSV
   - `hotels` - Indexed hotel data from CSV
   - `airports` - Airport information
   - `routes` - Flight routes

**Location:** Both databases are in MySQL server (default: localhost:3307).

## Service Endpoints

Once running, the AI agent provides:

### HTTP Endpoints:
- `GET /` - Service info
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `POST /chat/message` - Chat with AI concierge
- `GET /bundles` - Get travel bundles
- `GET /bundles/{id}` - Get bundle details
- `POST /watches` - Create price watch

### WebSocket Endpoints:
- `WS /chat/ws/{user_id}` - Real-time chat with AI concierge
- `WS /events/{user_id}` - Real-time deal notifications

## Testing the AI Agent

### 1. Test Chat Endpoint (HTTP):

```bash
curl -X POST http://localhost:8005/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to go to Delhi from Bombay",
    "user_id": 1,
    "session_id": "test-session-1"
  }'
```

### 2. Test WebSocket Chat:

Use a WebSocket client or the frontend application to connect to:
```
ws://localhost:8005/chat/ws/1
```

Send messages like:
- "I want to go to Delhi from Bombay"
- "Budget is $2000"
- "Find flights from BOM to DEL"

### 3. Test Bundle Recommendations:

```bash
curl "http://localhost:8005/bundles?origin=BOM&destination=DEL&max_price=2000"
```

## Background Workers

The AI agent automatically starts these background workers:

1. **Deal Scanner** - Scans for deals every 5 minutes
2. **Feed Ingestion Scheduler** - Ingests CSV data every 30 minutes
3. **Normalization Worker** - Normalizes raw feeds
4. **Deal Detector Worker** - Detects great deals
5. **Offer Tagger Worker** - Tags deals with features
6. **Event Emitter** - Emits deal events
7. **Proactive Concierge** - Pushes recommendations every 2 minutes

## Troubleshooting

### Issue: Port 8005 already in use

```bash
# Find and kill process using port 8005
lsof -ti :8005 | xargs kill -9

# Or use a different port
uvicorn app.main:app --reload --port 8006
```

### Issue: MySQL connection failed

- Check MySQL is running: `docker ps | grep mysql` or `mysql --version`
- Verify connection settings in `.env` file
- Ensure MySQL user has permissions to create databases
- Check firewall/network settings if connecting to remote MySQL

### Issue: Database not found

- Databases (`kayak` and `kayak_csv_index`) are created automatically
- If creation fails, create manually:
  ```sql
  CREATE DATABASE IF NOT EXISTS kayak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE IF NOT EXISTS kayak_csv_index CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### Issue: Groq API errors

- Verify `GROQ_API_KEY` is set in `.env`
- Check API key is valid at https://console.groq.com/
- Service will fall back to rule-based parsing if Groq fails

### Issue: Kafka connection errors

- Kafka is optional - service works without it
- If you want Kafka features, ensure Kafka is running:
  ```bash
  # Check if Kafka is running (if using Docker)
  docker ps | grep kafka
  ```

### Issue: Missing dependencies

```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

## Stopping the Service

Press `CTRL+C` in the terminal where the service is running.

The service will gracefully shut down all background workers.

## Quick Start (All-in-One)

```bash
# 1. Navigate to directory
cd ai-recommendation

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies (if not already installed)
pip install -r requirements.txt

# 4. Ensure .env file exists with GROQ_API_KEY
#    (MySQL is required - ensure MySQL is running)

# 5. Start service
uvicorn app.main:app --reload --port 8005
```

## Integration with Main Application

The AI agent runs independently but integrates with the main Kayak application:

- **Frontend** connects to `http://localhost:8005/chat/ws/{user_id}`
- **API Gateway** can proxy requests to AI service
- **Other services** can call AI endpoints for recommendations

## Next Steps

1. **Test the chat interface** via WebSocket or HTTP
2. **Check proactive recommendations** - they appear every 2 minutes
3. **Monitor deal scanner** - new deals discovered every 5 minutes
4. **View logs** - check console output for worker activity
5. **Check database** - MySQL database `kayak` contains all data (flight_deals, hotel_deals, bundles)

## Additional Resources

- **Architecture**: See `MULTI_AGENT_ARCHITECTURE.md`
- **Groq Integration**: See `GROQ_INTEGRATION.md`
- **API Documentation**: http://localhost:8005/docs (when running)

## MySQL Advantages

✅ **No setup required** - Works out of the box  
✅ **No server needed** - File-based database  
✅ **Perfect for development** - Fast and lightweight  
✅ **Easy backup** - Just copy the `.db` file  
✅ **Portable** - Database file can be moved anywhere  

