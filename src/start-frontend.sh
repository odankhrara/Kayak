#!/bin/bash

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$BASE_DIR/.." && pwd)/frontend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

echo ""
echo "🌐 Starting Frontend..."
cd "$FRONTEND_DIR"

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Frontend may already be running.${NC}"
else
    # Use Node.js SPA server to serve dist folder with routing support
    if [ -f "serve.js" ] && [ -d "dist" ]; then
        node serve.js > "$BASE_DIR/logs/frontend.log" 2>&1 &
        sleep 3
        pid=$(lsof -ti:3000)
        echo $pid > "$BASE_DIR/logs/frontend.pid"
        echo -e "${GREEN}✅ Frontend started with SPA routing (PID: $(cat "$BASE_DIR/logs/frontend.pid"))${NC}"
    elif [ -d "node_modules" ]; then
        # Fallback to npm run dev if source files exist
        npm run dev > "$BASE_DIR/logs/frontend.log" 2>&1 &
        sleep 3
        pid=$(lsof -ti:3000)
        echo $pid > "$BASE_DIR/logs/frontend.pid"
        echo -e "${GREEN}✅ Frontend started (PID: $(cat "$BASE_DIR/logs/frontend.pid"))${NC}"
    else
        echo -e "${RED}❌ Frontend dist folder or serve.js not found${NC}"
    fi
fi

