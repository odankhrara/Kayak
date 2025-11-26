# Kayak Travel Booking System

A full-stack microservices-based travel booking platform built with React, Node.js, TypeScript, and modern infrastructure tools.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [What Has Been Implemented](#what-has-been-implemented)
- [Getting Started](#getting-started)
- [Service Details](#service-details)
- [Infrastructure](#infrastructure)
- [Development Scripts](#development-scripts)
- [Current Status](#current-status)

---

## 🎯 Project Overview

The Kayak Travel Booking System is a microservices architecture that enables users to search, book, and manage travel bookings for flights, hotels, and car rentals. The system is designed with scalability, performance, and maintainability in mind.

### Key Features
- **Multi-service Architecture**: Separate services for users, listings, bookings, billing, and analytics
- **API Gateway**: Single entry point for all frontend requests
- **Database Support**: MySQL for relational data, MongoDB for documents, Redis for caching
- **Event-Driven**: Kafka for asynchronous event processing
- **SPA Frontend**: React-based frontend with client-side routing
- **Authentication & Authorization**: JWT-based auth with role-based access control

---

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React SPA on port 3000)
│  (Port 3000)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (Port 8000)
└──────┬──────┘
       │
       ├──► User Service (8001)
       ├──► Listing Service (8002)
       ├──► Booking-Billing Service (8003)
       └──► Analytics Service (8004)
       
Infrastructure:
- MySQL (3306) - Relational data
- MongoDB (27017) - Document storage
- Redis (6379) - Caching
- Kafka (9092) - Event streaming
```

---

## 📁 Project Structure

```
kayak-system/
├── frontend/                    # React frontend application
│   ├── dist/                   # Built frontend files
│   ├── serve.js                # Node.js SPA server with routing support
│   ├── src/                    # Frontend source code (partial)
│   └── package.json
│
├── services/                   # Backend microservices
│   ├── common/                 # Shared utilities and middleware
│   │   ├── src/
│   │   │   ├── db/             # Database connections (MySQL, MongoDB, Redis)
│   │   │   ├── kafka/          # Kafka client wrappers
│   │   │   ├── middleware/    # Auth, error handling, validation
│   │   │   └── utils/          # Utility functions
│   │   └── package.json
│   │
│   ├── api-gateway/            # API Gateway service
│   │   ├── src/
│   │   │   ├── routes/         # Route definitions for all services
│   │   │   ├── config/         # Environment configuration
│   │   │   └── index.ts        # Express app entry point
│   │   └── package.json
│   │
│   ├── user-service/           # User management service
│   │   ├── src/
│   │   │   ├── controllers/    # HTTP request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── models/         # Data models
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── listing-service/        # Flights, Hotels, Cars listings
│   │   ├── src/
│   │   │   ├── controllers/   # Flight, Hotel, Car controllers
│   │   │   ├── services/       # Business logic for listings
│   │   │   ├── repositories/   # Data access
│   │   │   ├── models/         # Flight, Hotel, Car models
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── booking-billing-service/ # Bookings and payments
│   │   ├── src/
│   │   │   ├── controllers/     # Booking and billing controllers
│   │   │   ├── services/        # Booking and billing logic
│   │   │   ├── repositories/    # Data access
│   │   │   ├── models/          # Booking and Billing models
│   │   │   ├── kafka/           # Event producers
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── analytics-service/      # Analytics and reporting
│       ├── src/
│       │   ├── services/        # Analytics business logic
│       │   ├── consumers/       # Kafka event consumers
│       │   └── index.ts
│       └── package.json
│
├── infra/                      # Infrastructure configuration
│   └── docker-compose.yml      # Docker setup for databases
│
├── db/                         # Database schemas and init scripts
│   ├── mysql/                  # MySQL initialization
│   └── mongo/                  # MongoDB initialization
│
├── start-all.sh                # Script to start all services
├── stop-all.sh                 # Script to stop all services
└── logs/                       # Service logs and PID files
```

---

## ✅ What Has Been Implemented

### 1. **Common Service (`services/common/`)**
   - **Purpose**: Shared utilities, middleware, and database connections used by all microservices
   - **Files**:
     - `src/db/mysqlPool.ts` - MySQL connection pooling
     - `src/db/mongoClient.ts` - MongoDB client connection
     - `src/db/redisClient.ts` - Redis client for caching
     - `src/kafka/kafkaClient.ts` - Kafka producer/consumer wrappers
     - `src/kafka/topics.ts` - Kafka topic name constants
     - `src/middleware/auth.ts` - JWT authentication middleware (`requireAuth`, `requireAdmin`)
     - `src/middleware/errorHandler.ts` - Centralized error handling
     - `src/middleware/validation.ts` - Request validation using Zod
     - `src/utils/index.ts` - Shared utility functions
   - **Status**: ✅ Complete and built

### 2. **API Gateway (`services/api-gateway/`)**
   - **Purpose**: Single entry point for all frontend API requests
   - **Port**: 8000
   - **Files**:
     - `src/index.ts` - Express app with CORS, error handling
     - `src/routes/userRoutes.ts` - Routes to user service
     - `src/routes/listingRoutes.ts` - Routes to listing service
     - `src/routes/bookingRoutes.ts` - Routes to booking service
     - `src/routes/billingRoutes.ts` - Routes to billing service
     - `src/routes/adminRoutes.ts` - Admin-only routes
     - `src/routes/aiRoutes.ts` - AI recommendation service routes
     - `src/config/env.ts` - Environment configuration
   - **Status**: ✅ Complete and running

### 3. **User Service (`services/user-service/`)**
   - **Purpose**: User authentication, registration, and management
   - **Port**: 8001
   - **Files**:
     - `src/index.ts` - Express server with user routes
     - `src/controllers/userController.ts` - HTTP handlers for user operations
     - `src/services/userService.ts` - Business logic (register, login, CRUD)
     - `src/repositories/userRepository.ts` - MySQL data access
     - `src/models/User.ts` - User data model
   - **Features**:
     - User registration with password hashing (bcrypt)
     - JWT-based authentication
     - User CRUD operations
     - User search functionality
   - **Status**: ✅ Complete and running

### 4. **Listing Service (`services/listing-service/`)**
   - **Purpose**: Manage flight, hotel, and car listings
   - **Port**: 8002
   - **Files**:
     - `src/index.ts` - Express server with listing routes
     - `src/controllers/flightController.ts` - Flight API endpoints
     - `src/controllers/hotelController.ts` - Hotel API endpoints
     - `src/controllers/carController.ts` - Car API endpoints
     - `src/services/flightService.ts` - Flight business logic
     - `src/services/hotelService.ts` - Hotel business logic
     - `src/services/carService.ts` - Car business logic
     - `src/repositories/flightRepository.ts` - Flight data access
     - `src/repositories/hotelRepository.ts` - Hotel data access
     - `src/repositories/carRepository.ts` - Car data access
     - `src/models/Flight.ts` - Flight model
     - `src/models/Hotel.ts` - Hotel model
     - `src/models/Car.ts` - Car model
   - **Status**: ✅ Complete and running

### 5. **Booking-Billing Service (`services/booking-billing-service/`)**
   - **Purpose**: Handle bookings and payment processing
   - **Port**: 8003
   - **Files**:
     - `src/index.ts` - Express server with booking/billing routes
     - `src/controllers/bookingController.ts` - Booking API endpoints
     - `src/controllers/billingController.ts` - Billing/payment endpoints
     - `src/services/bookingService.ts` - Booking business logic
     - `src/services/billingService.ts` - Payment processing logic
     - `src/repositories/bookingRepository.ts` - Booking data access
     - `src/repositories/billingRepository.ts` - Billing data access
     - `src/models/Booking.ts` - Booking model
     - `src/models/Billing.ts` - Billing model
     - `src/kafka/` - Kafka event producers for booking events
   - **Status**: ✅ Complete and running

### 6. **Analytics Service (`services/analytics-service/`)**
   - **Purpose**: Analytics, reporting, and event processing
   - **Port**: 8004
   - **Files**:
     - `src/index.ts` - Express server
     - `src/services/analyticsService.ts` - Analytics business logic
     - `src/consumers/` - Kafka event consumers for analytics
   - **Status**: ✅ Complete and running

### 7. **Frontend (`frontend/`)**
   - **Purpose**: React-based single-page application
   - **Port**: 3000
   - **Files**:
     - `serve.js` - **Custom Node.js SPA server** with client-side routing support
       - Handles all routes by serving `index.html` for React Router
       - Serves static assets (JS, CSS, images) correctly
       - Fixes 404 errors for client-side routes
     - `dist/` - Built frontend files (production build)
       - `index.html` - Main HTML file
       - `assets/` - Compiled JavaScript and CSS
   - **Status**: ✅ Server running, serving built files with SPA routing

### 8. **Infrastructure (`infra/`)**
   - **Purpose**: Docker Compose configuration for databases and messaging
   - **File**: `docker-compose.yml`
   - **Services**:
     - MySQL 8.0 (port 3306) - Relational database
     - MongoDB 7.0 (port 27017) - Document database
     - Redis 7 (port 6379) - Caching layer
     - Zookeeper (port 2181) - Kafka coordination
     - Kafka (port 9092) - Event streaming
   - **Status**: ✅ Configuration complete

### 9. **Scripts**
   - **`start-all.sh`**:
     - Installs dependencies for all services
     - Starts all backend services in order
     - Starts frontend with SPA routing support
     - Checks for Docker and port availability
     - Logs all service PIDs
   - **`stop-all.sh`**:
     - Stops all running services by PID
     - Cleans up PID files
   - **Status**: ✅ Complete and functional

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Docker Desktop (for databases)
- Git

### Installation & Setup

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd Kayak/kayak-system
   ```

2. **Start Docker services** (databases)
   ```bash
   cd infra
   docker-compose up -d
   ```
   This starts MySQL, MongoDB, Redis, Zookeeper, and Kafka.

3. **Start all application services**
   ```bash
   cd ..
   chmod +x start-all.sh stop-all.sh
   ./start-all.sh
   ```

   This will:
   - Install dependencies for all services
   - Start API Gateway (port 8000)
   - Start User Service (port 8001)
   - Start Listing Service (port 8002)
   - Start Booking-Billing Service (port 8003)
   - Start Analytics Service (port 8004)
   - Start Frontend (port 3000)

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8000
   - Individual services: http://localhost:8001-8004

### Stop All Services
```bash
./stop-all.sh
```

---

## 🔧 Service Details

### API Gateway (Port 8000)
- Routes all frontend requests to appropriate microservices
- Handles CORS
- Centralized error handling
- Health check endpoint: `GET /health`

### User Service (Port 8001)
- **Endpoints**:
  - `POST /api/users/register` - Register new user
  - `POST /api/users/login` - User login
  - `GET /api/users/:id` - Get user by ID
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user
  - `GET /api/users/search?q=...` - Search users

### Listing Service (Port 8002)
- **Endpoints**:
  - Flights: `/api/flights/*`
  - Hotels: `/api/hotels/*`
  - Cars: `/api/cars/*`
- Supports search, filtering, and CRUD operations

### Booking-Billing Service (Port 8003)
- **Endpoints**:
  - Bookings: `/api/bookings/*`
  - Billing: `/api/billing/*`
- Publishes events to Kafka for analytics

### Analytics Service (Port 8004)
- Consumes Kafka events
- Generates analytics and reports
- Admin dashboard data

---

## 🗄️ Infrastructure

### Database Connections
All services use the `@kayak/common` package for database connections:

- **MySQL**: Used by User, Listing, and Booking services for relational data
- **MongoDB**: Used for document storage (reviews, analytics aggregates)
- **Redis**: Used for caching frequently accessed data

### Kafka Topics
Defined in `services/common/src/kafka/topics.ts`:
- `booking_created` - When a booking is created
- `payment_succeeded` - When payment is processed
- `user_tracking` - User behavior events

---

## 📝 Development Scripts

### Start All Services
```bash
./start-all.sh
```

### Stop All Services
```bash
./stop-all.sh
```

### Start Individual Service
```bash
cd services/user-service
npm install
npm run dev
```

### View Logs
```bash
tail -f logs/user-service.log
tail -f logs/api-gateway.log
# etc.
```

### Check Service Status
```bash
# Check if services are running
ps aux | grep "ts-node-dev"

# Check ports
lsof -i :3000
lsof -i :8000
# etc.
```

---

## 📊 Current Status

### ✅ Completed
- [x] Common service with shared utilities
- [x] API Gateway with routing
- [x] User service (authentication, CRUD)
- [x] Listing service (flights, hotels, cars)
- [x] Booking-Billing service
- [x] Analytics service
- [x] Frontend SPA server with routing support
- [x] Docker Compose infrastructure setup
- [x] Start/stop scripts
- [x] All services running and accessible

### 🔄 In Progress / Partial
- [ ] Frontend source files (only built `dist/` folder exists)
- [ ] Database schema initialization scripts
- [ ] Kafka event consumers implementation
- [ ] AI Recommendation service (structure exists, not implemented)

### 📋 Next Steps
1. Recreate frontend source files (React components, pages, routing)
2. Create database schema initialization scripts
3. Implement Kafka event consumers
4. Add environment variable configuration files
5. Implement AI Recommendation service
6. Add comprehensive error handling and logging
7. Write unit and integration tests

---

## 🐛 Known Issues & Solutions

### Issue: 404 errors on frontend routes
**Solution**: The `serve.js` server handles SPA routing. If you still see 404:
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Try incognito/private window

### Issue: Services can't connect to databases
**Solution**: Ensure Docker is running:
```bash
docker ps  # Check if containers are running
cd infra && docker-compose up -d  # Start if not running
```

### Issue: Port already in use
**Solution**: 
```bash
lsof -ti:8000 | xargs kill -9  # Replace 8000 with the port
```

---

## 📚 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Databases**: MySQL, MongoDB, Redis
- **Messaging**: Kafka
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **State Management**: Redux (planned)
- **Routing**: React Router

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose

---

## 👥 Team Collaboration

This project is set up for team collaboration:
- Clean git history (no secrets in repository)
- `.gitignore` configured to exclude `node_modules`, `.env` files
- Modular architecture for parallel development
- Shared common package for consistency

---

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Verify all services are running: `./start-all.sh`
3. Check Docker containers: `docker ps`
4. Review service health endpoints

---

**Last Updated**: November 2024
**Version**: 1.0.0

