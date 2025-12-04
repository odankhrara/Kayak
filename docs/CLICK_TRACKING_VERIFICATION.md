# Click Tracking Verification Guide

This guide shows how to verify that `/api/tracking/click` is working correctly and how to check the data in MongoDB.

## Quick Test Script

Run the automated test script:
```bash
./scripts/test-click-tracking.sh
```

## Manual Verification Steps

### 1. Test the API Endpoint Directly

Send a test click event to the API:

```bash
curl -X POST http://localhost:4000/api/tracking/click \
  -H "Content-Type: application/json" \
  -d '{
    "log_type": "click",
    "element_type": "button",
    "element_id": "test-button-123",
    "element_text": "Test Button",
    "page_url": "/test-page",
    "page_title": "Test Page",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "user_id": "test-user-123",
    "session_id": "test-session-456",
    "user_agent": "Mozilla/5.0 (Test)",
    "device_type": "desktop",
    "location": {
      "city": "San Jose",
      "state": "CA",
      "country": "USA"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Click event tracked"
}
```

### 2. Verify Data Flow

The click event goes through this pipeline:
1. **API Gateway** (`/api/tracking/click`) receives the request
2. **Kafka** - Event is published to `click_event` topic
3. **Analytics Service Consumer** - Consumes from Kafka
4. **MongoDB** - Stores in `logs` collection

### 3. Check Kafka (Optional)

If you have Kafka running, you can check if messages are being published:

```bash
# Using kafka-console-consumer (if Kafka is in Docker)
docker exec -it kayak-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic click_event \
  --from-beginning \
  --max-messages 1
```

### 4. Verify in MongoDB

#### Option A: Using mongosh (MongoDB Shell)

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/kayak

# Or if using Docker
docker exec -it kayak-mongo mongosh kayak
```

Then run these queries:

```javascript
// Count total click events
db.logs.countDocuments({ log_type: 'click' })

// Get recent click events (last 10)
db.logs.find({ log_type: 'click' })
  .sort({ timestamp: -1 })
  .limit(10)
  .pretty()

// Get click events for a specific page
db.logs.find({ 
  log_type: 'click',
  page_url: '/test-page'
}).sort({ timestamp: -1 }).pretty()

// Get click events by user
db.logs.find({ 
  log_type: 'click',
  user_id: 'test-user-123'
}).sort({ timestamp: -1 }).pretty()

// Get click events in a date range
db.logs.find({
  log_type: 'click',
  timestamp: {
    $gte: new Date('2024-01-01'),
    $lte: new Date()
  }
}).sort({ timestamp: -1 }).pretty()
```

#### Option B: Using MongoDB Compass

1. Connect to: `mongodb://localhost:27017`
2. Select database: `kayak`
3. Select collection: `logs`
4. Filter: `{ log_type: "click" }`

#### Option C: Using a MongoDB Query Script

```bash
mongosh kayak --eval "
db.logs.find({ log_type: 'click' })
  .sort({ timestamp: -1 })
  .limit(5)
  .forEach(function(doc) {
    print('Element: ' + doc.element_id);
    print('Page: ' + doc.page_url);
    print('User: ' + doc.user_id);
    print('Time: ' + doc.timestamp);
    print('---');
  });
"
```

### 5. Check Service Logs

#### API Gateway Logs
Check if the click event was received and published to Kafka:

```bash
# If running via start-backend.sh
tail -f src/logs/api-gateway.log

# Or if running directly
# Check the terminal where api-gateway is running
```

Look for:
- `📨 Sent message to topic click_event`
- `Click event tracked`

#### Analytics Service Logs
Check if the consumer processed the event:

```bash
# If running via start-backend.sh
tail -f src/logs/analytics-service.log

# Or if running directly
# Check the terminal where analytics-service is running
```

Look for:
- `Click events consumer started`
- `Click event stored: <element_id>`

### 6. Verify via Analytics API

Once data is in MongoDB, you can verify it via the analytics API:

```bash
# Get clicks per page (requires admin auth)
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer <admin-token>"

# Or test the endpoint directly (if no auth in dev)
# Check analytics-service/src/index.ts for auth requirements
```

## Troubleshooting

### Issue: API returns 200 but no data in MongoDB

**Possible causes:**
1. **Kafka not running** - Check if Kafka is accessible
   ```bash
   docker ps | grep kafka
   # Or
   lsof -i :9092
   ```

2. **Analytics Service consumer not running** - Check analytics service logs
   ```bash
   tail -f src/logs/analytics-service.log
   ```

3. **MongoDB connection issue** - Check MongoDB connection
   ```bash
   mongosh mongodb://localhost:27017/kayak --eval "db.stats()"
   ```

### Issue: Kafka connection errors

Check Kafka configuration:
- Default brokers: `kafka:9092,localhost:9092`
- Set `KAFKA_BROKERS` environment variable if needed

### Issue: MongoDB connection errors

Check MongoDB configuration:
- Default URI: `mongodb://localhost:27017`
- Database: `kayak`
- Collection: `logs`
- Set `MONGO_URL` or `MONGODB_URI` environment variable if needed

## Expected Data Structure in MongoDB

A click event document in MongoDB should look like:

```json
{
  "_id": ObjectId("..."),
  "log_type": "click",
  "element_type": "button",
  "element_id": "test-button-123",
  "element_text": "Test Button",
  "page_url": "/test-page",
  "page_title": "Test Page",
  "timestamp": ISODate("2024-12-03T10:30:00.000Z"),
  "created_at": ISODate("2024-12-03T10:30:00.123Z"),
  "user_id": "test-user-123",
  "session_id": "test-session-456",
  "user_agent": "Mozilla/5.0 (Test)",
  "device_type": "desktop",
  "location": {
    "city": "San Jose",
    "state": "CA",
    "country": "USA"
  },
  "metadata": {}
}
```

## Quick Verification Checklist

- [ ] API Gateway is running on port 4000
- [ ] Analytics Service is running on port 8004
- [ ] Kafka is running and accessible
- [ ] MongoDB is running and accessible
- [ ] Click event API returns 200 status
- [ ] Data appears in MongoDB `logs` collection
- [ ] Analytics API can query the data

