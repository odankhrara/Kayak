#!/bin/bash

# Script to test /api/tracking/click endpoint and verify data in MongoDB

echo "🧪 Testing Click Tracking API"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if API Gateway is running
echo "1️⃣  Checking if API Gateway is running on port 4000..."
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is running${NC}"
else
    echo -e "${RED}❌ API Gateway is not running on port 4000${NC}"
    echo "   Please start it first: cd src/services/api-gateway && npm run dev"
    exit 1
fi

# Check if Analytics Service is running
echo ""
echo "2️⃣  Checking if Analytics Service is running on port 8004..."
if curl -s http://localhost:8004/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Analytics Service is running${NC}"
else
    echo -e "${YELLOW}⚠️  Analytics Service is not running on port 8004${NC}"
    echo "   Click events will be sent to Kafka but won't be stored in MongoDB"
fi

# Test the click tracking endpoint
echo ""
echo "3️⃣  Sending test click event to /api/tracking/click..."

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
TEST_CLICK_DATA=$(cat <<EOF
{
  "log_type": "click",
  "element_type": "button",
  "element_id": "test-button-$(date +%s)",
  "element_text": "Test Button",
  "page_url": "/test-page",
  "page_title": "Test Page",
  "timestamp": "$TIMESTAMP",
  "user_id": "test-user-123",
  "session_id": "test-session-$(date +%s)",
  "user_agent": "Mozilla/5.0 (Test Script)",
  "device_type": "desktop",
  "location": {
    "city": "San Jose",
    "state": "CA",
    "country": "USA"
  },
  "metadata": {
    "test": true,
    "source": "test-script"
  }
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4000/api/tracking/click \
  -H "Content-Type: application/json" \
  -d "$TEST_CLICK_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Click event sent successfully!${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Failed to send click event${NC}"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $BODY"
    exit 1
fi

# Wait a bit for Kafka and consumer to process
echo ""
echo "4️⃣  Waiting 3 seconds for Kafka consumer to process the event..."
sleep 3

# Check MongoDB
echo ""
echo "5️⃣  Checking MongoDB for the click event..."
echo "   Database: kayak"
echo "   Collection: logs"
echo "   Filter: log_type = 'click'"
echo ""

# Check if MongoDB is accessible
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    echo -e "${YELLOW}⚠️  MongoDB client (mongosh/mongo) not found in PATH${NC}"
    echo "   Please install MongoDB client or use Docker:"
    echo "   docker exec -it kayak-mongo mongosh kayak"
    exit 1
fi

# Query MongoDB
echo "   Recent click events (last 5):"
$MONGO_CMD kayak --quiet --eval "
db.logs.find(
  { log_type: 'click' },
  { 
    element_id: 1, 
    page_url: 1, 
    timestamp: 1, 
    user_id: 1,
    _id: 0 
  }
).sort({ timestamp: -1 }).limit(5).forEach(function(doc) {
  print('   - ' + doc.element_id + ' on ' + doc.page_url + ' at ' + doc.timestamp);
});
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ MongoDB query successful${NC}"
    echo ""
    echo "   To see full details, run:"
    echo "   $MONGO_CMD kayak --eval \"db.logs.find({log_type: 'click'}).sort({timestamp: -1}).limit(1).pretty()\""
else
    echo -e "${YELLOW}⚠️  Could not query MongoDB${NC}"
    echo "   Make sure MongoDB is running and accessible"
    echo "   Default connection: mongodb://localhost:27017"
fi

echo ""
echo "================================"
echo "✅ Test complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check Kafka logs if events aren't appearing in MongoDB"
echo "   2. Verify Analytics Service consumer is running"
echo "   3. Check MongoDB connection in Analytics Service logs"

