# 📖 Makefile Quick Reference Guide

**Purpose:** Quick commands for testing and managing the Kayak Travel Booking System  
**Location:** `/Makefile` (project root)  
**Last Updated:** November 26, 2025

---

## 🚀 Quick Start

```bash
# First time setup (install everything and seed database)
make setup

# Start all services
make start

# Check if everything is running
make status

# View logs
make logs

# Stop everything
make stop
```

---

## 📋 All Available Commands

Run `make help` or just `make` to see all commands with descriptions.

---

## 🎯 Most Common Commands

### **1. First-Time Setup**
```bash
make setup
```
**What it does:**
- ✅ Checks Docker is running
- ✅ Installs all dependencies (backend + frontend)
- ✅ Starts MySQL and MongoDB
- ✅ Waits for databases to be ready
- ✅ Seeds database with 1000+ test records

**Time:** ~5-10 minutes

---

### **2. Start All Services**
```bash
make start
```
**What it does:**
- ✅ Starts Docker databases (if not running)
- ✅ Starts 5 backend microservices
- ✅ Starts frontend on port 3000
- ✅ Shows access URLs

**Services started:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- User Service: http://localhost:8001
- Listing Service: http://localhost:8002
- Booking-Billing Service: http://localhost:8003
- Analytics Service: http://localhost:8004
- MySQL: localhost:3306
- MongoDB: localhost:27017

---

### **3. Stop All Services**
```bash
make stop
```
**What it does:**
- ✅ Gracefully stops all backend services
- ✅ Stops frontend
- ✅ Stops Docker databases
- ✅ Cleans up PID files

---

### **4. Check Service Status**
```bash
make status
```
**What it does:**
- Shows Docker container status
- Shows Node.js process status
- Shows which ports are in use
- Quick visual check with ✅ or ❌

**Example output:**
```
📊 Service Status:

🐳 Docker Containers:
kayak-mysql      Up 5 minutes (healthy)    0.0.0.0:3306->3306/tcp
kayak-mongodb    Up 5 minutes (healthy)    0.0.0.0:27017->27017/tcp

⚙️  Node Processes:
node api-gateway
node user-service
node listing-service
...

🌐 Port Usage:
Port 3000 (Frontend): ✅
Port 4000 (API Gateway): ✅
Port 8001 (User Service): ✅
```

---

### **5. Health Check**
```bash
make health
# or
make test-health
```
**What it does:**
- Tests `/health` endpoint of all 5 backend services
- Tests frontend is accessible
- Shows ✅ or ❌ for each service

**Example output:**
```
🏥 Testing service health...
API Gateway (4000): ✅
User Service (8001): ✅
Listing Service (8002): ✅
Booking Service (8003): ✅
Analytics Service (8004): ✅
Frontend (3000): ✅
```

---

### **6. View Logs**
```bash
# All logs (live tail)
make logs

# Specific service logs
make logs-api        # API Gateway
make logs-user       # User Service
make logs-frontend   # Frontend
make logs-docker     # MySQL logs
```

**Press Ctrl+C to exit log viewing**

---

### **7. Test API Endpoints**
```bash
make test-api
```
**What it does:**
- Tests user registration endpoint
- Tests flight search endpoint
- Shows ✅ or ❌ for each test

**Example output:**
```
🧪 Testing API endpoints...
Testing user registration: ✅
Testing flight search: ✅
```

---

### **8. Restart Services**
```bash
make restart
```
Equivalent to: `make stop` + `make start`

---

## 🗄️ Database Commands

### **Seed Database**
```bash
make db-seed
```
Populates database with:
- 1000 users
- 500 flights
- 200 hotels
- 200 cars
- 2000 bookings

---

### **Reset Database**
```bash
make db-reset
```
**⚠️ WARNING:** Deletes all data and reseeds fresh data

---

### **Open Database Shell**
```bash
# MySQL shell
make db-shell-mysql

# MongoDB shell
make db-shell-mongo
```

---

### **Check Database Data**
```bash
make db-check
```
Shows record counts for each table/collection

---

## 🔧 Development Commands

### **Install Dependencies**
```bash
# Install everything
make install

# Install only backend
make install-backend

# Install only frontend
make install-frontend
```

---

### **Development Mode (with live logs)**
```bash
make dev
```
Starts services and immediately shows live logs (Ctrl+C to exit log view)

---

### **Build for Production**
```bash
# Build everything
make build

# Build only frontend
make build-frontend
```
Frontend builds to: `frontend/dist/`

---

## 🧹 Cleanup Commands

### **Clean Logs**
```bash
make clean
```
Removes:
- Log files (`src/logs/*.log`)
- PID files (`src/logs/*.pid`)
- Frontend build (`frontend/dist`)

---

### **Clean Everything**
```bash
make clean-all
```
**⚠️ WARNING:** Removes ALL `node_modules` folders (requires confirmation)

---

### **Clean Docker**
```bash
make clean-docker
```
Removes Docker containers and volumes (database data will be lost)

---

## 🆘 Troubleshooting Commands

### **Port Conflicts**
```bash
# See what's using your ports
make ports

# Kill all processes on Kayak ports
make kill-ports
```

---

### **Check Versions**
```bash
make version
```
Shows versions of Node.js, npm, Docker, Docker Compose

---

### **If Services Won't Start**
```bash
# 1. Check what's running
make status

# 2. Stop everything
make stop

# 3. Kill any stuck processes
make kill-ports

# 4. Start fresh
make start

# 5. Check health
make health
```

---

## ⚡ Quick Aliases

Shorter versions of common commands:

```bash
make s   # same as: make start
make st  # same as: make stop
make r   # same as: make restart
make h   # same as: make health
make l   # same as: make logs
make t   # same as: make test
```

---

## 📊 Complete Testing Flow

```bash
# 1. First time setup
make setup

# 2. Start services
make start

# 3. Wait a few seconds, then check status
sleep 5
make status

# 4. Run health checks
make health

# 5. Test API endpoints
make test-api

# 6. View logs to verify
make logs

# 7. Open browser and test manually
# http://localhost:3000

# 8. When done, stop services
make stop
```

---

## 🎯 Testing Workflow for Demo/Presentation

```bash
# Before demo
make setup           # One-time setup
make clean          # Clean old logs

# Start demo
make start          # Start everything
sleep 10            # Wait for services
make health         # Verify all green ✅

# During demo
# Open: http://localhost:3000
# Run API tests: make test-api
# Show logs: make logs-api

# After demo
make stop           # Clean shutdown
```

---

## 🔄 Daily Development Workflow

```bash
# Morning - start work
make start
make health         # Quick check

# During development
make logs-api       # Watch specific service
make restart        # After code changes
make test-api       # Quick API test

# End of day
make stop
```

---

## 📝 Common Patterns

### **Reset and Test Fresh**
```bash
make stop
make db-reset
make start
make test-api
```

### **Quick Restart with Logs**
```bash
make restart && make logs
```

### **Full Clean Start**
```bash
make stop
make clean
make clean-docker
make setup
make start
```

---

## 🐛 Common Issues

### **Issue: "Docker not running"**
```bash
# Solution
# Start Docker Desktop app
make check-docker
```

### **Issue: "Port already in use"**
```bash
# Solution
make kill-ports
make start
```

### **Issue: "Database connection failed"**
```bash
# Solution
make db-stop
make db-start
sleep 60
make db-check
```

### **Issue: "Services won't start"**
```bash
# Solution
make clean
make stop
make kill-ports
make start
```

---

## 💡 Pro Tips

1. **Always check status first:**
   ```bash
   make status
   ```

2. **Use health checks often:**
   ```bash
   make health
   ```

3. **Watch logs during development:**
   ```bash
   make dev  # Starts with live logs
   ```

4. **Keep Docker clean:**
   ```bash
   # Every few days
   make clean-docker
   make db-start
   make db-seed
   ```

5. **Before committing code:**
   ```bash
   make clean
   make test
   ```

---

## 📚 Related Documentation

- **Setup Guide:** `docs/ENVIRONMENT_SETUP.md`
- **Testing Guide:** `docs/TEST_GUIDE.md`
- **Production Checklist:** `docs/PROD_DEPLOYMENT_CHECKLIST.md`
- **Next Steps:** `docs/NEXT_STEPS_PLAN.md`

---

## 🎓 For Academic Submission

### **Before Demo Day:**
```bash
make clean
make clean-docker
make setup
make test
```

### **Demo Day Preparation:**
```bash
# 30 minutes before presentation
make start
make health     # Ensure all ✅
make test-api   # Verify API works

# Have these ready to run during demo:
make status     # Show architecture
make logs-api   # Show real-time activity
make db-check   # Show data volume
```

### **Performance Testing Setup:**
```bash
make start
# Run JMeter tests
# Document results for 4 scenarios:
# 1. Base (B)
# 2. Base + SQL Caching (B+S)
# 3. Base + SQL + Kafka (B+S+K)
# 4. Base + SQL + Kafka + Other (B+S+K+O)
```

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Maintained By:** Development Team

