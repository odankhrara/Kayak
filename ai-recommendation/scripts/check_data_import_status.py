#!/usr/bin/env python3
"""Check if data has been imported from CSV files to databases"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add paths
sys.path.insert(0, str(Path(__file__).parent.parent / "ai-recommendation"))

# Try to import pymysql
try:
    import pymysql
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False
    
load_dotenv()

# Database configurations
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3307)),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'password'),
    'database': os.getenv('MYSQL_DATABASE', 'kayak')
}

# CSV Index database name (MySQL)
CSV_INDEX_DB_NAME = os.getenv('CSV_INDEX_DB_NAME', f"{MYSQL_CONFIG['database']}_csv_index")

def check_mysql_database():
    """Check MySQL database (main booking database)"""
    print("📊 Checking MySQL Database (Main Booking Database)")
    print("=" * 60)
    
    if not MYSQL_AVAILABLE:
        print("⚠️  pymysql not installed")
        print("   Install with: pip install pymysql")
        print()
        return {'connected': False, 'error': 'module_not_installed'}
    
    try:
        conn = pymysql.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Check flights
        cursor.execute("SELECT COUNT(*) FROM flights")
        flight_count = cursor.fetchone()[0]
        
        # Check hotels
        cursor.execute("SELECT COUNT(*) FROM hotels")
        hotel_count = cursor.fetchone()[0]
        
        # Check cars
        cursor.execute("SELECT COUNT(*) FROM cars")
        car_count = cursor.fetchone()[0]
        
        # Check hotel rooms
        cursor.execute("SELECT COUNT(*) FROM hotel_rooms")
        room_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ MySQL Connection: Success")
        print(f"   Flights: {flight_count}")
        print(f"   Hotels: {hotel_count}")
        print(f"   Hotel Rooms: {room_count}")
        print(f"   Cars: {car_count}")
        print()
        
        return {
            'connected': True,
            'flights': flight_count,
            'hotels': hotel_count,
            'rooms': room_count,
            'cars': car_count
        }
        
    except Exception as e:
        print(f"❌ MySQL Connection Failed: {e}")
        print(f"   Host: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}")
        print(f"   Database: {MYSQL_CONFIG['database']}")
        print()
        return {'connected': False}

def check_ai_database():
    """Check AI Service database (MySQL)"""
    print("📊 Checking AI Service Database (MySQL)")
    print("=" * 60)
    
    if not MYSQL_AVAILABLE:
        print("⚠️  pymysql not installed")
        print("   Install with: pip install pymysql")
        print()
        return {'exists': False, 'error': 'module_not_installed'}
    
    try:
        # Check if flight_deals and hotel_deals tables exist in MySQL
        conn = pymysql.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("SHOW TABLES LIKE 'flight_deals'")
        has_flight_deals = cursor.fetchone() is not None
        
        cursor.execute("SHOW TABLES LIKE 'hotel_deals'")
        has_hotel_deals = cursor.fetchone() is not None
        
        if not has_flight_deals and not has_hotel_deals:
            print(f"❌ AI Database tables not found in {MYSQL_CONFIG['database']}")
            print("   Tables 'flight_deals' and 'hotel_deals' do not exist")
            print()
            cursor.close()
            conn.close()
            return {'exists': False}
        
        # Check flight_deals count
        flight_deals = 0
        if has_flight_deals:
            cursor.execute("SELECT COUNT(*) FROM flight_deals WHERE is_active = 1")
            flight_deals = cursor.fetchone()[0]
        
        # Check hotel_deals count
        hotel_deals = 0
        if has_hotel_deals:
            cursor.execute("SELECT COUNT(*) FROM hotel_deals WHERE is_active = 1")
            hotel_deals = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ AI Database: Found in MySQL ({MYSQL_CONFIG['database']})")
        print(f"   Flight Deals: {flight_deals}")
        print(f"   Hotel Deals: {hotel_deals}")
        print()
        
        return {
            'exists': True,
            'flight_deals': flight_deals,
            'hotel_deals': hotel_deals
        }
        
    except Exception as e:
        print(f"❌ Error reading AI database: {e}")
        print(f"   Host: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}")
        print(f"   Database: {MYSQL_CONFIG['database']}")
        print()
        return {'exists': False}

def check_csv_index():
    """Check CSV index database (MySQL)"""
    print("📊 Checking CSV Index Database (MySQL)")
    print("=" * 60)
    
    if not MYSQL_AVAILABLE:
        print("⚠️  pymysql not installed")
        print("   Install with: pip install pymysql")
        print()
        return {'exists': False, 'error': 'module_not_installed'}
    
    try:
        # Connect to CSV index database
        csv_config = MYSQL_CONFIG.copy()
        csv_config['database'] = CSV_INDEX_DB_NAME
        
        conn = pymysql.connect(**csv_config)
        cursor = conn.cursor()
        
        # Check if database exists and has tables
        cursor.execute("SHOW TABLES LIKE 'flights'")
        has_flights = cursor.fetchone() is not None
        
        cursor.execute("SHOW TABLES LIKE 'hotels'")
        has_hotels = cursor.fetchone() is not None
        
        cursor.execute("SHOW TABLES LIKE 'airports'")
        has_airports = cursor.fetchone() is not None
        
        if not has_flights and not has_hotels and not has_airports:
            print(f"❌ CSV Index database not found: {CSV_INDEX_DB_NAME}")
            print("   Run: cd ai-recommendation && python scripts/index_all_datasets.py")
            print()
            cursor.close()
            conn.close()
            return {'exists': False}
        
        # Check indexed flights
        indexed_flights = 0
        if has_flights:
            cursor.execute("SELECT COUNT(*) FROM flights")
            indexed_flights = cursor.fetchone()[0]
        
        # Check indexed hotels
        indexed_hotels = 0
        if has_hotels:
            cursor.execute("SELECT COUNT(*) FROM hotels")
            indexed_hotels = cursor.fetchone()[0]
        
        # Check indexed airports
        indexed_airports = 0
        if has_airports:
            cursor.execute("SELECT COUNT(*) FROM airports")
            indexed_airports = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print(f"✅ CSV Index: Found in MySQL ({CSV_INDEX_DB_NAME})")
        print(f"   Indexed Flights: {indexed_flights}")
        print(f"   Indexed Hotels: {indexed_hotels}")
        print(f"   Indexed Airports: {indexed_airports}")
        print()
        
        return {
            'exists': True,
            'flights': indexed_flights,
            'hotels': indexed_hotels,
            'airports': indexed_airports
        }
        
    except Exception as e:
        if "Unknown database" in str(e):
            print(f"❌ CSV Index database not found: {CSV_INDEX_DB_NAME}")
            print("   Run: cd ai-recommendation && python scripts/index_all_datasets.py")
        else:
            print(f"❌ Error reading CSV index: {e}")
            print(f"   Host: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}")
            print(f"   Database: {CSV_INDEX_DB_NAME}")
        print()
        return {'exists': False}

def check_csv_files():
    """Check what CSV files exist"""
    print("📊 Checking CSV Files in data/raw/")
    print("=" * 60)
    
    data_dir = Path(__file__).parent.parent / "data" / "raw"
    
    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        print()
        return []
    
    csv_files = list(data_dir.glob("*.csv"))
    
    if not csv_files:
        print("❌ No CSV files found")
        print()
        return []
    
    print(f"✅ Found {len(csv_files)} CSV files:")
    for csv_file in sorted(csv_files):
        size_mb = csv_file.stat().st_size / (1024 * 1024)
        print(f"   - {csv_file.name} ({size_mb:.1f} MB)")
    print()
    
    return csv_files

def main():
    print("\n" + "=" * 60)
    print("🔍 DATA IMPORT STATUS CHECK")
    print("=" * 60 + "\n")
    
    # Check CSV files
    csv_files = check_csv_files()
    
    # Check CSV index
    csv_index_status = check_csv_index()
    
    # Check MySQL database
    mysql_status = check_mysql_database()
    
    # Check AI database
    ai_status = check_ai_database()
    
    # Summary
    print("📋 SUMMARY")
    print("=" * 60)
    
    if csv_files:
        print("✅ CSV files: Available")
    else:
        print("❌ CSV files: Missing")
    
    if csv_index_status.get('exists'):
        print("✅ CSV Index: Created")
    else:
        print("❌ CSV Index: Not created")
        print("   → Run: cd ai-recommendation && python scripts/index_all_datasets.py")
    
    if mysql_status.get('connected'):
        total_items = (mysql_status.get('flights', 0) + 
                      mysql_status.get('hotels', 0) + 
                      mysql_status.get('cars', 0))
        if total_items > 0:
            print("✅ MySQL Database: Populated")
        else:
            print("⚠️  MySQL Database: Connected but empty")
            print("   → Run: python scripts/populate_booking_database.py")
            print("   → Or: python scripts/populate_flights_from_datasets.py")
            print("   → Or: python scripts/populate_cars_from_datasets.py")
    else:
        print("❌ MySQL Database: Not connected")
        print("   → Make sure MySQL is running (docker-compose up -d)")
    
    if ai_status.get('exists'):
        total_deals = (ai_status.get('flight_deals', 0) + 
                      ai_status.get('hotel_deals', 0))
        if total_deals > 0:
            print("✅ AI Database: Populated")
        else:
            print("⚠️  AI Database: Exists but empty")
            print("   → Run: cd ai-recommendation && python scripts/populate_all_datasets.py")
    else:
        print("❌ AI Database: Not found")
        print("   → Run: cd ai-recommendation && python scripts/populate_all_datasets.py")
    
    print()
    
    # Recommendations
    print("💡 RECOMMENDATIONS")
    print("=" * 60)
    
    needs_index = not csv_index_status.get('exists')
    needs_mysql = not mysql_status.get('connected') or (mysql_status.get('flights', 0) + mysql_status.get('hotels', 0) + mysql_status.get('cars', 0)) == 0
    needs_ai = not ai_status.get('exists') or (ai_status.get('flight_deals', 0) + ai_status.get('hotel_deals', 0)) == 0
    
    if needs_index or needs_mysql or needs_ai:
        print("\nTo import all data, run these commands in order:\n")
        
        if needs_index:
            print("1. Index CSV files:")
            print("   cd ai-recommendation")
            print("   python scripts/index_all_datasets.py\n")
        
        if needs_mysql:
            print("2. Populate MySQL database (main booking database):")
            print("   python scripts/populate_booking_database.py")
            print("   # OR run individual scripts:")
            print("   python scripts/populate_flights_from_datasets.py")
            print("   python scripts/populate_cars_from_datasets.py\n")
        
        if needs_ai:
            print("3. Populate AI service database:")
            print("   cd ai-recommendation")
            print("   python scripts/populate_all_datasets.py\n")
        sys.exit(1)
    else:
        print("\n✅ All data appears to be imported! You can now run the agent.")
        print("   The agent can search for:")
        print("   - Flights (from MySQL flights table)")
        print("   - Hotels (from MySQL hotels table)")
        print("   - Car rentals (from MySQL cars table)")
        print("   - Deals (from AI service database)")
    
    print()

if __name__ == "__main__":
    main()

