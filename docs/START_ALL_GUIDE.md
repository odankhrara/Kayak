# How to Start the Application Using start-all.sh

Complete guide for starting all services using the `start-all.sh` script.

---

## 🚀 Quick Start

### Option 1: Using Makefile (Recommended - Handles Everything)

```bash
# From project root
cd /Users/omdankhara5803/Test/Kayak

# Start everything (Docker + Backend + Frontend)
make start
```

This will:
1. Start Docker containers (MySQL, MongoDB, Redis, Kafka)
2. Wait for databases to be ready
3. Start all backend services
4. Start frontend
5. **Note:** AI Service needs to be started separately (see below)

---

### Option 2: Manual Step-by-Step

#### Step 1: Start Docker Infrastructure

```bash
cd /Users/omdankhara5803/Test/Kayak/src/infra
docker-compose up -d
```

This starts:
- MySQL (port 3307)
- MongoDB (port 27017)
- Redis (port 6379)
- Kafka (port 9092)
- Zookeeper (port 2181)

Wait 30-60 seconds for databases to initialize.

#### Step 2: Start Backend Services (using start-all.sh)

```bash
cd /Users/omdankhara5803/Test/Kayak/src
./start-all.sh
```

**What this script does:**
- Sets MySQL environment variables (host, port, credentials)
- Installs dependencies if needed
- Starts services in this order:
  1. API Gateway (port 4000)
  2. User Service (port 8001)
  3. Listing Service (port 8002)
  4. Booking-Billing Service (port 8003)
  5. Admin Service (port 8006)
  6. Analytics Service (port 8004)
  7. Frontend (port 3000)

**Output:**
```
🚀 Starting Kayak System...

📦 Starting Backend Services...

▶️  Starting api-gateway on port 4000...
✅ api-gateway started (PID: 12345)

▶️  Starting user-service on port 8001...
✅ user-service started (PID: 12346)

... (and so on)

🎉 All services started!

📍 Service URLs:
   - Frontend:        http://localhost:3000
   - API Gateway:     http://localhost:4000
   - User Service:    http://localhost:8001
   - Listing Service: http://localhost:8002
   - Booking Service: http://localhost:8003
   - Admin Service:   http://localhost:8006
   - Analytics:       http://localhost:8004
```

#### Step 3: Start AI Recommendation Service (Separate)

The `start-all.sh` script doesn't include the AI service. Start it manually:

```bash
cd /Users/omdankhara5803/Test/Kayak/ai-recommendation

# Activate virtual environment
source venv/bin/activate

# Start AI service
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

Or run it in the background:
```bash
cd /Users/omdankhara5803/Test/Kayak/ai-recommendation
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload > /tmp/ai-service.log 2>&1 &
echo $! > /tmp/ai-service.pid
```

---

## 📋 Complete Startup Checklist

### Prerequisites

- [ ] Docker Desktop is running
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] All dependencies installed (or script will install them)

### Startup Steps

1. **Start Docker Infrastructure**
   ```bash
   cd src/infra
   docker-compose up -d
   ```

2. **Wait for Databases** (30-60 seconds)
   ```bash
   # Check if ready
   docker ps | grep kayak
   ```

3. **Start Backend Services**
   ```bash
   cd src
   ./start-all.sh
   ```

4. **Start AI Service** (if needed)
   ```bash
   cd ai-recommendation
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
   ```

5. **Verify Services**
   ```bash
   # Check all ports
   lsof -i :3000,4000,8001,8002,8003,8004,8005,8006
   
   # Or use make status
   make status
   ```

---

## 🔍 What start-all.sh Does

### Environment Variables Set

The script automatically sets these MySQL connection variables:

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3307
export MYSQL_USER=root
export MYSQL_PASSWORD=password
export MYSQL_DATABASE=kayak
```

### Services Started

| Service | Port | Script Location |
|--------|------|-----------------|
| API Gateway | 4000 | `src/services/api-gateway` |
| User Service | 8001 | `src/services/user-service` |
| Listing Service | 8002 | `src/services/listing-service` |
| Booking-Billing Service | 8003 | `src/services/booking-billing-service` |
| Analytics Service | 8004 | `src/services/analytics-service` |
| Admin Service | 8006 | `src/services/admin-service` |
| Frontend | 3000 | `frontend` |

### Logs and PIDs

- **Logs**: `src/logs/*.log`
- **PID Files**: `src/logs/*.pid`

Each service logs to:
- `src/logs/api-gateway.log`
- `src/logs/user-service.log`
- `src/logs/listing-service.log`
- `src/logs/booking-billing-service.log`
- `src/logs/analytics-service.log`
- `src/logs/frontend.log`

---

## 🛑 Stopping Services

### Using stop-all.sh

```bash
cd /Users/omdankhara5803/Test/Kayak/src
./stop-all.sh
```

### Using Makefile

```bash
make stop
```

### Manual Stop

```bash
# Stop backend services
kill $(cat src/logs/*.pid)

# Stop AI service
pkill -f "uvicorn.*ai-recommendation"

# Stop Docker
cd src/infra
docker-compose down
```

---

## 🔧 Troubleshooting

### Port Already in Use

If a port is already in use, the script will skip that service:

```
⚠️  Port 4000 is already in use. Skipping api-gateway
```

**Solution:**
```bash
# Find and kill the process
lsof -ti:4000 | xargs kill -9

# Or use make kill-ports
make kill-ports
```

### Services Not Starting

**Check logs:**
```bash
# View all logs
tail -f src/logs/*.log

# View specific service log
tail -f src/logs/api-gateway.log
```

**Common Issues:**

1. **Docker not running**
   ```bash
   # Start Docker Desktop, then:
   cd src/infra
   docker-compose up -d
   ```

2. **Dependencies not installed**
   ```bash
   # The script installs automatically, but if it fails:
   cd src/services/api-gateway
   npm install
   ```

3. **Database not ready**
   ```bash
   # Wait longer, then check:
   docker exec kayak-mysql mysqladmin ping -h localhost -u root -ppassword
   ```

4. **Common package not built**
   ```bash
   cd src/services/common
   npm run build
   ```

---

## 📊 Service Status Check

### Quick Status

```bash
make status
```

### Detailed Check

```bash
# Check Docker containers
docker ps | grep kayak

# Check Node.js processes
ps aux | grep -E "node.*(api-gateway|user-service|listing-service)"

# Check ports
lsof -i :3000,4000,8001,8002,8003,8004,8005,8006

# Test endpoints
curl http://localhost:4000/health
curl http://localhost:8005/health
```

---

## 🎯 Complete Startup Script (All-in-One)

Create a custom script that includes AI service:

```bash
#!/bin/bash
# start-complete.sh - Start everything including AI service

echo "🚀 Starting Complete Kayak System..."

# 1. Start Docker
echo "📦 Starting Docker containers..."
cd src/infra
docker-compose up -d
cd ../..

# 2. Wait for databases
echo "⏳ Waiting for databases (30s)..."
sleep 30

# 3. Start backend services
echo "🔧 Starting backend services..."
cd src
./start-all.sh
cd ..

# 4. Start AI service
echo "🤖 Starting AI Recommendation Service..."
cd ai-recommendation
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload > /tmp/ai-service.log 2>&1 &
echo $! > /tmp/ai-service.pid
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Access URLs:"
echo "   - Frontend:        http://localhost:3000"
echo "   - API Gateway:     http://localhost:4000"
echo "   - AI Service:      http://localhost:8005"
echo "   - AI Service Docs: http://localhost:8005/docs"
```

Save as `start-complete.sh` and make executable:
```bash
chmod +x start-complete.sh
./start-complete.sh
```

---

## 📝 Summary

**To start using start-all.sh:**

1. **Start Docker:**
   ```bash
   cd src/infra && docker-compose up -d
   ```

2. **Run start-all.sh:**
   ```bash
   cd src && ./start-all.sh
   ```

3. **Start AI Service (separate):**
   ```bash
   cd ai-recommendation
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
   ```

**Or use Makefile (easiest):**
```bash
make start  # Starts Docker + Backend + Frontend
# Then manually start AI service
```

The `start-all.sh` script handles:
- ✅ Environment variable setup
- ✅ Dependency installation
- ✅ Service startup in correct order
- ✅ Port conflict detection
- ✅ Log file creation
- ✅ PID file management

**Note:** The AI service is not included in `start-all.sh` because it's a Python service with different requirements. Start it separately.
