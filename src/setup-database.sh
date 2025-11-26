#!/bin/bash

# Kayak System - Database Setup Script
# This script sets up and seeds the database

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "========================================="
echo " Kayak Database Setup"
echo "========================================="
echo -e "${NC}"

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Navigate to infra directory
cd "$(dirname "$0")/infra"

echo -e "${GREEN}🐳 Starting Docker containers...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for databases to be ready (30 seconds)...${NC}"
sleep 10
echo "   10 seconds..."
sleep 10
echo "   20 seconds..."
sleep 10
echo "   30 seconds..."

echo ""
echo -e "${GREEN}✅ Docker containers started!${NC}"
echo ""
docker-compose ps

echo ""
echo -e "${GREEN}📊 Checking database connections...${NC}"

# Check MySQL
echo -n "   MySQL: "
if docker exec kayak-mysql mysqladmin ping -h localhost -u root -ppassword --silent 2>/dev/null; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "Try running: docker-compose logs mysql"
    exit 1
fi

# Check MongoDB
echo -n "   MongoDB: "
if docker exec kayak-mongodb mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "Try running: docker-compose logs mongodb"
    exit 1
fi

# Check Redis
echo -n "   Redis: "
if docker exec kayak-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "Try running: docker-compose logs redis"
    exit 1
fi

echo ""
echo -e "${GREEN}🌱 Seeding additional data (1000+ records)...${NC}"
cd ../db

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi

# Run seed script
node seed-data.js

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your databases are ready with:"
echo "  ✅ MySQL: 1000+ users, 500+ flights, 200+ hotels, 200+ cars"
echo "  ✅ MongoDB: Reviews, images, logs, deals, bundles"
echo "  ✅ Redis: Ready for caching"
echo "  ✅ Kafka: Ready for messaging"
echo ""
echo "Next steps:"
echo "  1. Return to project root: cd .."
echo "  2. Start all services: ./start-all.sh"
echo "  3. Access frontend: http://localhost:3000"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

