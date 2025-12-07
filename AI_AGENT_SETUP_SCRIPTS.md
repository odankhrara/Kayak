# AI Agent Setup Scripts - Complete Guide

This document outlines all the scripts that need to be run for the AI Recommendation Agent to work properly.

## 📋 Prerequisites

1. **Docker containers running** (MySQL, MongoDB, Redis, Kafka)
   ```bash
   cd src/infra
   docker-compose up -d
   ```

2. **Python virtual environment activated**
   ```bash
   cd ai-recommendation
   source venv/bin/activate
   ```

3. **Environment variables set** (in `ai-recommendation/.env`):
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3307
   MYSQL_USER=root
   MYSQL_PASSWORD=password
   MYSQL_DATABASE=kayak
   CSV_INDEX_DB_NAME=kayak_csv_index
   ```

4. **Python package installed**:
   ```bash
   pip install pymysql
   ```

---

## 🚀 Script Execution Order

### **Step 1: Index CSV Data into MySQL** ⭐ **REQUIRED**

This indexes all CSV files (flights, hotels, airports, routes) into the `kayak_csv_index` MySQL database for the AI agent to query.

```bash
cd ai-recommendation
source venv/bin/activate
python scripts/index_all_datasets.py
```

**What it does:**
- Reads CSV files from `ai-recommendation/data/raw/`
- Indexes flights, hotels, airports, and routes into `kayak_csv_index` MySQL database
- Creates tables: `flights`, `hotels`, `airports`, `routes`

**Expected output:**
- Files processed: 5-10
- Flights indexed: 20,000+
- Hotels indexed: 10,000+
- Airports indexed: 7,000+
- Routes indexed: 60,000+

---

### **Step 2: Populate Main MySQL Database** ⭐ **REQUIRED**

This populates the main `kayak` MySQL database with flights, hotels, and cars that the booking system uses. The AI agent can also query this database as a fallback.

```bash
# From project root
python scripts/populate_booking_database.py
```

**What it does:**
- Populates `flights` table in `kayak` database
- Populates `hotels` table in `kayak` database
- Populates `cars` table in `kayak` database

**Expected output:**
- 500+ flights
- 200+ hotels
- 200+ cars

**Alternative (individual scripts):**
```bash
# Populate flights only
python scripts/populate_flights_from_datasets.py

# Populate cars only
python scripts/populate_cars_from_datasets.py
```

---

### **Step 3: Populate AI Service Database with Deals** ⭐ **REQUIRED**

This populates the AI service's MySQL database (`kayak` database) with flight and hotel deals that the AI agent uses for recommendations.

```bash
cd ai-recommendation
source venv/bin/activate
python scripts/populate_all_deals.py
```

**What it does:**
- Indexes CSV data (if not already done)
- Populates `flight_deals` table in MySQL `kayak` database
- Populates `hotel_deals` table in MySQL `kayak` database
- Creates deals with pricing, discounts, and scores

**Expected output:**
- 1,000+ flight deals
- 500+ hotel deals

**Alternative script:**
```bash
# Simpler version (populates from CSV index only)
python scripts/populate_all_datasets.py
```

---

### **Step 4: Verify Data Import** ✅ **RECOMMENDED**

Check that all data was imported successfully:

```bash
# From project root
python scripts/check_data_import_status.py
```

**What it checks:**
- CSV index database status
- MySQL main database status
- AI service database status
- Provides summary of data counts

---

## 📝 Complete Setup Command Sequence

Here's the complete sequence to run all scripts:

```bash
# 1. Ensure Docker is running
cd src/infra
docker-compose up -d

# 2. Index CSV data
cd ../../ai-recommendation
source venv/bin/activate
python scripts/index_all_datasets.py

# 3. Populate main MySQL database
cd ../..
python scripts/populate_booking_database.py

# 4. Populate AI service deals database
cd ai-recommendation
python scripts/populate_all_deals.py

# 5. Verify data import
cd ..
python scripts/check_data_import_status.py

# 6. Start AI service
cd ai-recommendation
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

---

## 🔍 Script Details

### **Script 1: `index_all_datasets.py`**
- **Location**: `ai-recommendation/scripts/index_all_datasets.py`
- **Purpose**: Index CSV files into MySQL `kayak_csv_index` database
- **Dependencies**: CSV files in `ai-recommendation/data/raw/`
- **Output**: MySQL database `kayak_csv_index` with indexed data

### **Script 2: `populate_booking_database.py`**
- **Location**: `scripts/populate_booking_database.py` (project root)
- **Purpose**: Populate main `kayak` MySQL database with flights, hotels, cars
- **Dependencies**: CSV index database (from Step 1)
- **Output**: MySQL database `kayak` with booking data

### **Script 3: `populate_all_deals.py`**
- **Location**: `ai-recommendation/scripts/populate_all_deals.py`
- **Purpose**: Populate AI service database with flight and hotel deals
- **Dependencies**: CSV index database (from Step 1)
- **Output**: AI service database with deals

### **Script 4: `check_data_import_status.py`**
- **Location**: `scripts/check_data_import_status.py` (project root)
- **Purpose**: Verify all data was imported correctly
- **Dependencies**: All previous scripts completed
- **Output**: Status report of all databases

---

## ⚠️ Important Notes

1. **Order matters**: Run scripts in the order listed above
2. **MySQL must be running**: All scripts require MySQL to be accessible
3. **CSV files must exist**: Ensure CSV files are in `ai-recommendation/data/raw/`
4. **Virtual environment**: Activate venv before running AI scripts
5. **Time required**: Full setup takes 5-15 minutes depending on data size

---

## 🎯 Quick Start (If Data Already Exists)

If you've already run the scripts before and just need to restart:

```bash
# 1. Start Docker
cd src/infra && docker-compose up -d

# 2. Start AI service
cd ../../ai-recommendation
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

---

## 📊 Expected Final State

After running all scripts, you should have:

- **CSV Index Database** (`kayak_csv_index`):
  - 20,000+ flights
  - 10,000+ hotels
  - 7,000+ airports
  - 60,000+ routes

- **Main MySQL Database** (`kayak`):
  - 500+ flights
  - 200+ hotels
  - 200+ cars

- **AI Service Database** (MySQL `kayak` database):
  - 1,000+ flight deals (in `flight_deals` table)
  - 500+ hotel deals (in `hotel_deals` table)

---

## 🐛 Troubleshooting

### Issue: "No module named 'app'"
**Solution**: Make sure you're in the `ai-recommendation` directory and venv is activated

### Issue: "Can't connect to MySQL"
**Solution**: Check Docker containers are running: `docker ps | grep mysql`

### Issue: "CSV files not found"
**Solution**: Ensure CSV files exist in `ai-recommendation/data/raw/`

### Issue: "Database already exists"
**Solution**: Scripts use `INSERT ... ON DUPLICATE KEY UPDATE`, safe to run multiple times

---

## ✅ Verification

After setup, test the AI agent:

```bash
# Health check
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/api/enhanced-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me flights from FAI to SEA on December 8, 2025"}'
```

