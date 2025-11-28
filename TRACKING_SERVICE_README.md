# Tracking Service Implementation

## Overview

The tracking service receives user interaction events (clicks, page views, searches, booking attempts) from the frontend and publishes them to Kafka topics. The analytics service consumes these events and stores them in MongoDB for analysis.

## Architecture

```
Frontend (clickTracking.ts)
    ↓ HTTP POST
API Gateway (/api/tracking/*)
    ↓ Publishes to Kafka
Kafka Topics (click_event, user_tracking)
    ↓ Consumes events
Analytics Service (Kafka Consumers)
    ↓ Stores in MongoDB
MongoDB (logs collection)
```

## API Gateway Endpoints

### POST `/api/tracking/click`
Tracks click events on buttons, links, cards, listings, etc.

**Request Body:**
```json
{
  "log_type": "click",
  "element_type": "button|link|card|listing|property|other",
  "element_id": "book-now-btn",
  "element_text": "Book Now",
  "page_url": "/hotels/search",
  "page_title": "Hotel Search",
  "user_id": "123-45-6789",
  "session_id": "sess_abc123",
  "timestamp": "2024-11-26T10:30:00Z",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click event tracked"
}
```

### POST `/api/tracking/page-view`
Tracks page view events.

**Request Body:**
```json
{
  "log_type": "page_view",
  "page_url": "/hotels/search",
  "page_title": "Hotel Search",
  "referrer": "/home",
  "user_id": "123-45-6789",
  "session_id": "sess_abc123",
  "timestamp": "2024-11-26T10:30:00Z",
  "user_agent": "Mozilla/5.0...",
  "device_type": "desktop|mobile|tablet",
  "location": {
    "city": "San Jose",
    "state": "CA",
    "country": "USA"
  },
  "page_load_time": 1.5
}
```

### POST `/api/tracking/search`
Tracks search events.

**Request Body:**
```json
{
  "log_type": "search",
  "search_params": {
    "type": "hotel",
    "city": "San Jose",
    "check_in": "2024-12-10",
    "check_out": "2024-12-15"
  },
  "results_count": 25,
  "user_id": "123-45-6789",
  "session_id": "sess_abc123",
  "timestamp": "2024-11-26T10:30:00Z"
}
```

### POST `/api/tracking/booking-attempt`
Tracks booking attempt events.

**Request Body:**
```json
{
  "log_type": "booking_attempt",
  "element_id": "HT001",
  "element_type": "hotel",
  "user_id": "123-45-6789",
  "session_id": "sess_abc123",
  "timestamp": "2024-11-26T10:30:00Z",
  "metadata": {
    "price": 150.00,
    "property_type": "hotel"
  }
}
```

### POST `/api/tracking/event`
Generic event tracking endpoint that routes to appropriate Kafka topic based on `log_type`.

## Kafka Topics

### `click_event`
- **Purpose**: Click events on UI elements
- **Producer**: API Gateway tracking routes
- **Consumer**: Analytics Service (ClickEventsConsumer)
- **Storage**: MongoDB `logs` collection

### `user_tracking`
- **Purpose**: Page views, searches, booking attempts
- **Producer**: API Gateway tracking routes
- **Consumer**: Analytics Service (UserTrackingConsumer)
- **Storage**: MongoDB `logs` collection

## Analytics Service Consumers

### ClickEventsConsumer
- **Group ID**: `analytics-click-events-group`
- **Topic**: `click_event`
- **Action**: Stores click events in MongoDB `logs` collection

### UserTrackingConsumer
- **Group ID**: `analytics-user-tracking-group`
- **Topic**: `user_tracking`
- **Action**: Stores page views, searches, booking attempts in MongoDB `logs` collection

## Frontend Integration

The frontend uses `clickTracking.ts` utility to send events:

```typescript
import { trackClick, trackPageView, trackSearch, trackBookingAttempt } from './utils/clickTracking'

// Track a click
trackClick({
  elementType: 'button',
  elementId: 'book-now-btn',
  elementText: 'Book Now',
  pageUrl: window.location.pathname,
  pageTitle: document.title
})

// Track a page view
trackPageView(window.location.pathname, document.title)

// Track a search
trackSearch(
  { type: 'hotel', city: 'San Jose' },
  25 // results count
)

// Track a booking attempt
trackBookingAttempt('HT001', 'hotel', 150.00)
```

## MongoDB Schema

Events are stored in the `logs` collection with the following structure:

```javascript
{
  _id: ObjectId,
  log_type: "click|page_view|search|booking_attempt",
  user_id: "123-45-6789",
  session_id: "sess_abc123",
  timestamp: ISODate,
  page_url: "/hotels/search",
  page_title: "Hotel Search",
  element_type: "button",
  element_id: "book-now-btn",
  element_text: "Book Now",
  search_params: { ... },
  results_count: 25,
  user_agent: "Mozilla/5.0...",
  device_type: "desktop",
  location: {
    city: "San Jose",
    state: "CA",
    country: "USA"
  },
  metadata: {},
  created_at: ISODate
}
```

## Error Handling

- All tracking endpoints fail silently on the frontend (won't break user experience)
- Errors are logged on the backend
- Kafka producer errors are caught and logged
- Consumer errors are caught and logged (won't crash the service)

## Testing

### Test Click Tracking
```bash
curl -X POST http://localhost:4000/api/tracking/click \
  -H "Content-Type: application/json" \
  -d '{
    "element_type": "button",
    "element_id": "test-btn",
    "element_text": "Test Button",
    "page_url": "/test",
    "user_id": "123-45-6789",
    "session_id": "sess_test123"
  }'
```

### Test Page View Tracking
```bash
curl -X POST http://localhost:4000/api/tracking/page-view \
  -H "Content-Type: application/json" \
  -d '{
    "page_url": "/test",
    "page_title": "Test Page",
    "user_id": "123-45-6789",
    "session_id": "sess_test123"
  }'
```

## Monitoring

- Check Kafka consumer lag: Monitor consumer groups
- Check MongoDB logs collection: Verify events are being stored
- Check API Gateway logs: Verify events are being received
- Check Analytics Service logs: Verify consumers are processing events

## Files Created

1. **API Gateway**:
   - `src/services/api-gateway/src/routes/trackingRoutes.ts` - Tracking endpoints
   - `src/services/api-gateway/src/index.ts` - Added tracking routes

2. **Analytics Service**:
   - `src/services/analytics-service/src/consumers/clickEventsConsumer.ts` - Click events consumer
   - `src/services/analytics-service/src/consumers/userTrackingConsumer.ts` - User tracking consumer
   - `src/services/analytics-service/src/index.ts` - Initialize consumers

3. **Frontend**:
   - `frontend/src/utils/clickTracking.ts` - Tracking utility (already exists)

## Next Steps

1. Integrate click tracking into existing components:
   - Add `onClick` handlers that call `trackClick()`
   - Add `useEffect` hooks to track page views
   - Track searches in search forms
   - Track booking attempts in booking flow

2. Monitor and optimize:
   - Monitor Kafka consumer lag
   - Optimize MongoDB queries for analytics
   - Add indexes to logs collection for better performance

3. Add more event types as needed:
   - Form submissions
   - Filter changes
   - Sort changes
   - Error events

