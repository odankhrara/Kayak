#!/bin/bash

# Kayak System - Start All Services
# This script starts all backend services and the frontend

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$BASE_DIR/services"
FRONTEND_DIR="$(cd "$BASE_DIR/.." && pwd)/frontend"

echo "🚀 Starting Kayak System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is already in use. Skipping $service_name${NC}"
        return
    fi
    
    echo -e "${GREEN}▶️  Starting $service_name on port $port...${NC}"
    cd "$service_dir"
    
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install --silent
    fi
    
    # Start service in background with MySQL environment variables
    env MYSQL_HOST=${MYSQL_HOST} MYSQL_PORT=${MYSQL_PORT} MYSQL_USER=${MYSQL_USER} MYSQL_PASSWORD=${MYSQL_PASSWORD} MYSQL_DATABASE=${MYSQL_DATABASE} npm run dev > "$BASE_DIR/logs/${service_name}.log" 2>&1 &
    echo $! > "$BASE_DIR/logs/${service_name}.pid"
    sleep 2
    echo -e "${GREEN}✅ $service_name started (PID: $(cat "$BASE_DIR/logs/${service_name}.pid"))${NC}"
}

# Create logs directory
mkdir -p "$BASE_DIR/logs"

# Set MySQL configuration for Docker MySQL on port 3307
# (Docker MySQL is mapped to 3307 because system MySQL uses 3306)
export MYSQL_HOST=localhost
export MYSQL_PORT=3307
export MYSQL_USER=root
export MYSQL_PASSWORD=password
export MYSQL_DATABASE=kayak

# Check Docker
if ! docker ps >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Services will start but may fail to connect to databases.${NC}"
    echo -e "${YELLOW}   Please start Docker Desktop and run: docker-compose up -d${NC}"
    echo ""
fi

# Start services in order
echo "📦 Starting Backend Services..."
echo ""

# 1. Common (no server, just dependencies)
cd "$SERVICES_DIR/common"
if [ ! -d "node_modules" ]; then
    echo "Installing common dependencies..."
    npm install --silent
fi

# 2. API Gateway
start_service "api-gateway" "$SERVICES_DIR/api-gateway" 4000

# 3. User Service
start_service "user-service" "$SERVICES_DIR/user-service" 8001

# 4. Listing Service
start_service "listing-service" "$SERVICES_DIR/listing-service" 8002

# 5. Booking-Billing Service
start_service "booking-billing-service" "$SERVICES_DIR/booking-billing-service" 8003

# 6. Admin Service
start_service "admin-service" "$SERVICES_DIR/admin-service" 8006

# 7. Analytics Service
start_service "analytics-service" "$SERVICES_DIR/analytics-service" 8004

# 8. Frontend
echo ""
echo "🌐 Starting Frontend..."
cd "$FRONTEND_DIR"

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Frontend may already be running.${NC}"
else
    # Use Node.js SPA server to serve dist folder with routing support
    if [ -f "serve.js" ] && [ -d "dist" ]; then
        node serve.js > "$BASE_DIR/logs/frontend.log" 2>&1 &
        echo $! > "$BASE_DIR/logs/frontend.pid"
        sleep 3
        echo -e "${GREEN}✅ Frontend started with SPA routing (PID: $(cat "$BASE_DIR/logs/frontend.pid"))${NC}"
    elif [ -d "node_modules" ]; then
        # Fallback to npm run dev if source files exist
        npm run dev > "$BASE_DIR/logs/frontend.log" 2>&1 &
        echo $! > "$BASE_DIR/logs/frontend.pid"
        sleep 3
        echo -e "${GREEN}✅ Frontend started (PID: $(cat "$BASE_DIR/logs/frontend.pid"))${NC}"
    else
        echo -e "${RED}❌ Frontend dist folder or serve.js not found${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 All services started!${NC}"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:        http://localhost:3000"
echo "   - API Gateway:     http://localhost:4000"
echo "   - User Service:    http://localhost:8001"
echo "   - Listing Service: http://localhost:8002"
echo "   - Booking Service: http://localhost:8003"
echo "   - Admin Service:   http://localhost:8006"
echo "   - Analytics:       http://localhost:8004"
echo ""
echo "📋 Logs are in: $BASE_DIR/logs/"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo "Or manually: kill \$(cat logs/*.pid)"
