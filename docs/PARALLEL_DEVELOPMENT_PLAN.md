# Kayak Simulation - 5 Parallel Development Tracks

**Timeline:** 6-13 days  
**Strategy:** Maximum parallelization with clear integration points  
**Team Size:** Minimum 5 developers (1 per track)

---

## Overview of 5 Parallel Tracks

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT KICKOFF (Day 1 AM)                   │
│        All team members: Architecture review & task setup       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   TRACK 1    │     │   TRACK 2    │     │   TRACK 3    │
│   Backend    │     │   Database   │     │    Kafka     │
│   Services   │     │   & Data     │     │  Messaging   │
│  (Core APIs) │     │    Layer     │     │Infrastructure│
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   TRACK 4    │     │   TRACK 5    │     │              │
│  AI Service  │     │   Frontend   │     │              │
│  (FastAPI)   │     │  & Admin UI  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            INTEGRATION PHASE (Days 9-11)                        │
│        Connect all components, E2E testing, bug fixes           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         DEPLOYMENT & DOCUMENTATION (Days 12-13)                 │
│       AWS deployment, performance testing, presentation         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Track 1: Backend Services (Core Business Logic)

### 👤 **Team Member:** Backend Developer 1
### ⏱️ **Duration:** Days 1-8 (Independent → Integration)
### 🎯 **Priority:** HIGH (40% of grade - Basic operation)

### Responsibilities
Build REST APIs for core booking functionality using Node.js/Express or Python/Flask.

### Components to Build
1. **User Service** (Day 1-2)
   - CRUD operations for users
   - Validation (SSN, state, ZIP, email)
   - Profile image handling (upload to MongoDB)
   - Authentication & JWT tokens
   
2. **Flight Service** (Day 3-4)
   - Flight search with filters
   - Flight booking logic
   - Seat availability management
   - Admin: Add/edit flights
   
3. **Hotel Service** (Day 4-5)
   - Hotel search with filters
   - Room availability management
   - Booking logic
   - Admin: Add/edit hotels
   
4. **Car Service** (Day 5-6)
   - Car search with filters
   - Availability management
   - Booking logic
   - Admin: Add/edit cars
   
5. **Billing Service** (Day 6-7)
   - Payment processing
   - Transaction management
   - Invoice generation
   - Transaction rollback handling

### Technology Stack
- **Framework:** Node.js + Express OR Python + Flask
- **DB Client:** mysql2 / PyMySQL, mongodb driver
- **Validation:** Joi / Pydantic
- **Testing:** Jest / Pytest

### Key Deliverables
- ✅ REST API endpoints (see API_DESIGN_DOCUMENT.md)
- ✅ Input validation with error handling
- ✅ Database models/DAO layer
- ✅ Unit tests for each service
- ✅ Postman collection for testing

### Integration Points
- **Day 3:** Connect to MySQL/MongoDB (from Track 2)
- **Day 5:** Add Kafka producers (integrate with Track 3)
- **Day 9:** Frontend integration (with Track 5)

### Mock Data Strategy (Days 1-2)
- Use in-memory data structures initially
- Switch to real DB once Track 2 provides schemas
- Use mock Kafka initially, integrate real Kafka later

---

## Track 2: Database & Data Layer

### 👤 **Team Member:** Database Engineer / Backend Developer 2
### ⏱️ **Duration:** Days 1-8 (Heavy front-loaded)
### 🎯 **Priority:** CRITICAL (Foundation for all services)

### Responsibilities
Design, create, and populate databases with test data. Set up Redis caching.

### Components to Build

#### Phase 1: Schema Design & Setup (Days 1-2)
1. **MySQL Setup**
   - Install MySQL (Docker preferred)
   - Create database and all tables (see DATABASE_SCHEMA.md)
   - Define indexes, foreign keys, constraints
   - Create schema diagram
   
2. **MongoDB Setup**
   - Install MongoDB (Docker preferred)
   - Create collections with validation
   - Define indexes (including TTL for logs)
   - Create schema samples

3. **Redis Setup**
   - Install Redis (Docker preferred)
   - Configure for caching
   - Set up connection pooling

#### Phase 2: Data Population (Days 3-5)
4. **Seed Data Generation**
   - Generate 10,000+ users (faker.js/Faker Python)
   - Generate 10,000+ flights
   - Generate 5,000+ hotels with rooms
   - Generate 2,000+ cars
   - Generate 100,000+ bookings/billing records
   - Generate reviews, images, logs in MongoDB
   
5. **Data Validation Scripts**
   - Verify data integrity
   - Check foreign key relationships
   - Validate formats (SSN, ZIP, state)

#### Phase 3: Caching Layer (Days 6-7)
6. **Redis Integration**
   - Implement caching utilities
   - Cache user profiles
   - Cache search results
   - Cache popular listings
   - Implement cache invalidation logic

#### Phase 4: Performance Testing (Day 8)
7. **Database Performance**
   - Test query performance with 10K+ records
   - Optimize slow queries
   - Add missing indexes
   - Connection pool tuning

### Technology Stack
- **MySQL:** 8.0+ (Docker)
- **MongoDB:** 6.0+ (Docker)
- **Redis:** 7.0+ (Docker)
- **Tools:** MySQL Workbench, MongoDB Compass
- **Seeding:** faker.js / Faker (Python)

### Key Deliverables
- ✅ MySQL database with all tables and 10K+ records
- ✅ MongoDB collections with sample documents
- ✅ Redis configured and ready
- ✅ Schema diagrams (ER diagram for MySQL)
- ✅ Seed data scripts (repeatable)
- ✅ Database creation scripts (SQL + JS)
- ✅ Caching utility functions

### Integration Points
- **Day 2:** Provide DB schemas to Track 1
- **Day 3:** Provide DB connection details to all tracks
- **Day 6:** Integrate Redis with Track 1 services
- **Day 8:** Performance testing with Track 1

### Docker Compose Setup (Day 1)
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: kayak_simulation
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/mysql:/docker-entrypoint-initdb.d
  
  mongodb:
    image: mongo:6.0
    ports: ["27017:27017"]
    volumes:
      - mongo_data:/data/db
      - ./scripts/mongo:/docker-entrypoint-initdb.d
  
  redis:
    image: redis:7.0
    ports: ["6379:6379"]
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  mongo_data:
  redis_data:
```

---

## Track 3: Kafka & Messaging Infrastructure

### 👤 **Team Member:** DevOps Engineer / Backend Developer 3
### ⏱️ **Duration:** Days 1-8
### 🎯 **Priority:** HIGH (10% of grade - Distributed services + performance)

### Responsibilities
Set up Kafka infrastructure, create topics, implement producer/consumer patterns.

### Components to Build

#### Phase 1: Kafka Setup (Days 1-2)
1. **Kafka Installation**
   - Set up Kafka + Zookeeper (Docker)
   - Configure brokers
   - Set up Kafka UI (optional but helpful)
   
2. **Topic Creation**
   - user-events
   - booking-requests
   - payment-processing
   - notification-events
   - raw_supplier_feeds
   - deals.normalized
   - deals.scored
   - deals.tagged
   - deal.events
   
3. **Configuration**
   - Partitions (3-5 per topic)
   - Replication factor (2 for fault tolerance)
   - Retention policies

#### Phase 2: Producer Implementation (Days 3-5)
4. **Frontend Service Producers**
   - User service producer (user events)
   - Booking service producer (booking requests)
   - Payment service producer (payment events)
   - Generic producer utility
   
5. **AI Service Producers**
   - Deals agent producer (normalized deals)
   - Feed ingestion producer

#### Phase 3: Consumer Implementation (Days 5-7)
6. **Backend Service Consumers**
   - Booking consumer (process booking requests)
   - Payment consumer (process payments)
   - Notification consumer (send notifications)
   - Consumer groups for parallelism
   
7. **AI Service Consumers**
   - Deal detector consumer
   - Offer tagger consumer
   - aiokafka for Python async consumers

#### Phase 4: Monitoring & Testing (Day 8)
8. **Kafka Monitoring**
   - Set up Kafka lag monitoring
   - Consumer group status
   - Throughput metrics
   - Error handling and retries

### Technology Stack
- **Kafka:** 3.0+ (Docker)
- **Zookeeper:** 3.8+ (Docker)
- **Node.js:** kafkajs library
- **Python:** aiokafka library
- **UI:** Kafka UI (optional)

### Key Deliverables
- ✅ Kafka cluster running (Docker)
- ✅ All topics created and configured
- ✅ Producer utilities for all services
- ✅ Consumer implementations with error handling
- ✅ Message schemas documented
- ✅ Monitoring dashboard (optional)
- ✅ Testing scripts for message flow

### Integration Points
- **Day 3:** Provide Kafka connection details to all tracks
- **Day 5:** Integrate producers with Track 1 services
- **Day 6:** Integrate consumers with Track 1 services
- **Day 7:** Integrate with Track 4 (AI service)
- **Day 10:** Performance testing with 100 concurrent users

### Docker Compose Setup (Day 1)
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"
  
  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
  
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

---

## Track 4: AI Recommendation Service (FastAPI)

### 👤 **Team Member:** AI/ML Developer / Python Developer
### ⏱️ **Duration:** Days 1-8 (Can start immediately)
### 🎯 **Priority:** HIGH (15% of grade!)

### Responsibilities
Build agentic AI recommendation service with FastAPI, Pydantic, SQLModel.

### Components to Build

#### Phase 1: Data Preparation (Days 1-2)
1. **Dataset Download & Preparation**
   - Download Kaggle datasets:
     - Inside Airbnb (NYC)
     - Hotel Booking Demand
     - Flight Price Prediction
     - Global Airports
   - Clean and normalize data
   - Set up SQLModel with SQLite/PostgreSQL
   
2. **Pydantic Models**
   - Define schemas for hotels, flights, deals, bundles
   - Request/response models for API endpoints
   - Validation rules

#### Phase 2: Deals Agent (Backend Worker) (Days 3-5)
3. **Feed Ingestion Component**
   - Read CSV data
   - Kafka producer to `raw_supplier_feeds`
   - Data normalization
   - Produce to `deals.normalized`
   
4. **Deal Detector Component**
   - Kafka consumer for `deals.normalized`
   - Implement deal detection rules:
     - Price ≤ 0.85 × 30-day average
     - Limited inventory (<5)
     - Promotional periods
   - Calculate Deal Score (0-100)
   - Produce to `deals.scored`
   
5. **Offer Tagger Component**
   - Kafka consumer for `deals.scored`
   - Add tags: pet-friendly, near-transit, refundable, etc.
   - Produce to `deals.tagged`
   
6. **Scheduled Scanning**
   - Set up cron job or Celery for periodic scans
   - Update deals database

#### Phase 3: Concierge Agent (Chat-Facing) (Days 5-7)
7. **Intent Understanding**
   - Parse natural language queries
   - Extract: dates, budget, origin, destination, preferences
   - Ask clarifying questions (max 1)
   
8. **Trip Planner**
   - Query cached deals from SQLModel database
   - Compose flight + hotel bundles
   - Calculate Fit Score
   - Rank bundles
   
9. **Explanation Generator**
   - Generate "Why this" (≤25 words)
   - Generate "What to watch" (≤12 words)
   - Use template-based snippets
   
10. **Policy Q&A**
    - Answer questions about cancellation, pets, parking
    - Query metadata from listings

#### Phase 4: FastAPI & WebSockets (Day 7-8)
11. **HTTP Endpoints**
    - POST /ai/chat (conversational interface)
    - GET /ai/bundles (get recommendations)
    - POST /ai/watch (set price watch)
    
12. **WebSocket Endpoint**
    - WS /ai/events (real-time updates)
    - Push price drops, inventory alerts
    - Integration with Kafka `deal.events` topic

### Technology Stack
- **Framework:** FastAPI
- **Models:** Pydantic v2
- **Database:** SQLModel (SQLite locally, PostgreSQL for production)
- **Messaging:** aiokafka
- **Scheduling:** APScheduler or Celery
- **WebSockets:** FastAPI native support

### Key Deliverables
- ✅ Kaggle datasets downloaded and processed
- ✅ SQLModel database with deals
- ✅ Deals Agent (feed ingestion, detection, tagging)
- ✅ Concierge Agent (chat, planner, explanations)
- ✅ FastAPI endpoints (HTTP + WebSocket)
- ✅ Deal scoring algorithm
- ✅ Bundle creation logic
- ✅ Watch/alert system
- ✅ API documentation (auto-generated by FastAPI)

### Integration Points
- **Day 3:** Connect to Kafka (from Track 3)
- **Day 5:** Use main system's flight/hotel data (from Track 1)
- **Day 9:** Frontend WebSocket integration (with Track 5)

### Can Work Independently Because:
- ✅ Uses separate database (SQLite initially)
- ✅ Uses Kaggle datasets (external data)
- ✅ Can mock Kafka initially
- ✅ Has clear API interface
- ✅ Minimal dependencies on other services

---

## Track 5: Frontend & Admin Dashboard

### 👤 **Team Member:** Frontend Developer
### ⏱️ **Duration:** Days 1-10 (Longer timeline, iterative)
### 🎯 **Priority:** MEDIUM (5% of grade, but essential for demo)

### Responsibilities
Build user-facing web application and admin dashboard.

### Components to Build

#### Phase 1: Project Setup (Day 1)
1. **Framework Setup**
   - Choose: React (recommended) / Vue / Angular
   - Set up project with Vite/Create React App
   - Configure routing (React Router)
   - Set up state management (Redux/Context API)
   - Configure API client (Axios)
   
2. **Design System**
   - Choose UI library: Material-UI / Ant Design / Tailwind
   - Set up theme/styling
   - Create reusable components (Button, Card, Input, etc.)

#### Phase 2: User Module (Days 2-3)
3. **Authentication Pages**
   - Login page
   - Registration page
   - JWT token handling
   
4. **User Profile**
   - View profile
   - Edit profile (all fields)
   - Profile image upload
   - Payment details management

#### Phase 3: Search & Booking (Days 4-6)
5. **Flight Search & Booking**
   - Search form (origin, destination, dates)
   - Filters (price, time, class, airline)
   - Results display with sorting
   - Flight details page
   - Booking form (passenger details)
   - Payment page
   - Confirmation page
   
6. **Hotel Search & Booking**
   - Search form (city, dates, guests)
   - Filters (price, stars, amenities)
   - Results display with images
   - Hotel details page with gallery
   - Room selection
   - Booking & payment
   
7. **Car Search & Booking**
   - Search form (location, dates)
   - Filters (type, price, transmission)
   - Results display
   - Car details
   - Booking & payment

#### Phase 4: User Dashboard (Day 7)
8. **Booking History**
   - Past bookings
   - Current bookings
   - Future bookings
   - Cancellation option
   
9. **Reviews**
   - Submit reviews for completed bookings
   - View own reviews

#### Phase 5: Admin Dashboard (Days 8-9)
10. **Admin Authentication**
    - Admin login
    - Role-based access control
    
11. **Listing Management**
    - Add/Edit flights
    - Add/Edit hotels
    - Add/Edit cars
    - View all listings
    
12. **User Management**
    - View all users
    - Search users
    - Edit user details
    
13. **Billing Management**
    - Search billings
    - View billing details
    - Generate reports
    
14. **Analytics Dashboard**
    - Top 10 properties by revenue (chart)
    - City-wise revenue (chart)
    - Top 10 hosts/providers (chart)
    - Clicks per page (chart)
    - Property clicks (chart)
    - Reviews visualization
    - User trace diagrams

#### Phase 6: AI Recommendation UI (Day 9-10)
15. **Chat Interface**
    - Chat UI for Concierge Agent
    - Message bubbles
    - Loading states
    
16. **Bundle Display**
    - Recommended bundles as cards
    - Comparison view
    - Explanation tooltips
    
17. **WebSocket Integration**
    - Connect to /ai/events
    - Show real-time price alerts
    - Show inventory alerts
    
18. **Watch Management**
    - Set price watches
    - View active watches
    - Notification badges

### Technology Stack
- **Framework:** React 18+ (with Vite)
- **Routing:** React Router 6
- **State:** Redux Toolkit / Zustand / Context API
- **UI Library:** Material-UI or Ant Design
- **Charts:** Recharts / Chart.js / D3.js
- **HTTP Client:** Axios
- **WebSockets:** native WebSocket API or socket.io-client
- **Forms:** React Hook Form + Yup validation

### Key Deliverables
- ✅ User authentication & profile management
- ✅ Flight/Hotel/Car search & booking flows
- ✅ Booking history & reviews
- ✅ Payment interface
- ✅ Admin dashboard (listing, user, billing management)
- ✅ Analytics dashboard with charts
- ✅ AI chat interface with WebSocket
- ✅ Responsive design (mobile-friendly)
- ✅ Error handling & loading states

### Integration Points
- **Day 3:** Connect to backend APIs (from Track 1)
- **Day 7:** Connect to admin APIs (from Track 1)
- **Day 9:** Connect to AI service (from Track 4)
- **Day 10:** WebSocket integration for real-time updates

### Can Start Immediately Because:
- ✅ Can use mock data initially
- ✅ Can build UI components independently
- ✅ Can use API contract (from API_DESIGN_DOCUMENT.md)
- ✅ Mock API responses until backend is ready

---

## Integration Timeline

### Day 9: First Integration Point
**Goal:** Connect all components for the first time

#### Morning (Database + Backend)
- ✅ Track 1 connects to Track 2 databases
- ✅ Test all CRUD operations
- ✅ Verify data flow

#### Afternoon (Backend + Kafka)
- ✅ Track 1 integrates Track 3 Kafka producers
- ✅ Track 1 integrates Track 3 Kafka consumers
- ✅ Test async message flow

### Day 10: Full Integration
**Goal:** End-to-end functionality

#### Morning (Frontend + Backend)
- ✅ Track 5 connects to Track 1 APIs
- ✅ Test user flows (register, login, search, book)
- ✅ Fix CORS issues, authentication issues

#### Afternoon (AI Service Integration)
- ✅ Track 5 connects to Track 4 AI service
- ✅ Test chat interface
- ✅ Test WebSocket real-time updates
- ✅ Track 4 integrates with Track 3 Kafka

### Day 11: E2E Testing & Bug Fixes
**Goal:** Everything working together

#### All Day
- ✅ Test complete booking flows
- ✅ Test admin dashboard
- ✅ Test AI recommendations
- ✅ Test payment processing
- ✅ Test Redis caching
- ✅ Test error scenarios
- ✅ Bug fixes and polish

---

## Performance Testing Timeline

### Day 10: Base Performance (B)
- ✅ Populate DB with 10K+ records
- ✅ Run JMeter with 100 concurrent users
- ✅ Measure baseline performance
- ✅ Identify bottlenecks

### Day 11: Optimized Performance
- ✅ **B + S:** Add Redis caching, measure improvement
- ✅ **B + S + K:** Add Kafka async processing, measure improvement
- ✅ **B + S + K + Other:** Add connection pooling, query optimization, measure improvement

### Day 12: Create Performance Graphs
- ✅ Generate 4 bar charts comparing:
  - Response time (avg, p95, p99)
  - Throughput (requests/second)
  - Error rate
  - Resource utilization

---

## Deployment Timeline

### Day 12: Docker & Local Deployment
**All Tracks**
- ✅ Create Dockerfiles for each service
- ✅ Create master docker-compose.yml
- ✅ Test local Docker deployment
- ✅ Fix any Docker-related issues

### Day 12-13: AWS Deployment
**Track 3 Lead (DevOps)**
- ✅ Set up AWS infrastructure:
  - ECS or EKS cluster
  - RDS (MySQL)
  - DocumentDB or MongoDB Atlas
  - ElastiCache (Redis)
  - MSK (Kafka) or self-hosted
  - Load balancers
- ✅ Deploy all containers
- ✅ Configure environment variables
- ✅ Test deployed system
- ✅ Set up monitoring (CloudWatch)

---

## Daily Standup Schedule

**Time:** 9:00 AM daily (15 minutes)

**Format:**
- Track 1: Yesterday / Today / Blockers
- Track 2: Yesterday / Today / Blockers
- Track 3: Yesterday / Today / Blockers
- Track 4: Yesterday / Today / Blockers
- Track 5: Yesterday / Today / Blockers
- Quick discussion of integration points

---

## Communication & Collaboration

### Shared Resources
1. **API Design Document** (All tracks reference this)
2. **Database Schema Document** (Tracks 1, 2, 4 reference this)
3. **Kafka Message Schemas** (Tracks 1, 3, 4 reference this)
4. **GitHub Repository** (All tracks commit here)
5. **Postman Collection** (Tracks 1, 4, 5 use this)

### Communication Channels
- **Slack/Discord:** Daily updates, quick questions
- **GitHub Issues:** Bug tracking, feature requests
- **GitHub PRs:** Code reviews (quick reviews, <1 hour turnaround)
- **Shared Doc:** Blockers, decisions, notes

### Conflict Resolution
- Database schema changes: Track 2 lead decides (notify all)
- API changes: Track 1 lead decides (notify Track 5)
- Kafka schema changes: Track 3 lead decides (notify all)
- Technical debt: Discuss in standup, prioritize after MVP

---

## Risk Mitigation by Track

### Track 1 Risks
| Risk | Mitigation |
|------|-----------|
| Waiting for DB | Use in-memory mock data initially |
| Waiting for Kafka | Use mock Kafka, add real Kafka later |
| Validation logic complex | Use validation library (Joi/Pydantic) |
| Performance issues | Profile early, optimize queries, add caching |

### Track 2 Risks
| Risk | Mitigation |
|------|-----------|
| Data generation slow | Use bulk inserts, parallelize generation |
| Schema changes | Version schemas, use migrations |
| Performance issues | Add indexes early, test with large data |

### Track 3 Risks
| Risk | Mitigation |
|------|-----------|
| Kafka setup complex | Use Docker, follow tutorials |
| Message schema changes | Version messages, backward compatibility |
| Consumer lag | Monitor lag, add more consumers |

### Track 4 Risks
| Risk | Mitigation |
|------|-----------|
| Kaggle datasets large | Download early, use subsets for development |
| Deal detection logic complex | Start simple, iterate |
| WebSocket issues | Test WebSocket separately first |
| Integration with main system | Can work independently, integrate later |

### Track 5 Risks
| Risk | Mitigation |
|------|-----------|
| Waiting for backend | Use mock APIs, switch to real APIs later |
| UI complexity | Use UI library, don't reinvent wheel |
| WebSocket issues | Test with mock WebSocket server first |
| Time-consuming | Focus on core flows, minimal styling initially |

---

## Success Criteria by Track

### Track 1 Success
- ✅ All REST endpoints working (Postman tests pass)
- ✅ Validation working (SSN, state, ZIP)
- ✅ Booking flows complete (flight, hotel, car)
- ✅ Payment processing working
- ✅ Admin APIs working
- ✅ Unit tests passing (>70% coverage)

### Track 2 Success
- ✅ MySQL with 10K+ users, flights, hotels, cars
- ✅ MongoDB with reviews, images, logs
- ✅ Redis configured and working
- ✅ Schema diagrams created
- ✅ Seed scripts working (repeatable)
- ✅ Queries performing well (<100ms for common queries)

### Track 3 Success
- ✅ Kafka cluster running
- ✅ All topics created
- ✅ Producers working
- ✅ Consumers working
- ✅ Message flow tested
- ✅ Error handling working
- ✅ Performance acceptable (<10ms latency)

### Track 4 Success
- ✅ Deals Agent finding deals from Kaggle data
- ✅ Concierge Agent responding to queries
- ✅ Bundles being created
- ✅ FastAPI endpoints working
- ✅ WebSocket pushing real-time updates
- ✅ Deal scoring algorithm working
- ✅ API documentation generated

### Track 5 Success
- ✅ User can register, login, view profile
- ✅ User can search flights, hotels, cars
- ✅ User can book and pay
- ✅ User can view booking history
- ✅ Admin can manage listings
- ✅ Admin can view analytics (charts working)
- ✅ AI chat interface working
- ✅ Responsive design

---

## Weekly Schedule (Condensed View)

### Week 1 (Days 1-7)

| Day | Track 1 (Backend) | Track 2 (Database) | Track 3 (Kafka) | Track 4 (AI) | Track 5 (Frontend) |
|-----|-------------------|--------------------|-----------------|--------------|--------------------|
| **1** | User Service | MySQL/Mongo setup | Kafka setup | Dataset download | Project setup |
| **2** | User Service | Seed data prep | Topic creation | Pydantic models | Auth pages |
| **3** | Flight Service | Seed 10K+ records | Producer impl. | Feed ingestion | User profile |
| **4** | Hotel Service | Seed continued | Producer impl. | Deal detector | Flight search UI |
| **5** | Car Service | Seed MongoDB docs | Consumer impl. | Offer tagger | Hotel search UI |
| **6** | Billing Service | Redis setup | Consumer impl. | Concierge agent | Car search UI |
| **7** | Testing & fixes | Caching impl. | Testing | Trip planner | Booking flows |

### Week 2 (Days 8-13)

| Day | Track 1 (Backend) | Track 2 (Database) | Track 3 (Kafka) | Track 4 (AI) | Track 5 (Frontend) |
|-----|-------------------|--------------------|-----------------|--------------|--------------------|
| **8** | Admin APIs | Performance test | Monitoring | FastAPI + WebSocket | Admin dashboard |
| **9** | **INTEGRATION** | **INTEGRATION** | **INTEGRATION** | **INTEGRATION** | **INTEGRATION** |
| **10** | Bug fixes | Optimization | Performance test | Bug fixes | AI chat UI |
| **11** | E2E testing | JMeter support | JMeter support | E2E testing | Polish & testing |
| **12** | Docker | Docker | **AWS Deployment** | Docker | Docker |
| **13** | Documentation | Documentation | **AWS finalize** | Documentation | **Presentation prep** |

---

## Key Takeaways

### ✅ Tracks Can Work Independently (Days 1-8)
- Track 1: Uses mock data, mock Kafka initially
- Track 2: Focused on data, doesn't need other services
- Track 3: Sets up infrastructure, tests independently
- Track 4: Uses Kaggle data, separate database, can work standalone
- Track 5: Uses mock APIs initially

### ✅ Clear Integration Points (Days 9-11)
- Day 9: Backend + Database + Kafka
- Day 10: Frontend + Backend + AI Service
- Day 11: E2E testing and bug fixes

### ✅ Minimal Dependencies
- Each track has clear deliverables
- Shared documents (API design, DB schema) defined early
- Mock implementations allow parallel work
- Integration happens in phases

### ✅ Risk Mitigation
- Parallel work maximizes speed
- Mock implementations reduce blockers
- Early testing catches issues
- Clear ownership reduces conflicts

---

## Emergency Fallback Plan

If timeline slips, **prioritize in this order:**

1. **MUST HAVE (60% of grade):**
   - Core backend APIs (Track 1)
   - Database with data (Track 2)
   - Basic frontend (Track 5)
   - Redis caching (Track 2)

2. **IMPORTANT (25% of grade):**
   - AI Service (Track 4) - 15%
   - Kafka (Track 3) - 10%

3. **NICE TO HAVE (15% of grade):**
   - Advanced analytics (Track 5)
   - Comprehensive monitoring (Track 3)
   - Perfect UI/UX (Track 5)

---

**Document Version:** 1.0  
**Last Updated:** November 26, 2025

