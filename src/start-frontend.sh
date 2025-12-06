#!/bin/bash

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$BASE_DIR/.." && pwd)/frontend"
LOG_DIR="$BASE_DIR/logs"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to check if port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for port with timeout
wait_for_port() {
    local port=$1
    local max_wait=${2:-30}  # Default 30 seconds
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
        echo -n "."
    done
    return 1
}

echo ""
echo "🌐 Starting Frontend..."
cd "$FRONTEND_DIR"

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Frontend may already be running.${NC}"
    exit 0
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Start vite dev server
echo -e "${YELLOW}Starting Vite development server...${NC}"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
VITE_PID=$!

# Wait for port 3000 to be available (max 30 seconds)
echo -n "⏳ Waiting for frontend to start"
if wait_for_port 3000 30; then
    echo ""
    # Get the actual PID listening on port 3000
    pid=$(lsof -ti:3000 2>/dev/null | head -1)
    if [ -n "$pid" ]; then
        echo "$pid" > "$LOG_DIR/frontend.pid"
        echo -e "${GREEN}✅ Frontend started successfully!${NC}"
        echo -e "${GREEN}   URL: http://localhost:3000${NC}"
        echo -e "${GREEN}   PID: $pid${NC}"
    else
        echo "$VITE_PID" > "$LOG_DIR/frontend.pid"
        echo -e "${GREEN}✅ Frontend started (PID: $VITE_PID)${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
    echo -e "${YELLOW}📋 Check logs: $LOG_DIR/frontend.log${NC}"
    
    # Show last few lines of log for debugging
    if [ -f "$LOG_DIR/frontend.log" ]; then
        echo ""
        echo "Last 10 lines of frontend.log:"
        tail -10 "$LOG_DIR/frontend.log"
    fi
    
    # Kill the process if it's still running but not listening
    if ps -p $VITE_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing stale process $VITE_PID${NC}"
        kill $VITE_PID 2>/dev/null
    fi
    exit 1
fi
