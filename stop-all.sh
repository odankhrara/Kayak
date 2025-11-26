#!/bin/bash

# Kayak System - Stop All Services

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$BASE_DIR/logs"

echo "🛑 Stopping Kayak System..."

if [ ! -d "$LOGS_DIR" ]; then
    echo "No services running (logs directory not found)"
    exit 0
fi

# Kill all processes from PID files
for pidfile in "$LOGS_DIR"/*.pid; do
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        service_name=$(basename "$pidfile" .pid)
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            rm "$pidfile"
        else
            echo "Service $service_name not running (stale PID file)"
            rm "$pidfile"
        fi
    fi
done

echo "✅ All services stopped"

