#!/bin/bash

# Kayak System - Start All Services
# This script starts all backend services

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$BASE_DIR/services"

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
    
    # Start service in background with all required environment variables
    env MYSQL_HOST=${MYSQL_HOST} \
        MYSQL_PORT=${MYSQL_PORT} \
        MYSQL_USER=${MYSQL_USER} \
        MYSQL_PASSWORD=${MYSQL_PASSWORD} \
        MYSQL_DATABASE=${MYSQL_DATABASE} \
        KAFKA_BROKERS=${KAFKA_BROKERS} \
        JWT_SECRET=${JWT_SECRET} \
        MONGODB_URI=${MONGODB_URI} \
        REDIS_URL=${REDIS_URL} \
        npm run dev > "$BASE_DIR/logs/${service_name}.log" 2>&1 &
    echo $! > "$BASE_DIR/logs/${service_name}.pid"
    sleep 2
    echo -e "${GREEN}✅ $service_name started (PID: $(cat "$BASE_DIR/logs/${service_name}.pid"))${NC}"
}

# Create logs directory
mkdir -p "$BASE_DIR/logs"

# ============================================
# CONFIGURATION (Use existing env vars or defaults)
# ============================================
# These values can be overridden by setting them before running this script
# or by creating a .env file in the project root

# Set MySQL configuration for Docker MySQL
# (Docker MySQL is mapped to 3307 to avoid conflict with local MySQL on 3306)
export MYSQL_HOST=${MYSQL_HOST:-localhost}
export MYSQL_PORT=${MYSQL_PORT:-3307}
export MYSQL_USER=${MYSQL_USER:-root}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-password}
export MYSQL_DATABASE=${MYSQL_DATABASE:-kayak}

# Set Kafka broker for services running outside Docker
# Docker internal: kafka:9092, External: localhost:29092
export KAFKA_BROKERS=${KAFKA_BROKERS:-localhost:29092}

# Set JWT secret (must match across all services)
# IMPORTANT: Override this in production!
export JWT_SECRET=${JWT_SECRET:-your-secret-key}

# Set MongoDB URI
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/kayak}

# Set Redis URL
export REDIS_URL=${REDIS_URL:-redis://localhost:6379}

echo "📋 Configuration:"
echo "   MySQL:    ${MYSQL_HOST}:${MYSQL_PORT} (db: ${MYSQL_DATABASE})"
echo "   MongoDB:  ${MONGODB_URI}"
echo "   Kafka:    ${KAFKA_BROKERS}"
echo "   Redis:    ${REDIS_URL}"
echo ""

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

echo ""
echo -e "${GREEN}🎉 All services started!${NC}"
echo ""
echo "📍 Service URLs:"
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
