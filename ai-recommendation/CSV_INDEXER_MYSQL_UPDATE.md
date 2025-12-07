# CSV Indexer MySQL Implementation

## Current Status

The CSV indexer (`csv_data_indexer.py`) uses **MySQL** exclusively for indexing CSV data. This provides:

1. **Unified infrastructure** - Same database system as main application
2. **Production-ready** - Better for concurrent access and scaling
3. **Consistency** - All data in MySQL databases
4. **Easier backup/restore** - All databases in one system

## Implementation

The CSV indexer:
1. Uses MySQL exclusively (no SQLite fallback)
2. Creates separate database `{main_db}_csv_index` for CSV data (default: `kayak_csv_index`)
3. Uses SQLAlchemy with `pymysql` for MySQL connections
4. Automatically creates database and tables if they don't exist

## Configuration

Add to `.env`:
```bash
# MySQL configuration (required)
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak

# CSV index will use: kayak_csv_index database
# Or specify custom name:
CSV_INDEX_DB_NAME=kayak_csv_index
```

## Installation

Install required Python package:
```bash
pip install pymysql
```

## Benefits

✅ **Consistency** - Same database system for all data  
✅ **Production-ready** - MySQL better for concurrent access  
✅ **Unified backup** - All data in one database system  
✅ **No SQLite dependencies** - Pure MySQL implementation  

