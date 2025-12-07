# SQLite Usage Report

## 📍 All SQLite Locations in the Project

### 1. **Main AI Service Database** 
**Location:** `ai-recommendation/app/db/session.py`
- **Database:** MySQL (`kayak` database)
- **Usage:** Main database for AI recommendation service
- **Tables:** FlightDeal, HotelDeal, Bundle, PriceWatch, etc.
- **Configuration:** 
  - **Default: MySQL** (`mysql+pymysql://user:password@host:port/kayak`)
  - SQLite is fallback (only if `USE_MYSQL=false`)
- **Code Reference:**
  ```python
  # Line 18: MySQL is default
  use_mysql = os.getenv("USE_MYSQL", "true").lower() == "true"
  # Line 23: SQLite fallback (only if USE_MYSQL=false)
  DATABASE_URL = "sqlite:///./ai_recommendations.db"
  ```

### 2. **CSV Index Database**
**Location:** `ai-recommendation/app/services/csv_data_indexer.py` and `csv_query_service.py`
- **Database:** MySQL (`kayak_csv_index` database)
- **Usage:** Indexes all CSV datasets for fast querying
- **Tables:** hotels, flights, airports, routes, delays
- **Configuration:**
  - **Default: MySQL** (`kayak_csv_index` database)
  - SQLite is fallback (only if `USE_MYSQL=false`, uses `./csv_index.db`)
- **Code References:**
  ```python
  # csv_data_indexer.py line 42: MySQL is default
  self.use_mysql = os.getenv("USE_MYSQL", "true").lower() == "true"
  # csv_data_indexer.py line 77: SQLite fallback
  self.index_db = sqlite3.connect(self.index_db_path, check_same_thread=False)
  
  # csv_query_service.py line 25: MySQL is default
  self.use_mysql = os.getenv("USE_MYSQL", "true").lower() == "true"
  # csv_query_service.py line 63: SQLite fallback
  self.index_db = sqlite3.connect(self.index_db_path, check_same_thread=False)
  ```

### 3. **Scripts Using SQLite**

#### `scripts/check_data_import_status.py`
- **Lines 29-30:** Checks SQLite databases
  ```python
  AI_DB_PATH = Path(__file__).parent.parent / "ai-recommendation" / "ai_recommendations.db"
  CSV_INDEX_PATH = Path(__file__).parent.parent / "ai-recommendation" / "csv_index.db"
  ```
- **Lines 99, 141:** Opens SQLite connections
  ```python
  conn = sqlite3.connect(str(AI_DB_PATH))
  conn = sqlite3.connect(str(CSV_INDEX_PATH))
  ```

#### `scripts/populate_booking_database.py`
- **Line 44, 416:** References CSV index path
  ```python
  csv_index_path = Path(__file__).parent.parent / "ai-recommendation" / "csv_index.db"
  ```

### 4. **Environment Variables**

#### `.env` files reference SQLite (fallback only):
- `DATABASE_URL=sqlite:///./ai_recommendations.db` (only used if `USE_MYSQL=false`)
- `CSV_INDEX_DB=./csv_index.db` (only used if `USE_MYSQL=false`)
- `USE_MYSQL=false` (to use SQLite instead of MySQL - MySQL is default)

### 5. **Documentation References**

SQLite is mentioned in:
- `README.md` - MySQL is default database (SQLite fallback)
- `ai-recommendation/README.md` - MySQL configuration (SQLite fallback)
- `ai-recommendation/RUNNING_AI_AGENT.md` - MySQL setup instructions (SQLite fallback)
- `ai-recommendation/CSV_INDEXER_MYSQL_UPDATE.md` - SQLite vs MySQL comparison
- `docs/DATABASE_SCHEMA_DIAGRAM.md` - Database schema documentation (MySQL/SQLite)

## 🔄 Current Status

### **Main Database (MySQL: `kayak` database)**
- **Status:** ✅ **MySQL is DEFAULT** for all AI services
- **Default:** MySQL (`kayak` database)
- **Fallback:** SQLite (`ai_recommendations.db` only when `USE_MYSQL=false`)
- **Location:** `ai-recommendation/app/db/session.py`

### **CSV Index Database (MySQL: `kayak_csv_index` database)**
- **Status:** ✅ **MySQL is DEFAULT** for CSV indexing
- **Default:** MySQL (`kayak_csv_index` database)
- **Fallback:** SQLite (`./csv_index.db` only when `USE_MYSQL=false`)
- **Locations:**
  - `ai-recommendation/app/services/csv_data_indexer.py`
  - `ai-recommendation/app/services/csv_query_service.py`

## 📊 Summary

**Current Database Configuration:**
- **MySQL Databases (DEFAULT):**
  1. `kayak` - Main AI service database
  2. `kayak_csv_index` - CSV data index

- **SQLite Files (FALLBACK ONLY):**
  1. `ai_recommendations.db` - Only used if `USE_MYSQL=false`
  2. `csv_index.db` - Only used if `USE_MYSQL=false`

- **Files Supporting Both:**
  1. `ai-recommendation/app/db/session.py` - Main database session (MySQL default)
  2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer (MySQL default)
  3. `ai-recommendation/app/services/csv_query_service.py` - CSV query service (MySQL default)

- **MySQL is the default** - SQLite is only used as fallback when `USE_MYSQL=false`

## ⚙️ Configuration

**MySQL is DEFAULT (Recommended):**
```bash
# In .env file (MySQL is default, no need to set USE_MYSQL):
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak
CSV_INDEX_DB_NAME=kayak_csv_index  # CSV index database

# Or explicitly set:
USE_MYSQL=true
```

**To use SQLite (fallback only):**
```bash
# In .env file:
USE_MYSQL=false
# This will use SQLite files: ai_recommendations.db and csv_index.db
```

## 🔍 Files That Import/Use SQLite

1. `ai-recommendation/app/db/session.py` - Database session (MySQL default, SQLite fallback)
2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer (MySQL default, SQLite fallback)
3. `ai-recommendation/app/services/csv_query_service.py` - CSV queries (MySQL default, SQLite fallback)
4. `scripts/check_data_import_status.py` - Status checker (reads SQLite files when fallback is used)

## 📝 Notes

- **MySQL is the DEFAULT** for all AI services
- SQLite is used as a **fallback/development** option (only when `USE_MYSQL=false`)
- **Production:** MySQL is recommended and default
- **Development:** Can use SQLite by setting `USE_MYSQL=false`
- Both databases can coexist - MySQL for production, SQLite for local dev if needed
- CSV indexer defaults to MySQL (`kayak_csv_index` database) for consistency

