# MySQL Database Usage Report

## 📍 All Database Locations in the Project

### 1. **Main AI Service Database** 
**Location:** `ai-recommendation/app/db/session.py`
- **Database:** MySQL (`kayak` database)
- **Usage:** Main database for AI recommendation service
- **Tables:** FlightDeal, HotelDeal, Bundle, PriceWatch, etc.
- **Configuration:** 
  - **MySQL only** (`mysql+pymysql://user:password@host:port/kayak`)
  - Uses `pymysql` for connections
- **Code Reference:**
  ```python
  # MySQL connection string using pymysql
  DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}"
  ```

### 2. **CSV Index Database**
**Location:** `ai-recommendation/app/services/csv_data_indexer.py` and `csv_query_service.py`
- **Database:** MySQL (`kayak_csv_index` database)
- **Usage:** Indexes all CSV datasets for fast querying
- **Tables:** hotels, flights, airports, routes, delays
- **Configuration:**
  - **MySQL only** (`kayak_csv_index` database)
  - Uses `pymysql` via SQLAlchemy
- **Code References:**
  ```python
  # csv_data_indexer.py: MySQL only
  database_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{csv_db_name}"
  
  # csv_query_service.py: MySQL only
  database_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{csv_db_name}"
  ```

### 3. **Scripts Using MySQL**

#### `scripts/check_data_import_status.py`
- **Uses:** `pymysql` for MySQL connections
- **Checks:** MySQL databases `kayak` and `kayak_csv_index`
  ```python
  import pymysql
  conn = pymysql.connect(**MYSQL_CONFIG)
  ```

#### `scripts/populate_booking_database.py`
- **Uses:** `pymysql` for MySQL connections
- **Populates:** MySQL `kayak` database (flights, hotels, cars tables)
  ```python
  import pymysql
  conn = pymysql.connect(**DB_CONFIG)
  ```

#### `scripts/populate_flights_from_datasets.py`
- **Uses:** `pymysql` for MySQL connections
- **Populates:** MySQL `kayak` database (flights table)

#### `scripts/populate_cars_from_datasets.py`
- **Uses:** `pymysql` for MySQL connections
- **Populates:** MySQL `kayak` database (cars table)

### 4. **Environment Variables**

#### `.env` files use MySQL only:
- `MYSQL_HOST=localhost` - MySQL server host
- `MYSQL_PORT=3307` - MySQL server port
- `MYSQL_USER=root` - MySQL username
- `MYSQL_PASSWORD=password` - MySQL password
- `MYSQL_DATABASE=kayak` - Main database name
- `CSV_INDEX_DB_NAME=kayak_csv_index` - CSV index database name

### 5. **Documentation References**

MySQL is mentioned in:
- `README.md` - Main project README (MySQL for all services)
- `ai-recommendation/README.md` - AI service README (MySQL only)
- `ai-recommendation/RUNNING_AI_AGENT.md` - Setup instructions (MySQL only)
- `docs/DATABASE_SCHEMA_DIAGRAM.md` - Database schema documentation (MySQL)
- `AI_AGENT_SETUP_SCRIPTS.md` - Setup scripts guide (MySQL)

## 🔄 Current Status

### **Main Database (MySQL: `kayak` database)**
- **Status:** ✅ **MySQL ONLY** for all AI services
- **Database:** MySQL (`kayak` database)
- **Connection:** Uses `pymysql` Python package
- **Location:** `ai-recommendation/app/db/session.py`
- **Tables:** flight_deals, hotel_deals, bundles, watches, price_history

### **CSV Index Database (MySQL: `kayak_csv_index` database)**
- **Status:** ✅ **MySQL ONLY** for CSV indexing
- **Database:** MySQL (`kayak_csv_index` database)
- **Connection:** Uses `pymysql` via SQLAlchemy
- **Locations:**
  - `ai-recommendation/app/services/csv_data_indexer.py`
  - `ai-recommendation/app/services/csv_query_service.py`
- **Tables:** flights, hotels, airports, routes, delays

## 📊 Summary

**Current Database Configuration:**
- **MySQL Databases (ONLY OPTION):**
  1. `kayak` - Main AI service database
  2. `kayak_csv_index` - CSV data index

- **No SQLite Support:**
  - All SQLite fallback code has been removed
  - All services use MySQL exclusively
  - All scripts use `pymysql` for connections

- **Files Using MySQL:**
  1. `ai-recommendation/app/db/session.py` - Main database session (MySQL only)
  2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer (MySQL only)
  3. `ai-recommendation/app/services/csv_query_service.py` - CSV query service (MySQL only)
  4. `scripts/check_data_import_status.py` - Status checker (MySQL only)
  5. `scripts/populate_booking_database.py` - Database population (MySQL only)
  6. `scripts/populate_flights_from_datasets.py` - Flight population (MySQL only)
  7. `scripts/populate_cars_from_datasets.py` - Car population (MySQL only)

- **MySQL is the ONLY option** - No SQLite fallback available

## ⚙️ Configuration

**MySQL Configuration (Required):**
```bash
# In .env file:
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak
CSV_INDEX_DB_NAME=kayak_csv_index  # CSV index database
```

**Python Package Required:**
```bash
pip install pymysql
```

## 🔍 Files That Use MySQL

1. `ai-recommendation/app/db/session.py` - Database session (MySQL only, uses pymysql)
2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer (MySQL only, uses pymysql)
3. `ai-recommendation/app/services/csv_query_service.py` - CSV queries (MySQL only, uses pymysql)
4. `scripts/check_data_import_status.py` - Status checker (MySQL only, uses pymysql)
5. `scripts/populate_booking_database.py` - Database population (MySQL only, uses pymysql)
6. `scripts/populate_flights_from_datasets.py` - Flight population (MySQL only, uses pymysql)
7. `scripts/populate_cars_from_datasets.py` - Car population (MySQL only, uses pymysql)

## 📝 Notes

- **MySQL is the ONLY database option** for all AI services
- **pymysql is used** for all MySQL connections (not mysql-connector-python)
- **No SQLite support** - All SQLite fallback code has been removed
- **Production-ready** - MySQL provides better concurrent access and reliability
- **Unified infrastructure** - All services use the same MySQL server
- CSV indexer uses MySQL (`kayak_csv_index` database) for consistency

## 🚀 Installation

To use the AI service, ensure you have:

1. **MySQL 8.0** running (Docker or local installation)
2. **pymysql** installed: `pip install pymysql`
3. **Environment variables** configured in `.env` file

The service will automatically:
- Create databases if they don't exist
- Create tables on first run
- Connect using pymysql
