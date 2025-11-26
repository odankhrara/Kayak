# Kayak Simulation - Next Steps Implementation Plan

**Document Purpose:** Roadmap for completing remaining project requirements  
**Current Status Date:** November 26, 2025  
**Estimated Time to Complete:** 18-24 hours

---

## 📊 OVERALL PROJECT COMPLETION STATUS

### Current Progress by Track

| Track | Weight | Completed | Missing | Grade Impact | Status |
|-------|--------|-----------|---------|--------------|--------|
| **Track 1: Backend Services** | 40% | 90% | Unit tests | 36% ✅ | 🟢 Mostly Done |
| **Track 2: Database & Data** | Critical | 60% | Redis, 9K records | Foundation | 🟡 Needs Redis |
| **Track 3: Kafka Messaging** | 10% | 0% | Everything | 0% ❌ | 🔴 Not Started |
| **Track 4: AI Service** | 15% | 0% | Everything | 0% ❌ | 🔴 Not Started |
| **Track 5: Frontend/Admin** | 5% | 70% | Admin UI, Analytics | 3.5% ✅ | 🟡 User done, Admin missing |
| **Redis Caching** | 10% | 0% | Everything | 0% ❌ | 🔴 Not Started |
| **Performance Testing** | Required | 0% | 4 charts | Presentation | 🔴 Not Started |

**TOTAL PROJECT COMPLETION:** **~44-45%**

---

## 🎯 CRITICAL PATH (Must Complete)

### Priority 1: Infrastructure Requirements (CANNOT SKIP)
- ❌ **Redis Caching** (10% grade) - 2-3 hours
- ❌ **Kafka Messaging** (10% grade) - 4-5 hours
- ❌ **Performance Testing with 4 Charts** (Presentation requirement) - 2-3 hours

### Priority 2: Missing Features (HIGH VALUE)
- ❌ **AI Recommendation Service** (15% grade - highest single component!) - 8-12 hours
- ❌ **Admin Dashboard** (Project requirement) - 4-6 hours
- ❌ **Generate 9,000 more records** (10K requirement) - 1 hour

### Priority 3: Polish (NICE TO HAVE)
- ❌ **Unit tests for backend** - 3-4 hours
- ❌ **Reviews functionality** - 2-3 hours
- ❌ **WebSocket real-time updates** - 2 hours

---

## 📋 DETAILED NEXT STEPS BY TRACK

---

## 🔧 Track 2: Database & Data Layer (CRITICAL)

**Current Status:** 60% Complete  
**Time Needed:** 3-4 hours  
**Priority:** 🔴 CRITICAL (Redis is mandatory)

### ✅ What's Already Done
- MySQL schemas created
- MongoDB collections defined
- Docker Compose setup
- 1,000 seed records generated

### ❌ What Needs to Be Done

#### **Task 2.1: Redis Setup & Integration** (2-3 hours) 🔴 CRITICAL

##### Step 1: Add Redis to Docker Compose (15 min)
```yaml
# File: src/infra/docker-compose.yml
# Add this service:

redis:
  image: redis:7-alpine
  container_name: kayak_redis
  ports:
    - "6379:6379"
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  networks:
    - kayak_network

volumes:
  redis_data:
```

**Action:** 
```bash
cd src/infra
docker-compose up -d redis
docker ps | grep redis  # Verify running
```

##### Step 2: Install Redis Client (10 min)
```bash
# In services/common/
npm install redis
npm install @types/redis --save-dev
```

##### Step 3: Create Redis Client Wrapper (30 min)
```typescript
// File: src/services/common/src/cache/redisClient.ts

import { createClient, RedisClientType } from 'redis';

class RedisCache {
  private client: RedisClientType;
  private static instance: RedisCache;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.error('Redis Error:', err));
    this.client.on('connect', () => console.log('✅ Redis connected'));
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis DEL pattern error:', error);
    }
  }

  async disconnect() {
    await this.client.disconnect();
  }
}

export default RedisCache;
```

##### Step 4: Add Caching to Flight Service (30 min)
```typescript
// File: src/services/listing-service/src/services/flightService.ts

import RedisCache from '../../common/src/cache/redisClient';

class FlightService {
  private cache = RedisCache.getInstance();

  async search(filters: FlightSearchFilters): Promise<Flight[]> {
    // Generate cache key
    const cacheKey = `flights:search:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT for flights');
      return cached;
    }

    // Cache miss - query database
    console.log('❌ Cache MISS for flights - querying DB');
    const results = await this.flightRepository.search(filters);

    // Store in cache (5 minutes TTL)
    await this.cache.set(cacheKey, results, 300);

    return results;
  }

  async getById(flightId: string): Promise<Flight | null> {
    const cacheKey = `flight:${flightId}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const flight = await this.flightRepository.findById(flightId);
    if (flight) {
      await this.cache.set(cacheKey, flight, 600); // 10 min
    }

    return flight;
  }

  // Admin updates - invalidate cache
  async updateFlight(flightId: string, data: any): Promise<Flight> {
    const flight = await this.flightRepository.update(flightId, data);
    
    // Invalidate caches
    await this.cache.del(`flight:${flightId}`);
    await this.cache.delPattern('flights:search:*');
    
    return flight;
  }
}
```

##### Step 5: Add Caching to Hotel Service (20 min)
```typescript
// File: src/services/listing-service/src/services/hotelService.ts

// Same pattern as flights - cache search() and getById()
async search(filters: HotelSearchFilters): Promise<Hotel[]> {
  const cacheKey = `hotels:search:${JSON.stringify(filters)}`;
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const results = await this.hotelRepository.search(filters);
  await this.cache.set(cacheKey, results, 300);
  return results;
}
```

##### Step 6: Add Caching to Car Service (20 min)
```typescript
// File: src/services/listing-service/src/services/carService.ts

// Same pattern - cache search() and getById()
```

##### Step 7: Add Caching to User Service (20 min)
```typescript
// File: src/services/user-service/src/services/userService.ts

async getUserById(userId: string): Promise<User | null> {
  const cacheKey = `user:${userId}`;
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const user = await this.userRepository.findById(userId);
  if (user) {
    await this.cache.set(cacheKey, user, 1800); // 30 min
  }
  return user;
}

async updateUser(userId: string, data: any): Promise<User> {
  const user = await this.userRepository.update(userId, data);
  await this.cache.del(`user:${userId}`); // Invalidate
  return user;
}
```

##### Step 8: Initialize Redis on Server Start (10 min)
```typescript
// File: src/services/user-service/src/index.ts (and other services)

import RedisCache from './common/src/cache/redisClient';

async function startServer() {
  // Connect to Redis
  const redis = RedisCache.getInstance();
  await redis.connect();

  // Start Express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
```

**Testing:**
```bash
# Monitor Redis
docker exec -it kayak_redis redis-cli
> KEYS *
> GET "flights:search:..."
> TTL "flights:search:..."
```

---

#### **Task 2.2: Generate 9,000 More Seed Records** (1 hour)

##### Step 1: Update Seed Scripts (30 min)
```typescript
// File: src/scripts/seed-data.ts

// Change counts:
const NUM_USERS = 10000;      // was 100
const NUM_FLIGHTS = 10000;    // was 50
const NUM_HOTELS = 5000;      // was 30
const NUM_CARS = 2000;        // was 20
const NUM_BOOKINGS = 100000;  // was 100

// Use bulk inserts for performance:
const BATCH_SIZE = 1000;

async function seedUsers() {
  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
    const users = [];
    for (let j = 0; j < BATCH_SIZE && (i + j) < NUM_USERS; j++) {
      users.push(generateUser());
    }
    await db.query('INSERT INTO users VALUES ?', [users]);
    console.log(`Seeded ${i + users.length}/${NUM_USERS} users`);
  }
}
```

##### Step 2: Run Seed Script (30 min)
```bash
cd src/scripts
npm run seed
# Wait for completion (may take 5-10 min)

# Verify counts
mysql -u root -p -e "SELECT COUNT(*) FROM users;" kayak_db
mysql -u root -p -e "SELECT COUNT(*) FROM flights;" kayak_db
mysql -u root -p -e "SELECT COUNT(*) FROM bookings;" kayak_db
```

---

## 🔄 Track 3: Kafka & Messaging Infrastructure (CRITICAL)

**Current Status:** 0% Complete  
**Time Needed:** 4-5 hours  
**Priority:** 🔴 CRITICAL (10% of grade)

### ❌ What Needs to Be Done

#### **Task 3.1: Kafka Infrastructure Setup** (1 hour)

##### Step 1: Add Kafka to Docker Compose (15 min)
```yaml
# File: src/infra/docker-compose.yml

zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  container_name: kayak_zookeeper
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
  ports:
    - "2181:2181"
  networks:
    - kayak_network

kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: kayak_kafka
  depends_on:
    - zookeeper
  ports:
    - "9092:9092"
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
  networks:
    - kayak_network

kafka-ui:
  image: provectuslabs/kafka-ui:latest
  container_name: kayak_kafka_ui
  depends_on:
    - kafka
  ports:
    - "8080:8080"
  environment:
    KAFKA_CLUSTERS_0_NAME: local
    KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
  networks:
    - kayak_network
```

**Action:**
```bash
cd src/infra
docker-compose up -d zookeeper kafka kafka-ui
docker ps | grep kafka  # Verify running
```

##### Step 2: Install Kafka Client (10 min)
```bash
cd src/services/common
npm install kafkajs
npm install @types/kafkajs --save-dev
```

##### Step 3: Create Topics (15 min)
```bash
# Create script: src/scripts/create-kafka-topics.sh

docker exec -it kayak_kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic booking-requests \
  --partitions 3 \
  --replication-factor 1

docker exec -it kayak_kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic payment-events \
  --partitions 3 \
  --replication-factor 1

docker exec -it kayak_kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic notification-events \
  --partitions 2 \
  --replication-factor 1

docker exec -it kayak_kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --partitions 2 \
  --replication-factor 1

# Verify topics
docker exec -it kayak_kafka kafka-topics --list --bootstrap-server localhost:9092
```

##### Step 4: Test Kafka Connection (20 min)
```bash
# Producer test
docker exec -it kayak_kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic booking-requests

# Type: {"test": "message"} and hit Enter

# Consumer test (in another terminal)
docker exec -it kayak_kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-requests \
  --from-beginning

# Should see: {"test": "message"}
```

---

#### **Task 3.2: Kafka Producer Implementation** (1 hour)

##### Step 1: Create Producer Wrapper (30 min)
```typescript
// File: src/services/common/src/messaging/kafkaProducer.ts

import { Kafka, Producer, ProducerRecord } from 'kafkajs';

class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private static instance: KafkaProducer;

  private constructor() {
    this.kafka = new Kafka({
      clientId: 'kayak-producer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  static getInstance(): KafkaProducer {
    if (!KafkaProducer.instance) {
      KafkaProducer.instance = new KafkaProducer();
    }
    return KafkaProducer.instance;
  }

  async connect() {
    await this.producer.connect();
    console.log('✅ Kafka Producer connected');
  }

  async sendBookingRequest(booking: any) {
    await this.producer.send({
      topic: 'booking-requests',
      messages: [
        {
          key: booking.userId,
          value: JSON.stringify(booking),
          headers: { eventType: 'booking.created' },
        },
      ],
    });
    console.log(`📤 Sent booking request: ${booking.bookingId}`);
  }

  async sendPaymentEvent(payment: any) {
    await this.producer.send({
      topic: 'payment-events',
      messages: [
        {
          key: payment.userId,
          value: JSON.stringify(payment),
          headers: { eventType: 'payment.processed' },
        },
      ],
    });
  }

  async sendNotification(notification: any) {
    await this.producer.send({
      topic: 'notification-events',
      messages: [
        {
          value: JSON.stringify(notification),
          headers: { eventType: 'notification.send' },
        },
      ],
    });
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

export default KafkaProducer;
```

##### Step 2: Integrate Producer in Booking Service (30 min)
```typescript
// File: src/services/booking-billing-service/src/services/bookingService.ts

import KafkaProducer from '../../common/src/messaging/kafkaProducer';

class BookingService {
  private kafkaProducer = KafkaProducer.getInstance();

  async createBooking(data: CreateBookingData) {
    // 1. Create booking in DB (existing logic)
    const booking = await this.bookingRepository.create(data);
    const billing = await this.billingRepository.create(data);

    // 2. Send to Kafka for async processing
    await this.kafkaProducer.sendBookingRequest({
      bookingId: booking.bookingId,
      userId: booking.userId,
      type: booking.bookingType,
      amount: booking.totalAmount,
      timestamp: new Date().toISOString(),
    });

    // 3. Send payment event
    await this.kafkaProducer.sendPaymentEvent({
      billingId: billing.billingId,
      userId: booking.userId,
      amount: billing.totalAmount,
      method: billing.paymentMethod,
      timestamp: new Date().toISOString(),
    });

    return { booking, billing };
  }
}
```

---

#### **Task 3.3: Kafka Consumer Implementation** (1.5 hours)

##### Step 1: Create Consumer Wrapper (40 min)
```typescript
// File: src/services/common/src/messaging/kafkaConsumer.ts

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(groupId: string) {
    this.kafka = new Kafka({
      clientId: 'kayak-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect() {
    await this.consumer.connect();
    console.log('✅ Kafka Consumer connected');
  }

  async subscribe(topics: string[]) {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📥 Subscribed to topic: ${topic}`);
    }
  }

  async run(handler: (payload: EachMessagePayload) => Promise<void>) {
    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error('❌ Error processing message:', error);
          // Could add retry logic or dead letter queue
        }
      },
    });
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}

export default KafkaConsumer;
```

##### Step 2: Create Notification Consumer (50 min)
```typescript
// File: src/services/notification-service/src/consumers/notificationConsumer.ts

import KafkaConsumer from '../../common/src/messaging/kafkaConsumer';

async function startNotificationConsumer() {
  const consumer = new KafkaConsumer('notification-group');
  await consumer.connect();
  await consumer.subscribe(['booking-requests', 'payment-events']);

  await consumer.run(async ({ topic, partition, message }) => {
    const value = JSON.parse(message.value?.toString() || '{}');

    if (topic === 'booking-requests') {
      console.log(`📧 Sending booking confirmation email to user ${value.userId}`);
      // await emailService.sendBookingConfirmation(value);
      
      // For now, just log
      console.log(`✅ Notification sent for booking ${value.bookingId}`);
    }

    if (topic === 'payment-events') {
      console.log(`📧 Sending payment receipt to user ${value.userId}`);
      // await emailService.sendPaymentReceipt(value);
      
      console.log(`✅ Notification sent for payment ${value.billingId}`);
    }
  });
}

// Start consumer
startNotificationConsumer().catch(console.error);
```

##### Step 3: Start Consumer as Background Process (20 min)
```json
// File: src/services/notification-service/package.json

{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "consumer": "ts-node src/consumers/notificationConsumer.ts",
    "start": "concurrently \"npm run dev\" \"npm run consumer\""
  }
}
```

```bash
npm install concurrently --save-dev
npm start  # Runs both server and consumer
```

---

#### **Task 3.4: Testing & Monitoring** (30 min)

##### Step 1: Test Message Flow (15 min)
```bash
# 1. Create a booking via API
curl -X POST http://localhost:4000/api/bookings/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId": "...", "bookingType": "flight", ...}'

# 2. Check Kafka UI
# Open http://localhost:8080
# Topics → booking-requests → Messages
# Should see your booking message

# 3. Check consumer logs
# Should see: "📧 Sending booking confirmation email..."
# Should see: "✅ Notification sent for booking..."
```

##### Step 2: Monitor Consumer Lag (15 min)
```bash
# Check consumer group status
docker exec -it kayak_kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group notification-group \
  --describe

# Should show LAG = 0 (all messages processed)
```

---

## 🤖 Track 4: AI Recommendation Service (FastAPI)

**Current Status:** 0% Complete  
**Time Needed:** 8-12 hours (or 4-6 hours for MVP)  
**Priority:** 🟡 HIGH VALUE (15% of grade) - Can be simplified for MVP

### ❌ What Needs to Be Done

#### **Option A: Full Implementation** (10-12 hours)

All the steps from the project requirements:
- Download Kaggle datasets
- Build Deals Agent with Kafka
- Build Concierge Agent with chat
- FastAPI + WebSocket
- SQLModel database

#### **Option B: MVP Version** (4-6 hours) - RECOMMENDED

Simplified version that still demonstrates AI capabilities:

##### Step 1: Setup FastAPI Project (30 min)
```bash
# Create new directory
mkdir src/services/ai-service
cd src/services/ai-service

# Initialize Python project
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install fastapi uvicorn pydantic sqlmodel
pip install pandas numpy

# Create structure
mkdir -p src/{models,services,routes}
touch src/__init__.py src/main.py
```

##### Step 2: Create Pydantic Models (30 min)
```python
# File: ai-service/src/models/schemas.py

from pydantic import BaseModel
from typing import List, Optional

class TripRequest(BaseModel):
    origin: str
    destination: str
    check_in: str
    check_out: str
    budget: float
    passengers: int
    preferences: Optional[List[str]] = []

class Deal(BaseModel):
    id: str
    type: str  # flight or hotel
    name: str
    price: float
    original_price: float
    discount_pct: float
    score: int  # 0-100

class Bundle(BaseModel):
    flight: Deal
    hotel: Deal
    total_price: float
    savings: float
    fit_score: int
    explanation: str

class BundleResponse(BaseModel):
    bundles: List[Bundle]
    message: str
```

##### Step 3: Create Simple Deal Logic (1 hour)
```python
# File: ai-service/src/services/deal_service.py

import random
from typing import List
from ..models.schemas import Deal, Bundle, TripRequest

class DealService:
    def find_deals(self, request: TripRequest) -> List[Bundle]:
        """
        Simplified: Query main Kayak DB for flights/hotels
        and calculate if they're "deals"
        """
        # For MVP: Connect to main MySQL DB
        flights = self.get_flights_from_main_db(request)
        hotels = self.get_hotels_from_main_db(request)
        
        # Calculate deals (simple rule: <avg price = deal)
        flight_deals = self.calculate_deals(flights, 'flight')
        hotel_deals = self.calculate_deals(hotels, 'hotel')
        
        # Create bundles
        bundles = self.create_bundles(flight_deals, hotel_deals, request)
        
        return bundles
    
    def calculate_deals(self, items: List, item_type: str) -> List[Deal]:
        """Mark items below average price as deals"""
        if not items:
            return []
        
        avg_price = sum(item['price'] for item in items) / len(items)
        
        deals = []
        for item in items:
            if item['price'] < avg_price * 0.85:  # 15% below avg
                discount = ((avg_price - item['price']) / avg_price) * 100
                score = min(100, int(discount * 2))  # Score: 0-100
                
                deals.append(Deal(
                    id=item['id'],
                    type=item_type,
                    name=item['name'],
                    price=item['price'],
                    original_price=avg_price,
                    discount_pct=discount,
                    score=score
                ))
        
        return sorted(deals, key=lambda x: x.score, reverse=True)[:10]
    
    def create_bundles(self, flights: List[Deal], hotels: List[Deal], 
                      request: TripRequest) -> List[Bundle]:
        """Combine flights and hotels into bundles"""
        bundles = []
        
        for flight in flights[:3]:  # Top 3 flights
            for hotel in hotels[:3]:  # Top 3 hotels
                total = flight.price + hotel.price
                savings = (flight.original_price + hotel.original_price) - total
                
                if total <= request.budget:
                    fit_score = self.calculate_fit_score(flight, hotel, request)
                    
                    bundles.append(Bundle(
                        flight=flight,
                        hotel=hotel,
                        total_price=total,
                        savings=savings,
                        fit_score=fit_score,
                        explanation=self.generate_explanation(flight, hotel, savings)
                    ))
        
        return sorted(bundles, key=lambda x: x.fit_score, reverse=True)[:5]
    
    def calculate_fit_score(self, flight: Deal, hotel: Deal, 
                          request: TripRequest) -> int:
        """Simple fit score based on price vs budget and deal scores"""
        price_fit = 100 - int((flight.price + hotel.price) / request.budget * 100)
        deal_score = (flight.score + hotel.score) / 2
        
        return int((price_fit * 0.4) + (deal_score * 0.6))
    
    def generate_explanation(self, flight: Deal, hotel: Deal, savings: float) -> str:
        """Generate simple explanation"""
        return f"Save ${savings:.0f} with this bundle. " \
               f"{flight.name} is {flight.discount_pct:.0f}% off, " \
               f"{hotel.name} is {hotel.discount_pct:.0f}% off."
```

##### Step 4: Create FastAPI Routes (45 min)
```python
# File: ai-service/src/routes/ai_routes.py

from fastapi import APIRouter, HTTPException
from ..models.schemas import TripRequest, BundleResponse
from ..services.deal_service import DealService

router = APIRouter(prefix="/ai", tags=["AI"])
deal_service = DealService()

@router.post("/recommendations", response_model=BundleResponse)
async def get_recommendations(request: TripRequest):
    """
    Get AI-powered travel recommendations
    """
    try:
        bundles = deal_service.find_deals(request)
        
        if not bundles:
            return BundleResponse(
                bundles=[],
                message="No deals found for your criteria. Try adjusting your budget or dates."
            )
        
        return BundleResponse(
            bundles=bundles,
            message=f"Found {len(bundles)} great bundle deals for you!"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-recommendation"}
```

##### Step 5: Create Main FastAPI App (30 min)
```python
# File: ai-service/src/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import ai_routes

app = FastAPI(
    title="Kayak AI Recommendation Service",
    description="AI-powered travel deal finder and bundle creator",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(ai_routes.router)

@app.get("/")
async def root():
    return {
        "service": "Kayak AI Recommendation Service",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
```

##### Step 6: Add to Docker Compose (30 min)
```yaml
# File: src/infra/docker-compose.yml

ai-service:
  build: ../services/ai-service
  container_name: kayak_ai_service
  ports:
    - "5000:5000"
  environment:
    - DATABASE_URL=mysql://root:password@mysql:3306/kayak_db
  depends_on:
    - mysql
  networks:
    - kayak_network
```

##### Step 7: Test AI Service (30 min)
```bash
# Start service
cd ai-service
source venv/bin/activate
python -m src.main

# Test endpoint
curl -X POST http://localhost:5000/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "SFO",
    "destination": "JFK",
    "check_in": "2025-12-01",
    "check_out": "2025-12-05",
    "budget": 1500,
    "passengers": 2,
    "preferences": ["pet-friendly"]
  }'

# Should return bundle recommendations
```

**MVP Done:** Shows AI capability without full Kafka/WebSocket complexity

---

## 🎨 Track 5: Frontend & Admin Dashboard

**Current Status:** 70% Complete (User features done, Admin missing)  
**Time Needed:** 4-6 hours  
**Priority:** 🟡 REQUIRED (Admin dashboard is project requirement)

### ✅ What's Already Done
- User registration/login
- Flight/Hotel/Car search & booking
- Booking history
- Profile management
- Beautiful UI with glassmorphism

### ❌ What Needs to Be Done

#### **Task 5.1: Admin Dashboard** (4-6 hours)

##### Step 1: Create Admin Pages (2 hours)

**File Structure:**
```
frontend/src/pages/admin/
├── AdminDashboard.tsx     (Overview with charts)
├── AdminListings.tsx      (Manage flights/hotels/cars)
├── AdminUsers.tsx         (Manage users)
├── AdminBilling.tsx       (View billing records)
└── AdminAnalytics.tsx     (Revenue charts)
```

##### Step 2: Admin Dashboard Overview (45 min)
```tsx
// File: frontend/src/pages/admin/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Card from '../../components/common/Card';

const AdminDashboard = () => {
  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/api/admin/analytics'),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-slate-500">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">
              {analytics?.totalUsers || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-slate-500">Total Bookings</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.totalBookings || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-slate-500">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600">
              ${analytics?.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-slate-500">Active Listings</p>
            <p className="text-3xl font-bold text-orange-600">
              {analytics?.activeListings || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-4">Monthly Revenue</h2>
        <BarChart width={800} height={300} data={analytics?.monthlyRevenue || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#3b82f6" />
        </BarChart>
      </Card>

      {/* Top Properties */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Top 10 Properties by Revenue</h2>
        <BarChart width={800} height={300} data={analytics?.topProperties || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#10b981" />
        </BarChart>
      </Card>
    </div>
  );
};

export default AdminDashboard;
```

##### Step 3: Admin Listings Management (1 hour)
```tsx
// File: frontend/src/pages/admin/AdminListings.tsx

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const AdminListings = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars'>('flights');

  const { data: listings, refetch } = useQuery({
    queryKey: ['admin-listings', activeTab],
    queryFn: () => api.get(`/api/admin/${activeTab}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/${activeTab}/${id}`),
    onSuccess: () => {
      toast.success('Listing deleted');
      refetch();
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Listings</h1>
        <Button onClick={() => navigate(`/admin/${activeTab}/new`)}>
          Add New {activeTab}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {['flights', 'hotels', 'cars'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-xl font-semibold capitalize ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'glass hover:bg-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Listings Table */}
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings?.map((listing) => (
              <tr key={listing.id} className="border-b">
                <td className="p-4">{listing.id}</td>
                <td className="p-4">{listing.name}</td>
                <td className="p-4">${listing.price}</td>
                <td className="p-4">
                  <span className="badge badge-green">Active</span>
                </td>
                <td className="p-4 space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(listing.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminListings;
```

##### Step 4: Admin Users Management (45 min)
```tsx
// File: frontend/src/pages/admin/AdminUsers.tsx

// Similar structure to AdminListings but for users
// Table showing: User ID, Name, Email, Join Date, Bookings Count
// Actions: View Details, Edit, Disable
```

##### Step 5: Admin Analytics Charts (1 hour)
```tsx
// File: frontend/src/pages/admin/AdminAnalytics.tsx

import { PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminAnalytics = () => {
  // Fetch analytics data
  const { data } = useQuery({
    queryKey: ['admin-detailed-analytics'],
    queryFn: () => api.get('/api/admin/analytics/detailed'),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics & Reports</h1>

      {/* City-wise Revenue */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-4">City-wise Revenue</h2>
        <BarChart width={800} height={300} data={data?.cityRevenue || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#8b5cf6" />
        </BarChart>
      </Card>

      {/* Booking Type Distribution */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-4">Booking Type Distribution</h2>
        <PieChart width={400} height={300}>
          <Pie
            data={data?.bookingTypes || []}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data?.bookingTypes?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </Card>

      {/* Daily Bookings Trend */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Daily Bookings (Last 30 Days)</h2>
        <LineChart width={800} height={300} data={data?.dailyBookings || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="bookings" stroke="#3b82f6" />
        </LineChart>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
```

##### Step 6: Add Admin Routes & Protection (30 min)
```tsx
// File: frontend/src/App.tsx

// Add admin routes
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="listings" element={<AdminListings />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="billing" element={<AdminBilling />} />
</Route>
```

##### Step 7: Backend Admin APIs (1 hour)
```typescript
// File: src/services/user-service/src/controllers/adminController.ts

router.get('/admin/analytics', requireAdmin, async (req, res) => {
  const totalUsers = await db.query('SELECT COUNT(*) FROM users');
  const totalBookings = await db.query('SELECT COUNT(*) FROM bookings');
  const totalRevenue = await db.query('SELECT SUM(total_amount) FROM billing');
  
  const monthlyRevenue = await db.query(`
    SELECT DATE_FORMAT(booking_date, '%Y-%m') as month,
           SUM(total_amount) as revenue
    FROM bookings b
    JOIN billing bill ON b.booking_id = bill.booking_id
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  
  const topProperties = await db.query(`
    SELECT entity_id, COUNT(*) as bookings, SUM(total_amount) as revenue
    FROM bookings b
    JOIN billing bill ON b.booking_id = bill.booking_id
    GROUP BY entity_id
    ORDER BY revenue DESC
    LIMIT 10
  `);

  res.json({
    totalUsers: totalUsers[0].count,
    totalBookings: totalBookings[0].count,
    totalRevenue: totalRevenue[0].sum,
    monthlyRevenue,
    topProperties,
  });
});
```

---

## 📊 Performance Testing (REQUIRED for Presentation)

**Current Status:** 0% Complete  
**Time Needed:** 2-3 hours  
**Priority:** 🔴 CRITICAL (Required 4 charts for presentation)

### Task: Generate Performance Comparison Charts

#### Step 1: Install Apache JMeter (30 min)
```bash
# Download from https://jmeter.apache.org/download_jmeter.cgi
# Or use Homebrew (Mac)
brew install jmeter

# Verify
jmeter --version
```

#### Step 2: Create JMeter Test Plan (1 hour)
```xml
<!-- File: src/performance/search-test.jmx -->

<!-- Configure:
  - Thread Group: 100 concurrent users
  - HTTP Request: GET /api/listings/flights/search
  - Duration: 60 seconds
  - Ramp-up: 10 seconds
-->
```

#### Step 3: Run 4 Test Scenarios (1 hour)

```bash
# Scenario B: Base (no caching, no Kafka)
# Stop Redis and Kafka, restart services
docker-compose stop redis kafka
npm run dev
jmeter -n -t search-test.jmx -l results-base.jtl

# Scenario B+S: Base + SQL Caching (Redis)
docker-compose start redis
# Restart services to enable Redis
jmeter -n -t search-test.jmx -l results-redis.jtl

# Scenario B+S+K: Base + Redis + Kafka
docker-compose start kafka
# Restart services to enable Kafka
jmeter -n -t search-test.jmx -l results-kafka.jtl

# Scenario B+S+K+O: All optimizations
# Add connection pooling, query optimization
jmeter -n -t search-test.jmx -l results-optimized.jtl
```

#### Step 4: Generate Charts (30 min)
```python
# File: src/performance/generate_charts.py

import pandas as pd
import matplotlib.pyplot as plt

# Read JMeter results
base = pd.read_csv('results-base.jtl')
redis = pd.read_csv('results-redis.jtl')
kafka = pd.read_csv('results-kafka.jtl')
optimized = pd.read_csv('results-optimized.jtl')

# Chart 1: Response Time Comparison
scenarios = ['B', 'B+S', 'B+S+K', 'B+S+K+O']
avg_times = [
    base['elapsed'].mean(),
    redis['elapsed'].mean(),
    kafka['elapsed'].mean(),
    optimized['elapsed'].mean()
]

plt.bar(scenarios, avg_times)
plt.title('Average Response Time (ms)')
plt.ylabel('Time (ms)')
plt.savefig('chart1_response_time.png')

# Chart 2: Throughput Comparison
# Chart 3: Error Rate Comparison
# Chart 4: Resource Utilization
```

---

## ⏰ RECOMMENDED IMPLEMENTATION ORDER

### **Phase 1: Infrastructure (Day 1 - 6-7 hours)**
1. Redis setup & integration (2-3 hours) 🔴 CRITICAL
2. Kafka setup & basic integration (4-5 hours) 🔴 CRITICAL

**Checkpoint:** Test B vs B+S vs B+S+K performance

---

### **Phase 2: Admin Dashboard (Day 2 - 4-6 hours)**
3. Admin pages (2 hours)
4. Admin backend APIs (1 hour)
5. Analytics charts (1-2 hours) 🔴 CRITICAL
6. Testing admin features (1 hour)

**Checkpoint:** Admin can manage listings, view analytics

---

### **Phase 3: AI Service MVP (Day 3 - 4-6 hours)** 
7. FastAPI setup (1 hour)
8. Simple deal detection (2 hours)
9. Bundle creation (1 hour)
10. API endpoints (1 hour)
11. Testing (1 hour)

**Checkpoint:** AI service returns bundle recommendations

---

### **Phase 4: Performance Testing (Day 4 - 2-3 hours)**
12. JMeter test plans (1 hour)
13. Run 4 scenarios (1 hour) 🔴 CRITICAL
14. Generate 4 charts (30 min) 🔴 CRITICAL
15. Document results (30 min)

**Checkpoint:** Have 4 performance charts ready

---

### **Phase 5: Polish & Testing (Day 5 - 4 hours)**
16. Seed 10K records (1 hour)
17. E2E testing (1 hour)
18. Bug fixes (1 hour)
19. Documentation (1 hour)

---

## 🎯 MINIMUM VIABLE SUBMISSION

**If you only have 12-15 hours left, do THIS:**

1. ✅ **Redis** (2-3 hours) - Can't skip
2. ✅ **Kafka Basic Setup** (2 hours) - Minimal integration
3. ✅ **Admin Dashboard** (3-4 hours) - Basic version with charts
4. ✅ **Performance Testing** (2 hours) - Generate 4 charts
5. ✅ **Seed 10K records** (1 hour)
6. ✅ **Testing & Bug fixes** (2 hours)

**Skip AI Service** if needed (take -15% hit rather than fail infrastructure)

---

## 📝 DELIVERABLES CHECKLIST

### Required for Submission
- ✅ Database schemas (MySQL + MongoDB) ← Done
- ✅ User CRUD with validation ← Done
- ✅ Flight/Hotel/Car search & booking ← Done
- ✅ Payment processing ← Done
- ✅ Frontend with booking flow ← Done
- ❌ **Redis caching** ← TODO (CRITICAL)
- ❌ **Kafka messaging** ← TODO (CRITICAL)
- ❌ **Admin dashboard with charts** ← TODO (CRITICAL)
- ❌ **Performance testing (4 charts)** ← TODO (CRITICAL)
- ❌ **10,000+ records** ← TODO (need 9K more)
- ❌ **AI Service** ← TODO (15% of grade)

### Required for Presentation
- ❌ **4 Performance Charts** (B, B+S, B+S+K, B+S+K+O)
- ✅ Live demo of booking flow
- ❌ Admin analytics demo
- ❌ AI recommendations demo

---

**Estimated Total Time to Complete All:** 18-24 hours  
**Estimated Time for MVP:** 12-15 hours

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025

