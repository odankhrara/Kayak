#!/usr/bin/env python3
"""Index all CSV datasets for AI agent access"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.csv_data_indexer import CSVDataIndexer


def main():
    """Index all CSV datasets"""
    print("📊 CSV Dataset Indexer")
    print("=" * 50)
    
    # Get data directory
    data_dir = os.getenv("DATASETS_DIR", "./data/raw")
    # MySQL CSV index database name (not file path)
    csv_db_name = os.getenv("CSV_INDEX_DB_NAME", f"{os.getenv('MYSQL_DATABASE', 'kayak')}_csv_index")
    
    print(f"Data directory: {data_dir}")
    print(f"CSV index database: {csv_db_name} (MySQL)")
    print()
    
    # Initialize indexer (uses MySQL by default)
    indexer = CSVDataIndexer(data_dir=data_dir)
    
    # Index all datasets
    print("🔄 Starting indexing process...")
    stats = indexer.index_all_datasets()
    
    # Print results
    print()
    print("✅ Indexing complete!")
    print("=" * 50)
    print(f"Files processed: {stats['files_processed']}")
    print(f"Hotels indexed: {stats['hotels_indexed']}")
    print(f"Flights indexed: {stats['flights_indexed']}")
    print(f"Airports indexed: {stats['airports_indexed']}")
    print(f"Routes indexed: {stats['routes_indexed']}")
    print(f"Delays indexed: {stats['delays_indexed']}")
    
    if stats['errors']:
        print()
        print("⚠️  Errors encountered:")
        for error in stats['errors']:
            print(f"  - {error}")
    
    indexer.close()
    print()
    print("💡 The AI agent can now access this data for accurate responses!")


if __name__ == "__main__":
    main()

