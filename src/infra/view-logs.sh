#!/bin/bash

# Script to view logs for all Kayak Docker containers

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Kayak Docker Container Logs Viewer${NC}"
echo "======================================"
echo ""

# Function to show logs for a container
show_logs() {
    local container=$1
    local name=$2
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${YELLOW}=== $name Logs ===${NC}"
        docker logs --tail 50 "$container" 2>&1 || echo "No logs available"
        echo ""
    else
        echo -e "${RED}Container $container not found${NC}"
        echo ""
    fi
}

# Check which containers exist
echo "Checking container status..."
echo ""

# Show status
echo -e "${GREEN}Container Status:${NC}"
docker ps -a --filter "name=kayak-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
echo ""

# Menu
echo "Select logs to view:"
echo "1) All containers (last 50 lines each)"
echo "2) MySQL"
echo "3) MongoDB"
echo "4) Redis"
echo "5) Zookeeper"
echo "6) Kafka"
echo "7) Follow logs (live updates)"
echo "8) All logs (full)"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        echo -e "${GREEN}Showing last 50 lines from all containers...${NC}"
        echo ""
        show_logs "kayak-mysql" "MySQL"
        show_logs "kayak-mongodb" "MongoDB"
        show_logs "kayak-redis" "Redis"
        show_logs "kayak-zookeeper" "Zookeeper"
        show_logs "kayak-kafka" "Kafka"
        ;;
    2)
        docker logs --tail 100 -f kayak-mysql 2>&1 || echo "Container not running"
        ;;
    3)
        docker logs --tail 100 -f kayak-mongodb 2>&1 || echo "Container not running"
        ;;
    4)
        docker logs --tail 100 -f kayak-redis 2>&1 || echo "Container not running"
        ;;
    5)
        docker logs --tail 100 -f kayak-zookeeper 2>&1 || echo "Container not running"
        ;;
    6)
        docker logs --tail 100 -f kayak-kafka 2>&1 || echo "Container not running"
        ;;
    7)
        echo -e "${GREEN}Following all container logs (Ctrl+C to exit)...${NC}"
        docker-compose -f docker-compose.yml logs -f
        ;;
    8)
        echo -e "${GREEN}Showing full logs from all containers...${NC}"
        echo ""
        show_logs "kayak-mysql" "MySQL"
        show_logs "kayak-mongodb" "MongoDB"
        show_logs "kayak-redis" "Redis"
        show_logs "kayak-zookeeper" "Zookeeper"
        show_logs "kayak-kafka" "Kafka"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

