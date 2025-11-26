# 🚀 Environment Setup Guide - Kayak Travel Booking System

**Purpose:** Complete setup instructions for fresh/production-like environment  
**Time Required:** 45-60 minutes (first time)  
**Last Updated:** November 26, 2025

---

## 📋 **PREREQUISITES (Install These First)**

Before setting up the Kayak system, ensure you have the following installed:

### **1. Docker Desktop** (Required)
- **Download:** https://www.docker.com/products/docker-desktop
- **Minimum Version:** 20.x or higher
- **Platform:** Available for Windows, macOS, Linux
- **Important:** Docker Desktop must be running before starting setup

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

**Expected Output:**
```
Docker version 20.x.x or higher
Docker Compose version 2.x.x or higher
```

**Start Docker:**
- Open Docker Desktop application
- Wait for "Docker Desktop is running" indicator
- Verify: `docker ps` should run without errors

---

### **2. Node.js v18+** (Required)
- **Download:** https://nodejs.org/
- **Recommended:** LTS version (v18.x or v20.x)
- **Includes:** npm (Node Package Manager)

**Verify Installation:**
```bash
node --version
npm --version
```

**Expected Output:**
```
v18.x.x or higher
9.x.x or higher
```

**If not installed:**
- Download from nodejs.org
- Install LTS version
- Restart terminal after installation

---

### **3. Git** (Optional - if cloning repository)
- **Download:** https://git-scm.com/downloads
- **Required only if:** Cloning from repository

**Verify Installation:**
```bash
git --version
```

---

### **4. Text Editor / IDE** (Recommended)
- **VS Code** (recommended): https://code.visualstudio.com/
- **WebStorm**, **Sublime Text**, or any editor

---

### **5. Browser** (Required for Testing)
- **Chrome** (recommended for DevTools)
- **Firefox**, **Safari**, or **Edge** also work

---

### **System Requirements:**
- **RAM:** Minimum 8GB (16GB recommended)
- **Disk Space:** 5GB free space
- **OS:** macOS, Windows 10+, or Linux
- **Network:** Internet connection for downloading dependencies

---

## 🎯 **STEP-BY-STEP SETUP (Fresh Environment)**

### **Overview:**
1. Get the project code
2. Install all Node.js dependencies
3. Start Docker infrastructure (databases)
4. Seed database with test data
5. Start backend services
6. Start frontend application
7. Verify everything is running

**Total Time:** 30-45 minutes

---

### **Step 1: Get the Project** ⏱️ **5 minutes**

#### **Option A: You Have Local Copy**
```bash
# Navigate to your project directory
cd /path/to/Project_KayakSimulation

# Verify structure
ls -la
# Should see: src/, frontend/, docs/, README.md, etc.
```

#### **Option B: Clone from Repository**
```bash
# Clone the repository
git clone <repository-url>
cd Project_KayakSimulation

# Verify structure
ls -la
```

#### **Expected Structure:**
```
Project_KayakSimulation/
├── src/
│   ├── services/
│   ├── infra/
│   ├── db/
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
├── NEXT_STEPS_PLAN.md
├── PROD_DEPLOYMENT_CHECKLIST.md
└── README.md
```

---

### **Step 2: Install All Dependencies** ⏱️ **10-15 minutes**

This step installs all Node.js packages for backend services and frontend.

#### **2.1: Backend Services (10 min)**

```bash
cd Project_KayakSimulation/src

# Install common shared utilities
cd services/common
npm install
echo "✅ Common dependencies installed"

# Install API Gateway
cd ../api-gateway
npm install
echo "✅ API Gateway dependencies installed"

# Install User Service
cd ../user-service
npm install
echo "✅ User Service dependencies installed"

# Install Listing Service
cd ../listing-service
npm install
echo "✅ Listing Service dependencies installed"

# Install Booking-Billing Service
cd ../booking-billing-service
npm install
echo "✅ Booking-Billing Service dependencies installed"

# Install Analytics Service
cd ../analytics-service
npm install
echo "✅ Analytics Service dependencies installed"
```

**Expected Output:** Each service should install packages without errors

**If errors occur:**
- Check Node.js version: `node --version` (must be v18+)
- Try: `npm cache clean --force` and retry
- Check internet connection

#### **2.2: Database Seeder (1 min)**

```bash
cd ../../db
npm install
echo "✅ Database seeder dependencies installed"
```

#### **2.3: Frontend (3-5 min)**

```bash
cd ../../frontend
npm install
echo "✅ Frontend dependencies installed"
```

**Verification:**
```bash
# All these directories should have node_modules/ folder:
ls services/common/node_modules
ls services/api-gateway/node_modules
ls services/user-service/node_modules
ls services/listing-service/node_modules
ls services/booking-billing-service/node_modules
ls services/analytics-service/node_modules
ls frontend/node_modules
```

---

### **Step 3: Start Docker Infrastructure** ⏱️ **3-5 minutes**

Start MySQL and MongoDB databases using Docker Compose.

```bash
cd Project_KayakSimulation/src/infra

# Start only MySQL and MongoDB (minimum required)
docker-compose up -d mysql mongodb

# Wait 30-60 seconds for databases to initialize
echo "⏳ Waiting for databases to be ready..."
sleep 60
```

**Verify Containers are Running:**
```bash
docker ps

# Expected output should show:
# CONTAINER ID   IMAGE           STATUS                    PORTS
# xxxxxxxxx      mysql:8.0       Up X minutes (healthy)    0.0.0.0:3306->3306/tcp
# xxxxxxxxx      mongo:7.0       Up X minutes (healthy)    0.0.0.0:27017->27017/tcp
```

**Check Container Health:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"

# Should show:
# NAMES                STATUS
# kayak-mysql          Up X minutes (healthy)
# kayak-mongodb        Up X minutes (healthy)
```

**Verify Database Connectivity:**
```bash
# Test MySQL connection
docker exec -it kayak-mysql mysql -uroot -ppassword -e "SHOW DATABASES;"

# Should list databases including 'kayak'

# Test MongoDB connection
docker exec -it kayak-mongodb mongosh --eval "db.adminCommand('ping')"

# Should return: { ok: 1 }
```

**If containers are not healthy:**
```bash
# Check logs
docker logs kayak-mysql
docker logs kayak-mongodb

# Common issue: First-time initialization takes 2-3 minutes
# Solution: Wait longer, then check again
docker ps
```

**Optional: Start Redis and Kafka (not required for basic testing)**
```bash
# Only if you plan to test Redis/Kafka features
docker-compose up -d redis kafka zookeeper
```

---

### **Step 4: Seed Database with Test Data** ⏱️ **3-5 minutes**

Populate the database with test data (users, flights, hotels, cars, bookings).

```bash
cd ../db

# Run seed script
node seed-data.js
```

**Expected Output:**
```
🌱 Starting database seeding...

📊 Generating test data...
  ├─ 1000 users
  ├─ 500 flights
  ├─ 200 hotels (with rooms)
  ├─ 200 cars
  └─ 2000 bookings

⏳ Connecting to MySQL...
✅ MySQL connected

⏳ Connecting to MongoDB...
✅ MongoDB connected

📝 Creating users...
✅ Created 1000 users

✈️  Creating flights...
✅ Created 500 flights

🏨 Creating hotels...
✅ Created 200 hotels with rooms

🚗 Creating cars...
✅ Created 200 cars

📅 Creating bookings...
✅ Created 2000 bookings

💰 Creating billing records...
✅ Created 2000 billing records

📝 Creating reviews in MongoDB...
✅ Created sample reviews

✅ Seed data completed successfully!
```

**Verify Data Was Created:**
```bash
# Check MySQL data
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  USE kayak;
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION SELECT 'flights', COUNT(*) FROM flights
  UNION SELECT 'hotels', COUNT(*) FROM hotels
  UNION SELECT 'cars', COUNT(*) FROM cars
  UNION SELECT 'bookings', COUNT(*) FROM bookings;
"

# Expected output:
# +------------+-------+
# | table_name | count |
# +------------+-------+
# | users      |  1000 |
# | flights    |   500 |
# | hotels     |   200 |
# | cars       |   200 |
# | bookings   |  2000 |
# +------------+-------+
```

**If seed script fails:**
```bash
# Check database is ready
docker ps | grep mysql

# Check for errors in output
# Common fix: Run seed script again (it's idempotent)
node seed-data.js
```

---

### **Step 5: Start Backend Services** ⏱️ **5 minutes**

Start all 5 microservices (API Gateway, User, Listing, Booking-Billing, Analytics).

#### **Option A: Using Start Script (Recommended - macOS/Linux)**

```bash
cd ..

# Make script executable
chmod +x start-all.sh

# Start all services
./start-all.sh
```

**Expected Output:**
```
🚀 Starting Kayak System...

📦 Starting Backend Services...

▶️  Starting api-gateway on port 4000...
✅ api-gateway started (PID: 12345)

▶️  Starting user-service on port 8001...
✅ user-service started (PID: 12346)

▶️  Starting listing-service on port 8002...
✅ listing-service started (PID: 12347)

▶️  Starting booking-billing-service on port 8003...
✅ booking-billing-service started (PID: 12348)

▶️  Starting analytics-service on port 8004...
✅ analytics-service started (PID: 12349)

🎉 All services started!

📍 Service URLs:
   - Frontend:        http://localhost:3000
   - API Gateway:     http://localhost:4000
   - User Service:    http://localhost:8001
   - Listing Service: http://localhost:8002
   - Booking Service: http://localhost:8003
   - Analytics:       http://localhost:8004

📋 Logs are in: ./logs/

To stop all services, run: ./stop-all.sh
```

**Check Services are Running:**
```bash
# View running processes
ps aux | grep node

# Check specific ports
lsof -i :4000  # API Gateway
lsof -i :8001  # User Service
lsof -i :8002  # Listing Service
lsof -i :8003  # Booking Service
lsof -i :8004  # Analytics Service
```

#### **Option B: Manual Start (Windows or if script fails)**

Open **5 separate terminal windows** and run one command in each:

**Terminal 1: API Gateway**
```bash
cd Project_KayakSimulation/src/services/api-gateway
npm run dev

# Should see: "API Gateway running on port 4000"
```

**Terminal 2: User Service**
```bash
cd Project_KayakSimulation/src/services/user-service
npm run dev

# Should see: "User Service running on port 8001"
```

**Terminal 3: Listing Service**
```bash
cd Project_KayakSimulation/src/services/listing-service
npm run dev

# Should see: "Listing Service running on port 8002"
```

**Terminal 4: Booking-Billing Service**
```bash
cd Project_KayakSimulation/src/services/booking-billing-service
npm run dev

# Should see: "Booking-Billing Service running on port 8003"
```

**Terminal 5: Analytics Service**
```bash
cd Project_KayakSimulation/src/services/analytics-service
npm run dev

# Should see: "Analytics Service running on port 8004"
```

**Verify All Services are Healthy:**
```bash
# In a new terminal, test each service
curl http://localhost:4000/health
# Expected: {"status":"ok","service":"api-gateway"}

curl http://localhost:8001/health
# Expected: {"status":"ok","service":"user-service"}

curl http://localhost:8002/health
# Expected: {"status":"ok","service":"listing-service"}

curl http://localhost:8003/health
# Expected: {"status":"ok","service":"booking-billing-service"}

curl http://localhost:8004/health
# Expected: {"status":"ok","service":"analytics-service"}
```

---

### **Step 6: Start Frontend Application** ⏱️ **2 minutes**

Start the React frontend application.

```bash
# Open a NEW terminal window
cd Project_KayakSimulation/frontend

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v7.2.4  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Verify Frontend is Running:**
```bash
# In another terminal
curl http://localhost:3000

# Should return HTML content (not an error)
```

**Open in Browser:**
- Navigate to: http://localhost:3000
- Should see: Beautiful home page with gradient background

---

### **Step 7: Verify Everything is Running** ⏱️ **2 minutes**

Final verification that all components are operational.

#### **Check All Ports:**
```bash
# List all services
lsof -i :3000  # Frontend
lsof -i :4000  # API Gateway
lsof -i :8001  # User Service
lsof -i :8002  # Listing Service
lsof -i :8003  # Booking Service
lsof -i :8004  # Analytics Service
```

#### **Check Docker Containers:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Should show at minimum:
# NAMES           STATUS                    PORTS
# kayak-mysql     Up X minutes (healthy)    0.0.0.0:3306->3306/tcp
# kayak-mongodb   Up X minutes (healthy)    0.0.0.0:27017->27017/tcp
```

#### **Quick API Test:**
```bash
# Test user registration endpoint
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "999-99-9999",
    "firstName": "Test",
    "lastName": "User",
    "email": "quicktest@test.com",
    "password": "Test1234"
  }'

# Should return: {"message":"User registered successfully","user":{...},"token":"..."}
```

---

## ✅ **SETUP COMPLETE!**

If you've reached this point without errors, your environment is ready for testing!

### **What's Running:**
- ✅ MySQL Database (port 3306)
- ✅ MongoDB Database (port 27017)
- ✅ API Gateway (port 4000)
- ✅ User Service (port 8001)
- ✅ Listing Service (port 8002)
- ✅ Booking-Billing Service (port 8003)
- ✅ Analytics Service (port 8004)
- ✅ Frontend Application (port 3000)

### **What's Populated:**
- ✅ 1,000 test users
- ✅ 500 flights
- ✅ 200 hotels with rooms
- ✅ 200 cars
- ✅ 2,000 bookings
- ✅ 2,000 billing records

---

## 🔧 **MAINTENANCE COMMANDS**

### **Stop All Services:**
```bash
# If using start-all.sh
cd Project_KayakSimulation/src
./stop-all.sh

# Or manually
kill $(cat logs/*.pid)

# Stop Docker containers
cd infra
docker-compose down
```

### **Restart Services:**
```bash
# Restart backend
cd Project_KayakSimulation/src
./stop-all.sh
./start-all.sh

# Restart Docker
cd infra
docker-compose restart
```

### **View Logs:**
```bash
# Backend logs
cd Project_KayakSimulation/src/logs
cat api-gateway.log
cat user-service.log
cat listing-service.log
cat booking-billing-service.log
cat analytics-service.log

# Docker logs
docker logs kayak-mysql
docker logs kayak-mongodb
```

### **Reset Database:**
```bash
# WARNING: This deletes all data
cd Project_KayakSimulation/src/infra
docker-compose down -v  # -v removes volumes

# Restart and re-seed
docker-compose up -d mysql mongodb
sleep 60
cd ../db
node seed-data.js
```

---

## 📊 **EXPECTED RESOURCE USAGE**

### **Disk Space:**
- Docker images: ~2GB
- Node modules: ~2GB
- Database data: ~500MB
- **Total:** ~5GB

### **Memory (RAM):**
- Docker containers: ~1GB
- Backend services: ~500MB
- Frontend: ~200MB
- **Total:** ~2GB

### **CPU:**
- Idle: 5-10%
- Under load: 20-40%

---

## 🎯 **NEXT STEP**

**Setup Complete!** ✅

Now proceed to: **TEST_GUIDE.md** to test all functionality

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025  
**Maintained By:** Development Team

