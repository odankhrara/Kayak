# 🔌 Kayak Application - Port Configuration

## ✅ Complete System Status

### **Backend Services**

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **API Gateway** | 4000 | http://localhost:4000 | Main entry point for all API requests |
| **User Service** | 8001 | http://localhost:8001 | User authentication & profile management |
| **Listing Service** | 8002 | http://localhost:8002 | Flights, hotels, and car listings |
| **Booking-Billing Service** | 8003 | http://localhost:8003 | Booking creation & payment processing |
| **Analytics Service** | 8004 | http://localhost:8004 | Real-time analytics & reporting |

### **Frontend**

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **React Application** | 3000 / 5173 | http://localhost:3000 or http://localhost:5173 | User interface (Vite dev server) |

### **Infrastructure (Docker Containers)**

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **MySQL** | 3306 | localhost:3306 | Relational database (users, bookings, billing) |
| **MongoDB** | 27017 | localhost:27017 | Document database (reviews, logs, analytics) |
| **Redis** | 6379 | localhost:6379 | Cache & session storage |
| **Kafka** | 9092 | localhost:9092 | Message queue for async communication |
| **Zookeeper** | 2181 | localhost:2181 | Kafka coordination service |

---

## 🔍 Health Check Endpoints

Test all services with these commands:

```bash
# Backend Services
curl http://localhost:4000/health  # API Gateway
curl http://localhost:8001/health  # User Service
curl http://localhost:8002/health  # Listing Service
curl http://localhost:8003/health  # Booking-Billing Service
curl http://localhost:8004/health  # Analytics Service
```

**Expected Response:**
```json
{"status":"ok","service":"service-name"}
```

---

## 🚀 Starting All Services

### **Step 1: Start Infrastructure (Docker)**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/infra
docker-compose up -d
```

### **Step 2: Start Backend Services (6 Terminals)**

**Terminal 1 - API Gateway:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/services/api-gateway
npm run dev
```

**Terminal 2 - User Service:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/services/user-service
npm run dev
```

**Terminal 3 - Listing Service:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/services/listing-service
npm run dev
```

**Terminal 4 - Booking-Billing Service:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/services/booking-billing-service
npm run dev
```

**Terminal 5 - Analytics Service:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/services/analytics-service
npm run dev
```

**Terminal 6 - Frontend:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/frontend
npm run dev
```

---

## 🛑 Stopping All Services

### **Stop Backend Services:**
Press `Ctrl+C` in each terminal window

### **Stop Docker Containers:**
```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak/src/infra
docker-compose down
```

---

## 🔧 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Find process using a port (e.g., 4000)
lsof -ti:4000

# Kill the process
lsof -ti:4000 | xargs kill -9
```

### Check Running Services
```bash
# Check all ports
lsof -i :4000
lsof -i :8001
lsof -i :8002
lsof -i :8003
lsof -i :8004
lsof -i :3000
lsof -i :5173
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Port 3000/5173)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Port 4000)                     │
└───────┬──────────┬──────────┬──────────┬────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
   │ User   │ │Listing │ │Booking │ │Analytics │
   │ 8001   │ │ 8002   │ │ 8003   │ │  8004    │
   └────┬───┘ └───┬────┘ └───┬────┘ └────┬─────┘
        │         │          │           │
        └─────────┴──────────┴───────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌────────┐  ┌────────┐
   │ MySQL  │  │ MongoDB │  │ Redis  │  │ Kafka  │
   │  3306  │  │  27017  │  │  6379  │  │  9092  │
   └────────┘  └─────────┘  └────────┘  └────────┘
```

---

## 🎯 Quick Access URLs

- **Frontend:** http://localhost:3000 or http://localhost:5173
- **API Gateway:** http://localhost:4000
- **API Docs:** http://localhost:4000/api-docs (if configured)

---

**Last Updated:** November 28, 2025

