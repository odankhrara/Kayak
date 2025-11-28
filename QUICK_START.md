# ⚡ Kayak Quick Start Guide

**One-command startup and essential Makefile commands**

---

## 🚀 **Essential Commands**

### **Start Everything (Fresh Setup):**
```bash
make setup    # Full setup: Docker + DB + seed + install
make start    # Start all services
```

### **Start Everything (Already Setup):**
```bash
make start    # Start Docker + backend + frontend
```

### **Stop Everything:**
```bash
make stop     # Stop all services gracefully
```

### **Check Status:**
```bash
make status   # See what's running
make health   # Test all service health endpoints
```

---

## 📋 **Common Workflows**

### **First Time Setup (New Machine):**
```bash
# Step 1: Full setup (once)
make setup

# Step 2: Start services
make start

# Step 3: Verify everything works
make health
```

**That's it!** Access at: http://localhost:3000

---

### **Daily Development:**
```bash
# Morning: Start everything
make start

# Check if everything is up
make status

# Evening: Stop everything
make stop
```

---

### **Troubleshooting:**
```bash
# Something not working? Check status
make status

# See what's broken
make health

# View logs
make logs              # All logs
make logs-api          # API Gateway only
make logs-listing      # Listing Service only
make logs-frontend     # Frontend only

# Nuclear option: Full restart
make restart
```

---

### **Database Operations:**
```bash
# Reset database (WARNING: Deletes all data)
make db-reset

# Just re-seed data (keeps schema)
make db-seed

# Access MySQL shell
make db-shell-mysql

# Access MongoDB shell  
make db-shell-mongo

# Check database stats
make db-check
```

---

## 🎯 **Most Useful Commands**

| Command | What It Does | When To Use |
|---------|--------------|-------------|
| `make start` | Start everything | Every time you work |
| `make stop` | Stop everything | When you're done |
| `make status` | Show what's running | Troubleshooting |
| `make health` | Test all services | Verify everything works |
| `make logs` | Watch all logs | Debug issues |
| `make restart` | Full restart | When things are broken |

---

## ⚡ **Quick Commands (Aliases):**

```bash
make s    # = make start
make st   # = make stop
make r    # = make restart
make h    # = make health
make l    # = make logs
make t    # = make test
```

---

## 🔧 **Utility Commands**

```bash
make ports          # See which ports are in use
make kill-ports     # Kill all processes on Kayak ports
make version        # Show versions of Node, Docker, etc.
make clean          # Clean logs and temp files
```

---

## 📊 **Your Current Setup (Verified):**

✅ All services running and healthy:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- User Service: Port 8001
- Listing Service: Port 8002
- Booking Service: Port 8003
- Analytics Service: Port 8004
- MySQL: Port 3306
- MongoDB: Port 27017
- Redis: Port 6379
- Kafka: Port 9092

---

## 🎯 **Complete Setup from Scratch:**

If you ever need to set up on a new machine:

```bash
# 1. Clone repo
git clone <your-repo>
cd Kayak

# 2. One command to rule them all
make setup

# 3. Wait ~2 minutes for setup to complete

# 4. Start everything
make start

# 5. Verify
make health

# 6. Open browser
# http://localhost:3000
```

**Done in 4 commands!** 🎉

---

## 🧪 **Test the System:**

```bash
# Start everything
make start

# Wait 30 seconds for services to fully initialize
sleep 30

# Run health checks
make health

# Expected output: All ✅
```

---

## 🔥 **Emergency Commands:**

### System is Completely Broken?
```bash
make stop
make kill-ports
make db-reset
make setup
make start
```

### Just Need Fresh Data?
```bash
make db-reset    # Drops DB, recreates, re-seeds
make restart     # Restart services
```

### Port Conflicts?
```bash
make kill-ports  # Force kill everything on Kayak ports
make start       # Restart
```

---

## 📝 **Pro Tips:**

1. **Always use `make start`** instead of manually starting services
2. **Use `make status`** to see what's actually running
3. **Use `make health`** to verify all services respond
4. **Use `make logs`** to debug issues in real-time
5. **Use `make stop`** before shutting down your computer

---

## ✅ **Your Makefile is Production-Ready!**

**No need for 100 steps - just use:**
```bash
make start    # Start
make stop     # Stop
make status   # Check
```

**That's it!** 🚀

---

**Last Updated:** November 28, 2025  
**Makefile Version:** 1.0 (Verified Working)

