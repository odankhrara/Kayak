# CSV Indexer MySQL Support Update

## Current Status

The CSV indexer (`csv_data_indexer.py`) currently uses **SQLite3** for indexing CSV data. This was a design choice because:

1. **Read-heavy workload** - CSV data is indexed once and queried many times
2. **Simplicity** - No database server setup required
3. **Performance** - SQLite is very fast for read operations
4. **Portability** - Single file database easy to backup/move

## Why Update to MySQL?

For **consistency** with the main application database:
- If main database uses MySQL, CSV index should too
- Unified database infrastructure
- Better for production deployments
- Easier backup/restore procedures

## Implementation Plan

The CSV indexer will be updated to:
1. Check `USE_MYSQL` environment variable (same as main database)
2. Use MySQL if `USE_MYSQL=true`, otherwise use SQLite (default)
3. Create separate database `{main_db}_csv_index` for CSV data
4. Use SQLAlchemy for MySQL to handle SQL differences automatically

## Configuration

Add to `.env`:
```bash
# Use MySQL for CSV index (same as main database)
USE_MYSQL=true
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=kayak

# CSV index will use: kayak_csv_index database
# Or specify custom name:
CSV_INDEX_DB_NAME=kayak_csv_index
```

## Migration Notes

- **SQLite (default)**: No changes needed, continues to work
- **MySQL**: Requires MySQL server running and database created
- **Backward compatible**: Existing SQLite indexes continue to work

## Benefits

✅ **Consistency** - Same database system for all data  
✅ **Production-ready** - MySQL better for concurrent access  
✅ **Unified backup** - All data in one database system  
✅ **Flexibility** - Can still use SQLite for development  

