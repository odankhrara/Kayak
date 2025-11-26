#!/bin/bash

# Script to start Kafka container with proper configuration

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Kafka Container${NC}"
echo "========================"
echo ""

cd "$(dirname "$0")"

# Check if port 9092 is in use
if lsof -Pi :9092 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Port 9092 is already in use.${NC}"
    echo "Checking what's using it..."
    lsof -i :9092 | head -5
    echo ""
    read -p "Do you want to stop the existing process and start Kafka? (y/n): " answer
    if [ "$answer" = "y" ]; then
        echo "Stopping existing Kafka container..."
        docker stop kayak-kafka 2>/dev/null || true
        docker rm kayak-kafka 2>/dev/null || true
        # Try to kill process on port 9092
        lsof -ti :9092 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Ensure Zookeeper is running first
echo "Checking Zookeeper..."
if ! docker ps --format '{{.Names}}' | grep -q "^kayak-zookeeper$"; then
    echo "Starting Zookeeper first..."
    docker-compose up -d zookeeper
    echo "Waiting for Zookeeper to be healthy..."
    sleep 10
fi

# Start Kafka
echo "Starting Kafka container..."
docker-compose up -d kafka

echo ""
echo "Waiting for Kafka to start..."
sleep 5

# Check status
if docker ps --format '{{.Names}}' | grep -q "^kayak-kafka$"; then
    echo -e "${GREEN}✓ Kafka container is running!${NC}"
    echo ""
    echo "Container status:"
    docker ps --filter "name=kayak-kafka" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "View logs with:"
    echo "  docker logs -f kayak-kafka"
    echo "  or"
    echo "  ./view-logs.sh"
else
    echo -e "${RED}✗ Kafka container failed to start${NC}"
    echo ""
    echo "Checking logs..."
    docker logs kayak-kafka --tail 50
    exit 1
fi

