# SQLite Usage Report

## 📍 All SQLite Locations in the Project

### 1. **Main AI Service Database** 
**Location:** `ai-recommendation/app/db/session.py`
- **File:** `ai_recommendations.db` (created in `ai-recommendation/` directory)
- **Usage:** Main database for AI recommendation service
- **Tables:** FlightDeal, HotelDeal, Bundle, PriceWatch, etc.
- **Configuration:** 
  - Default: SQLite (`sqlite:///./ai_recommendations.db`)
  - Can switch to MySQL with `USE_MYSQL=true`
- **Code Reference:**
  ```python
  # Line 23: Fallback to SQLite
  DATABASE_URL = "sqlite:///./ai_recommendations.db"
  ```

### 2. **CSV Index Database**
**Location:** `ai-recommendation/app/services/csv_data_indexer.py` and `csv_query_service.py`
- **File:** `csv_index.db` (created in `ai-recommendation/` directory)
- **Usage:** Indexes all CSV datasets for fast querying
- **Tables:** hotels, flights, airports, routes, delays
- **Configuration:**
  - Default: SQLite (`./csv_index.db`)
  - Can switch to MySQL with `USE_MYSQL=true` (uses `kayak_csv_index` database)
- **Code References:**
  ```python
  # csv_data_indexer.py line 77
  self.index_db = sqlite3.connect(self.index_db_path, check_same_thread=False)
  
  # csv_query_service.py line 63
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

#### `.env` files reference SQLite:
- `DATABASE_URL=sqlite:///./ai_recommendations.db` (fallback)
- `CSV_INDEX_DB=./csv_index.db` (CSV index path)
- `USE_MYSQL=false` (to use SQLite instead of MySQL)

### 5. **Documentation References**

SQLite is mentioned in:
- `README.md` - SQLite as default database
- `ai-recommendation/README.md` - SQLite configuration
- `ai-recommendation/RUNNING_AI_AGENT.md` - SQLite setup instructions
- `ai-recommendation/CSV_INDEXER_MYSQL_UPDATE.md` - SQLite vs MySQL comparison
- `docs/DATABASE_SCHEMA_DIAGRAM.md` - SQLite schema documentation

## 🔄 Current Status

### **Main Database (ai_recommendations.db)**
- **Status:** ✅ Configured to use MySQL (when `USE_MYSQL=true`)
- **Fallback:** SQLite (when `USE_MYSQL=false` or not set)
- **Location:** `ai-recommendation/app/db/session.py`

### **CSV Index Database (csv_index.db)**
- **Status:** ✅ Supports both SQLite and MySQL
- **Default:** SQLite (`./csv_index.db`)
- **MySQL Option:** Uses `kayak_csv_index` database when `USE_MYSQL=true`
- **Locations:**
  - `ai-recommendation/app/services/csv_data_indexer.py`
  - `ai-recommendation/app/services/csv_query_service.py`

## 📊 Summary

**Total SQLite Usage:**
- **2 Database Files:**
  1. `ai_recommendations.db` - Main AI service database
  2. `csv_index.db` - CSV data index

- **2 Main Files Using SQLite:**
  1. `ai-recommendation/app/db/session.py` - Main database session
  2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer
  3. `ai-recommendation/app/services/csv_query_service.py` - CSV query service

- **Both support MySQL fallback** when `USE_MYSQL=true` is set

## ⚙️ Configuration

**To use SQLite (default):**
```bash
# In .env file:
USE_MYSQL=false
# OR omit USE_MYSQL entirely
```

**To use MySQL:**
```bash
# In .env file:
USE_MYSQL=true
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak
CSV_INDEX_DB_NAME=kayak_csv_index
```

## 🔍 Files That Import/Use SQLite

1. `ai-recommendation/app/db/session.py` - Database session (SQLite fallback)
2. `ai-recommendation/app/services/csv_data_indexer.py` - CSV indexer (SQLite default)
3. `ai-recommendation/app/services/csv_query_service.py` - CSV queries (SQLite default)
4. `scripts/check_data_import_status.py` - Status checker (reads SQLite files)

## 📝 Notes

- SQLite is used as a **fallback/development** option
- MySQL is the **production/preferred** option (when configured)
- Both databases can coexist - SQLite for dev, MySQL for production
- CSV indexer defaults to SQLite but can use MySQL for consistency

