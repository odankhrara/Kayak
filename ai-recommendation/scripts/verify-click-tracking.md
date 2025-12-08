# Quick Verification Commands

## 1. Test the API Endpoint

```bash
curl -X POST http://localhost:4000/api/tracking/click \
  -H "Content-Type: application/json" \
  -d '{
    "log_type": "click",
    "element_type": "button",
    "element_id": "verify-test",
    "element_text": "Verify Test",
    "page_url": "/verify",
    "user_id": "test-user",
    "session_id": "test-session",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

**Expected:** `{"success": true, "message": "Click event tracked"}`

## 2. Check MongoDB for Click Events

### Using mongosh (recommended)
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/kayak

# Or if using Docker
docker exec -it kayak-mongo mongosh kayak
```

### MongoDB Queries

```javascript
// 1. Count all click events
db.logs.countDocuments({ log_type: 'click' })

// 2. Get the most recent click events
db.logs.find({ log_type: 'click' })
  .sort({ timestamp: -1 })
  .limit(10)
  .pretty()

// 3. Get click events from the last hour
db.logs.find({
  log_type: 'click',
  timestamp: { $gte: new Date(Date.now() - 3600000) }
}).sort({ timestamp: -1 }).pretty()

// 4. Get click events for a specific page
db.logs.find({ 
  log_type: 'click',
  page_url: '/verify'
}).sort({ timestamp: -1 }).pretty()

// 5. Get click events by element type
db.logs.find({ 
  log_type: 'click',
  element_type: 'button'
}).sort({ timestamp: -1 }).limit(5).pretty()

// 6. Group clicks by page URL
db.logs.aggregate([
  { $match: { log_type: 'click' } },
  { $group: { 
      _id: '$page_url', 
      totalClicks: { $sum: 1 },
      uniqueUsers: { $addToSet: '$user_id' }
  }},
  { $project: {
      page: '$_id',
      clicks: '$totalClicks',
      uniqueUsers: { $size: '$uniqueUsers' }
  }},
  { $sort: { clicks: -1 } }
])
```

### One-liner MongoDB Queries

```bash
# Quick check - count click events
mongosh kayak --quiet --eval "db.logs.countDocuments({ log_type: 'click' })"

# Quick check - last 3 click events
mongosh kayak --quiet --eval "db.logs.find({ log_type: 'click' }).sort({ timestamp: -1 }).limit(3).forEach(doc => print(doc.element_id + ' on ' + doc.page_url + ' at ' + doc.timestamp))"
```

## 3. Check Service Logs

### API Gateway Logs
```bash
tail -f src/logs/api-gateway.log | grep -i "click\|kafka"
```

### Analytics Service Logs
```bash
tail -f src/logs/analytics-service.log | grep -i "click\|consumer"
```

## 4. Verify via Analytics API

```bash
# Get clicks per page (if you have admin token)
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 5. Check if Services are Running

```bash
# Check API Gateway (port 4000)
curl http://localhost:4000/health

# Check Analytics Service (port 8004)
curl http://localhost:8004/health

# Check if ports are listening
lsof -i :4000
lsof -i :8004
```

## Troubleshooting

### If API returns error:
1. Check Kafka is running: `docker ps | grep kafka`
2. Check API Gateway logs for Kafka connection errors
3. Verify Kafka broker URL in environment variables

### If data not in MongoDB:
1. Check Analytics Service consumer is running
2. Check Analytics Service logs for errors
3. Verify MongoDB connection: `mongosh mongodb://localhost:27017/kayak --eval "db.stats()"`

