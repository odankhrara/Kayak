# 🔧 Environment Configuration Guide

## Overview

This application uses **environment variables** for configuration. This keeps the code **reusable** while allowing deployment-specific settings.

---

## 📝 Setup Instructions

### **Step 1: Create `.env` File**

Copy the configuration below to a file named `.env` in the project root:

```bash
# Navigate to project root
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak

# Create .env file
cat > .env << 'EOF'
# ============================================
# KAYAK - ENVIRONMENT CONFIGURATION
# ============================================

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=kayak
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DATABASE=kayak

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Kafka Configuration
KAFKA_BROKERS=localhost:9092

# Service Ports
API_GATEWAY_PORT=4000
USER_SERVICE_PORT=8001
LISTING_SERVICE_PORT=8002
BOOKING_SERVICE_PORT=8003
ANALYTICS_SERVICE_PORT=8004
ADMIN_SERVICE_PORT=8006

# Frontend
FRONTEND_PORT=3000

# Environment
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production
EOF
```

### **Step 2: Load Environment Variables**

The `.env` file needs to be loaded when services start. Add this to each service's startup:

**Option A: Using dotenv (Recommended)**

Already configured! Each service has:
```typescript
import dotenv from 'dotenv'
dotenv.config()
```

**Option B: Export in shell**
```bash
export $(cat .env | xargs)
```

---

## 🎯 Why This Approach?

### **✅ Code Remains Reusable**
```typescript
// mysqlPool.ts - Uses standard defaults
port: parseInt(process.env.MYSQL_PORT || '3306')  // Standard port
user: process.env.MYSQL_USER || 'root'            // Standard user
```

**Anyone using this code:**
- No `.env` file? → Uses standard MySQL (port 3306, user root) ✅
- Has `.env` file? → Uses custom settings ✅

### **✅ Deployment-Specific Configuration**
```bash
# .env - YOUR specific deployment
MYSQL_PORT=3307  # Override for Docker mapping
MYSQL_USER=kayak # Override for security
```

**Your deployment:**
- MySQL exposed on port 3307 (no conflicts with other apps) ✅
- Custom user 'kayak' instead of 'root' ✅

---

## 📊 Configuration Hierarchy

```
Environment Variable (highest priority)
    ↓ (if not set)
Code Default (standard MySQL settings)
```

**Example:**
1. Check `process.env.MYSQL_PORT` → If set, use it
2. If not set → Use default `3306`

---

## 🔒 Security Note

**`.env` files should NEVER be committed to Git!**

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## 🚀 Quick Start

**Create your `.env` file:**
```bash
make create-env  # Coming soon
```

Or manually:
```bash
cd /path/to/Kayak
cat > .env << 'EOF'
MYSQL_PORT=3307
MYSQL_USER=kayak
MYSQL_PASSWORD=password
EOF
```

**Start services:**
```bash
make start
```

The services will automatically read from `.env` and use your custom configuration!

---

## 🧪 Testing Different Configurations

**Development (port 3307):**
```bash
MYSQL_PORT=3307 make start
```

**Standard MySQL (port 3306):**
```bash
MYSQL_PORT=3306 make start
```

**Custom host:**
```bash
MYSQL_HOST=db.example.com MYSQL_PORT=3306 make start
```

---

## 📚 Complete Variable Reference

| Variable | Default | Your Setting | Purpose |
|----------|---------|--------------|---------|
| `MYSQL_HOST` | `localhost` | `localhost` | MySQL host |
| `MYSQL_PORT` | `3306` | `3307` | MySQL port (Docker mapped) |
| `MYSQL_USER` | `root` | `kayak` | MySQL user |
| `MYSQL_PASSWORD` | `password` | `password` | MySQL password |
| `MYSQL_DATABASE` | `kayak` | `kayak` | Database name |
| `REDIS_URL` | `redis://localhost:6379` | Same | Redis connection |
| `MONGO_URL` | `mongodb://localhost:27017` | Same | MongoDB connection |

---

## ✅ Verification

Check if environment variables are loaded:

```bash
# In your service
console.log('MySQL Port:', process.env.MYSQL_PORT || '3306')
```

Expected output:
```
MySQL Port: 3307  ← From .env file
```

---

## 🎓 Best Practices

1. ✅ **Code:** Use standard defaults
2. ✅ **Deployment:** Override via `.env`
3. ✅ **Security:** Never commit `.env`
4. ✅ **Documentation:** Document all variables
5. ✅ **Testing:** Test with and without `.env`

This keeps your code **portable** and **secure**! 🎯

