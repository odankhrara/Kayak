"""CSV Data Indexer - Indexes all CSV datasets for AI agent access"""
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
import os
import json
from datetime import datetime
from collections import defaultdict
import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class CSVDataIndexer:
    """
    Indexes all CSV datasets and makes them searchable for the AI agent.
    
    Supports:
    - Inside Airbnb (NYC)
    - Hotel Booking Demand
    - Flight Price Prediction
    - Flight Prices (Expedia)
    - US Flight Delays & Cancellations
    - Global Airports
    - Airlines, Airport and Routes
    - Expedia Hotel Recommendations
    """
    
    def __init__(self, data_dir: Optional[str] = None, index_db_path: Optional[str] = None):
        """
        Initialize the CSV data indexer
        
        Args:
            data_dir: Directory containing CSV files (default: ./data/raw)
            index_db_path: Path to index database (default: ./csv_index.db, but MySQL is used by default)
        """
        if data_dir is None:
            data_dir = os.getenv("DATASETS_DIR", "./data/raw")
        self.data_dir = Path(data_dir)
        
        # Determine database type and connection (MySQL is default for AI services)
        self.use_mysql = os.getenv("USE_MYSQL", "true").lower() == "true"
        self.index_db_path = index_db_path or os.getenv("CSV_INDEX_DB", "./csv_index.db")
        
        # Initialize database connection
        self.index_db = None
        self.engine = None
        self.Session = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize database for indexing (SQLite or MySQL)"""
        if self.use_mysql:
            # Use MySQL - construct connection string from environment variables
            mysql_host = os.getenv("MYSQL_HOST", "localhost")
            mysql_port = os.getenv("MYSQL_PORT", "3307")
            mysql_user = os.getenv("MYSQL_USER", "root")
            mysql_password = os.getenv("MYSQL_PASSWORD", "password")
            mysql_database = os.getenv("MYSQL_DATABASE", "kayak")
            
            # Use a separate database for CSV index or same database with different table prefix
            csv_db_name = os.getenv("CSV_INDEX_DB_NAME", f"{mysql_database}_csv_index")
            database_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{csv_db_name}"
            
            self.engine = create_engine(
                database_url,
                echo=False,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            self.Session = sessionmaker(bind=self.engine)
            # For compatibility, create a cursor-like interface
            self.index_db = self.engine.connect()
            print(f"✅ Using MySQL for CSV index: {csv_db_name}")
        else:
            # Use SQLite (fallback only)
            self.index_db = sqlite3.connect(self.index_db_path, check_same_thread=False)
            print(f"✅ Using SQLite for CSV index (fallback): {self.index_db_path}")
        
        cursor = self._get_cursor()
        
        # Create tables for different data types
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id TEXT PRIMARY KEY,
                name TEXT,
                city TEXT,
                state TEXT,
                country TEXT,
                address TEXT,
                price_per_night REAL,
                rating REAL,
                amenities TEXT,
                room_type TEXT,
                latitude REAL,
                longitude REAL,
                source TEXT,
                raw_data TEXT,
                indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flights (
                id TEXT PRIMARY KEY,
                airline TEXT,
                flight_number TEXT,
                origin TEXT,
                destination TEXT,
                origin_city TEXT,
                dest_city TEXT,
                price REAL,
                departure_time TEXT,
                arrival_time TEXT,
                duration REAL,
                stops INTEGER,
                class TEXT,
                available_seats INTEGER,
                source TEXT,
                raw_data TEXT,
                indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS airports (
                code TEXT PRIMARY KEY,
                name TEXT,
                city TEXT,
                country TEXT,
                latitude REAL,
                longitude REAL,
                timezone TEXT,
                iata TEXT,
                icao TEXT,
                source TEXT,
                raw_data TEXT,
                indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY,
                airline TEXT,
                airline_id TEXT,
                origin_airport TEXT,
                dest_airport TEXT,
                origin_city TEXT,
                dest_city TEXT,
                stops INTEGER,
                codeshare INTEGER,
                equipment TEXT,
                source TEXT,
                raw_data TEXT,
                indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flight_delays (
                id TEXT PRIMARY KEY,
                year INTEGER,
                month INTEGER,
                day INTEGER,
                airline TEXT,
                flight_number TEXT,
                origin_airport TEXT,
                dest_airport TEXT,
                departure_delay REAL,
                arrival_delay REAL,
                cancelled INTEGER,
                diverted INTEGER,
                source TEXT,
                raw_data TEXT,
                indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for fast searching
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels(price_per_night)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_origin ON flights(origin)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_dest ON flights(destination)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(origin, destination)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_airports_code ON airports(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_routes_route ON routes(origin_airport, dest_airport)")
        
        self.index_db.commit()
    
    def index_all_datasets(self) -> Dict[str, Any]:
        """
        Index all CSV datasets found in the data directory
        
        Returns:
            Statistics about indexed data
        """
        stats = {
            "hotels_indexed": 0,
            "flights_indexed": 0,
            "airports_indexed": 0,
            "routes_indexed": 0,
            "delays_indexed": 0,
            "files_processed": 0,
            "errors": []
        }
        
        csv_files = list(self.data_dir.glob("*.csv"))
        
        if not csv_files:
            print(f"⚠️  No CSV files found in {self.data_dir}")
            return stats
        
        print(f"📊 Found {len(csv_files)} CSV files to index...")
        
        for csv_file in csv_files:
            try:
                print(f"📄 Processing {csv_file.name}...")
                file_stats = self._index_file(csv_file)
                
                stats["hotels_indexed"] += file_stats.get("hotels", 0)
                stats["flights_indexed"] += file_stats.get("flights", 0)
                stats["airports_indexed"] += file_stats.get("airports", 0)
                stats["routes_indexed"] += file_stats.get("routes", 0)
                stats["delays_indexed"] += file_stats.get("delays", 0)
                stats["files_processed"] += 1
                
            except Exception as e:
                error_msg = f"Error processing {csv_file.name}: {str(e)}"
                print(f"❌ {error_msg}")
                stats["errors"].append(error_msg)
        
        self._commit()
        return stats
    
    def _index_file(self, csv_path: Path) -> Dict[str, int]:
        """Index a single CSV file"""
        filename_lower = csv_path.name.lower()
        stats = {"hotels": 0, "flights": 0, "airports": 0, "routes": 0, "delays": 0}
        
        try:
            df = pd.read_csv(csv_path, low_memory=False, nrows=10000)  # Limit rows for performance
        except Exception as e:
            print(f"  ⚠️  Error reading {csv_path.name}: {e}")
            return stats
        
        # Detect dataset type by filename first
        if "airbnb" in filename_lower or "listings" in filename_lower:
            stats["hotels"] = self._index_airbnb_data(df, csv_path.name)
        elif "hotel" in filename_lower and "booking" in filename_lower:
            stats["hotels"] = self._index_hotel_booking_data(df, csv_path.name)
        elif "expedia" in filename_lower or "train.csv" in filename_lower:
            stats["hotels"] = self._index_expedia_hotel_data(df, csv_path.name)
        elif filename_lower in ["economy.csv", "business.csv", "clean_dataset.csv"]:
            # Flight Price Prediction dataset
            stats["flights"] = self._index_flight_price_data(df, csv_path.name)
        elif "flight" in filename_lower and "price" in filename_lower:
            stats["flights"] = self._index_flight_price_data(df, csv_path.name)
        elif "flightprices" in filename_lower or "flight_prices" in filename_lower:
            stats["flights"] = self._index_flightprices_data(df, csv_path.name)
        elif filename_lower in ["economy.csv", "business.csv"] or ("from" in filename_lower and "to" in filename_lower and "price" in filename_lower):
            # Flight Price Prediction dataset (economy/business classes)
            stats["flights"] = self._index_flight_price_data(df, csv_path.name)
        elif filename_lower == "flights.csv" or ("delay" in filename_lower and "ORIGIN_AIRPORT" in str(df.columns)):
            # US Flight Delays dataset
            stats["delays"] = self._index_flight_delays_data(df, csv_path.name)
        elif filename_lower == "airports.csv" or ("airport" in filename_lower and "IATA" in str(df.columns)):
            # Global Airports dataset
            stats["airports"] = self._index_global_airports_data(df, csv_path.name)
        elif filename_lower == "routes.csv" or ("route" in filename_lower and "Source Airport" in str(df.columns)):
            # Airlines Routes dataset
            stats["routes"] = self._index_routes_data(df, csv_path.name)
        else:
            # Try to auto-detect by column structure
            stats = self._auto_detect_and_index(df, csv_path.name)
        
        return stats
    
    def _index_airbnb_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Inside Airbnb dataset"""
        count = 0
        
        for _, row in df.iterrows():
            try:
                listing_id = str(row.get("id", ""))
                if not listing_id:
                    continue
                
                # Clean price
                price_str = str(row.get("price", "0"))
                price_str = price_str.replace("$", "").replace(",", "").strip()
                try:
                    price = float(price_str) if price_str else 0
                except:
                    price = 0
                
                if price <= 0:
                    continue
                
                city = str(row.get("neighbourhood_cleansed") or row.get("neighbourhood_group_cleansed") or "NYC")
                
                # Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL, INSERT OR REPLACE for SQLite
                if self.use_mysql:
                    query = """
                        INSERT INTO hotels 
                        (id, name, city, state, country, address, price_per_night, rating, amenities, room_type, latitude, longitude, source, raw_data)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                        name=VALUES(name), city=VALUES(city), price_per_night=VALUES(price_per_night), 
                        rating=VALUES(rating), raw_data=VALUES(raw_data)
                    """
                else:
                    query = """
                        INSERT OR REPLACE INTO hotels 
                        (id, name, city, state, country, address, price_per_night, rating, amenities, room_type, latitude, longitude, source, raw_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                
                self._execute(query, (
                    listing_id,
                    str(row.get("name", ""))[:200],
                    city,
                    "NY",
                    "USA",
                    str(row.get("street", ""))[:200],
                    price,
                    float(row.get("review_scores_rating", 0)) / 20 if pd.notna(row.get("review_scores_rating")) else None,
                    str(row.get("amenities", ""))[:500],
                    str(row.get("room_type", "")),
                    float(row.get("latitude", 0)) if pd.notna(row.get("latitude")) else None,
                    float(row.get("longitude", 0)) if pd.notna(row.get("longitude")) else None,
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception as e:
                continue
        
        return count
    
    def _index_hotel_booking_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Hotel Booking Demand dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                if pd.notna(row.get("is_canceled")) and bool(row.get("is_canceled")):
                    continue
                
                hotel_id = f"hotel_{row.get('hotel', 'unknown')}_{row.get('country', 'unknown')}_{count}"
                price = float(row.get("adr", 0)) if pd.notna(row.get("adr")) else 0
                
                if price <= 0:
                    continue
                
                cursor.execute("""
                    INSERT OR REPLACE INTO hotels 
                    (id, name, city, country, price_per_night, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    hotel_id,
                    str(row.get("hotel", "Unknown")),
                    str(row.get("city", "") or row.get("hotel", "")),
                    str(row.get("country", "")),
                    price,
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_expedia_hotel_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Expedia Hotel Recommendations dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                hotel_id = str(row.get("hotel_id", "") or row.get("prop_id", ""))
                if not hotel_id:
                    continue
                
                price = float(row.get("price_usd", 0) or row.get("price", 0))
                if price <= 0:
                    continue
                
                cursor.execute("""
                    INSERT OR REPLACE INTO hotels 
                    (id, name, city, country, price_per_night, rating, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    hotel_id,
                    f"Hotel {hotel_id}",
                    f"Destination {row.get('srch_destination_id', '')}",
                    str(row.get("prop_country_id", "")),
                    price,
                    float(row.get("prop_review_score", 0)) / 20 if pd.notna(row.get("prop_review_score")) else None,
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_flight_price_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Flight Price Prediction dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                # Handle price with commas (e.g., "5,953")
                price_str = str(row.get("price", "0")).replace(",", "").replace("$", "").strip()
                try:
                    price = float(price_str) if price_str else 0
                except (ValueError, TypeError):
                    price = 0
                
                if price <= 0:
                    continue
                
                # Handle different column name formats
                airline = str(row.get("airline", "") or row.get("Airline", "") or row.get("ch_code", "") or "Unknown")
                origin = str(row.get("source_city", "") or row.get("from", "") or row.get("origin", "") or row.get("Origin", "")).upper()
                destination = str(row.get("destination_city", "") or row.get("to", "") or row.get("destination", "") or row.get("Destination", "")).upper()
                
                if not origin or not destination:
                    continue
                
                flight_id = f"{airline}_{origin}_{destination}_{count}"
                
                # Parse stops (handle "non-stop" text)
                stops_str = str(row.get("stops", "") or row.get("stop", "") or "0")
                if "non-stop" in stops_str.lower() or stops_str.lower() == "0":
                    stops = 0
                else:
                    try:
                        stops = int(stops_str)
                    except:
                        stops = 0
                
                # Parse duration (handle "02h 10m" format)
                duration_str = str(row.get("duration", "") or row.get("time_taken", "") or "0")
                duration = 0
                if "h" in duration_str.lower():
                    import re
                    hours = re.search(r'(\d+)h', duration_str)
                    minutes = re.search(r'(\d+)m', duration_str)
                    if hours:
                        duration += float(hours.group(1))
                    if minutes:
                        duration += float(minutes.group(1)) / 60
                else:
                    try:
                        duration = float(duration_str)
                    except:
                        duration = 0
                
                cursor.execute("""
                    INSERT OR REPLACE INTO flights 
                    (id, airline, flight_number, origin, destination, origin_city, dest_city, price, departure_time, arrival_time, duration, stops, class, available_seats, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    flight_id,
                    airline,
                    str(row.get("flight", "") or row.get("num_code", "") or flight_id),
                    origin,
                    destination,
                    origin,
                    destination,
                    price,
                    str(row.get("dep_time", "") or row.get("departure_time", "")),
                    str(row.get("arrival_time", "") or row.get("arr_time", "")),
                    duration,
                    stops,
                    str(row.get("class", "") or source.split(".")[0].title() or "Economy"),
                    10,  # Default available seats
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_flightprices_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Flight Prices (Expedia) dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                price = float(row.get("price", 0) or row.get("Price", 0) or row.get("fare", 0))
                if price <= 0:
                    continue
                
                origin = str(row.get("origin", "") or row.get("Origin", "") or row.get("from", "")).upper()
                dest = str(row.get("destination", "") or row.get("Destination", "") or row.get("to", "")).upper()
                
                if not origin or not dest:
                    continue
                
                flight_id = f"{row.get('airline', '')}_{origin}_{dest}_{count}"
                
                cursor.execute("""
                    INSERT OR REPLACE INTO flights 
                    (id, airline, flight_number, origin, destination, origin_city, dest_city, price, departure_time, arrival_time, duration, stops, class, available_seats, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    flight_id,
                    str(row.get("airline", "") or row.get("Airline", "")),
                    str(row.get("flight_number", "") or row.get("Flight", "") or flight_id),
                    origin,
                    dest,
                    origin,
                    dest,
                    price,
                    str(row.get("departure_time", "") or row.get("dep_time", "")),
                    str(row.get("arrival_time", "") or row.get("arr_time", "")),
                    float(row.get("duration", 0)) if pd.notna(row.get("duration", 0)) else None,
                    int(row.get("stops", 0)) if pd.notna(row.get("stops", 0)) else 0,
                    str(row.get("class", "") or row.get("Class", "") or "Economy"),
                    10,
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_flight_delays_data(self, df: pd.DataFrame, source: str) -> int:
        """Index US Flight Delays & Cancellations dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                delay_id = f"{row.get('YEAR', '')}_{row.get('MONTH', '')}_{row.get('DAY_OF_MONTH', '')}_{row.get('AIRLINE', '')}_{row.get('FLIGHT_NUMBER', '')}"
                
                cursor.execute("""
                    INSERT OR REPLACE INTO flight_delays 
                    (id, year, month, day, airline, flight_number, origin_airport, dest_airport, departure_delay, arrival_delay, cancelled, diverted, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    delay_id,
                    int(row.get("YEAR", 0)) if pd.notna(row.get("YEAR")) else None,
                    int(row.get("MONTH", 0)) if pd.notna(row.get("MONTH")) else None,
                    int(row.get("DAY_OF_MONTH", 0)) if pd.notna(row.get("DAY_OF_MONTH")) else None,
                    str(row.get("AIRLINE", "")),
                    str(row.get("FLIGHT_NUMBER", "")),
                    str(row.get("ORIGIN", "")),
                    str(row.get("DEST", "")),
                    float(row.get("DEP_DELAY", 0)) if pd.notna(row.get("DEP_DELAY")) else None,
                    float(row.get("ARR_DELAY", 0)) if pd.notna(row.get("ARR_DELAY")) else None,
                    int(row.get("CANCELLED", 0)) if pd.notna(row.get("CANCELLED")) else 0,
                    int(row.get("DIVERTED", 0)) if pd.notna(row.get("DIVERTED")) else 0,
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_global_airports_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Global Airports dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                # Handle different column name formats
                code = str(row.get("IATA", "") or row.get("iata", "") or 
                          row.get("ICAO", "") or row.get("icao", "") or 
                          row.get("code", "") or row.get("Code", "")).upper()
                if not code or code == "NAN" or code == "NONE":
                    continue
                
                cursor.execute("""
                    INSERT OR REPLACE INTO airports 
                    (code, name, city, country, latitude, longitude, timezone, iata, icao, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    code,
                    str(row.get("Name", "") or row.get("name", "") or row.get("airport_name", "")),
                    str(row.get("City", "") or row.get("city", "") or row.get("municipality", "")),
                    str(row.get("Country", "") or row.get("country", "") or row.get("iso_country", "")),
                    float(row.get("Latitude", 0) or row.get("latitude", 0)) if pd.notna(row.get("Latitude", 0) or row.get("latitude", 0)) else None,
                    float(row.get("Longitude", 0) or row.get("longitude", 0)) if pd.notna(row.get("Longitude", 0) or row.get("longitude", 0)) else None,
                    str(row.get("Timezone", "") or row.get("timezone", "")),
                    str(row.get("IATA", "") or row.get("iata", "")).upper(),
                    str(row.get("ICAO", "") or row.get("icao", "")).upper(),
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _index_routes_data(self, df: pd.DataFrame, source: str) -> int:
        """Index Airlines, Airport and Routes dataset"""
        cursor = self.index_db.cursor()
        count = 0
        
        for _, row in df.iterrows():
            try:
                # Handle different column name formats
                origin = str(row.get("Source Airport", "") or row.get("source_airport", "") or 
                            row.get("from", "") or row.get("origin", "") or 
                            row.get("Source_Airport", "")).upper()
                dest = str(row.get("Destination Airport", "") or row.get("destination_airport", "") or 
                          row.get("to", "") or row.get("destination", "") or 
                          row.get("Destination_Airport", "")).upper()
                
                if not origin or not dest or origin == "NAN" or dest == "NAN":
                    continue
                
                route_id = f"{row.get('airline', '')}_{origin}_{dest}_{count}"
                
                cursor.execute("""
                    INSERT OR REPLACE INTO routes 
                    (id, airline, airline_id, origin_airport, dest_airport, origin_city, dest_city, stops, codeshare, equipment, source, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    route_id,
                    str(row.get("Airline", "") or row.get("airline", "") or row.get("airline_name", "")),
                    str(row.get("Airline ID", "") or row.get("airline_id", "") or row.get("Airline_ID", "")),
                    origin,
                    dest,
                    origin,
                    dest,
                    int(row.get("Stops", 0) or row.get("stops", 0)) if pd.notna(row.get("Stops", 0) or row.get("stops", 0)) else 0,
                    int(row.get("Codeshare", 0) or row.get("codeshare", 0)) if pd.notna(row.get("Codeshare", 0) or row.get("codeshare", 0)) else 0,
                    str(row.get("Equipment", "") or row.get("equipment", "") or row.get("aircraft", "")),
                    source,
                    json.dumps(row.to_dict())
                ))
                count += 1
            except Exception:
                continue
        
        return count
    
    def _auto_detect_and_index(self, df: pd.DataFrame, source: str) -> Dict[str, int]:
        """Auto-detect dataset type and index"""
        stats = {"hotels": 0, "flights": 0, "airports": 0, "routes": 0, "delays": 0}
        
        columns = [col.lower() for col in df.columns]
        columns_str = str(df.columns).upper()
        
        # Detect flight delays by specific columns
        if "ORIGIN_AIRPORT" in columns_str and "DESTINATION_AIRPORT" in columns_str and "AIRLINE" in columns_str:
            stats["delays"] = self._index_flight_delays_data(df, source)
            return stats
        
        # Detect airports by IATA/ICAO columns
        if "IATA" in columns_str or "ICAO" in columns_str:
            if any(col in columns for col in ["name", "city", "country"]):
                stats["airports"] = self._index_global_airports_data(df, source)
                return stats
        
        # Detect routes by route-specific columns
        if "SOURCE AIRPORT" in columns_str or "SOURCE_AIRPORT" in columns_str:
            if "DESTINATION AIRPORT" in columns_str or "DESTINATION_AIRPORT" in columns_str:
                stats["routes"] = self._index_routes_data(df, source)
                return stats
        
        # Detect by columns
        if any(col in columns for col in ["price", "adr", "price_per_night"]):
            if any(col in columns for col in ["hotel", "listing", "property"]):
                stats["hotels"] = self._index_hotel_booking_data(df, source)
            elif any(col in columns for col in ["airline", "flight", "origin", "destination"]):
                stats["flights"] = self._index_flight_price_data(df, source)
        
        return stats
    
    def close(self):
        """Close database connection"""
        if self.index_db:
            self.index_db.close()

