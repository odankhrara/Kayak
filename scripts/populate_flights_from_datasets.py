#!/usr/bin/env python3
"""
Populate flights database directly from airlines.csv, airports.csv, and flights.csv
This script reads the real CSV datasets and creates flight records in the MySQL database.
"""

import sys
import os
from pathlib import Path
import mysql.connector
from mysql.connector import Error
import pandas as pd
import random
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Database configuration
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3307)),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'password'),
    'database': os.getenv('MYSQL_DATABASE', 'kayak')
}

def generate_flight_id(airline_name, flight_num):
    """Generate a unique flight ID"""
    airline_code = airline_name[:3].upper() if airline_name else 'UNK'
    return f"{airline_code}{flight_num:04d}"

def populate_flights_from_datasets():
    """Populate flights table from airlines.csv, airports.csv, and flights.csv"""
    try:
        # Paths to CSV files
        data_dir = Path(__file__).parent.parent / "ai-recommendation" / "data" / "raw"
        airlines_csv = data_dir / "airlines.csv"
        airports_csv = data_dir / "airports.csv"
        flights_csv = data_dir / "flights.csv"
        
        print("🚀 Populating flights from real CSV datasets...")
        print(f"📂 Data directory: {data_dir}")
        
        # Load airlines data
        airlines_data = {}
        if airlines_csv.exists():
            print(f"📊 Loading {airlines_csv.name}...")
            try:
                df_airlines = pd.read_csv(airlines_csv)
                print(f"   Loaded {len(df_airlines)} airlines")
                
                # Map airline IATA codes to names
                for _, row in df_airlines.iterrows():
                    iata = str(row.get('IATA', '') or '').strip()
                    name = str(row.get('Name', '') or '').strip()
                    if iata and iata != '-' and iata != 'nan' and len(iata) <= 3:
                        airlines_data[iata.upper()] = name if name and name != 'nan' else iata
                    if name and name != 'nan':
                        airlines_data[name.upper()] = name
                
                print(f"   ✅ Mapped {len(airlines_data)} airline codes/names")
            except Exception as e:
                print(f"   ⚠️  Error loading airlines.csv: {e}")
        
        # Load airports data for validation
        airports_set = set()
        if airports_csv.exists():
            print(f"📊 Loading {airports_csv.name}...")
            try:
                df_airports = pd.read_csv(airports_csv, nrows=10000)
                print(f"   Loaded {len(df_airports)} airports")
                
                # Extract valid IATA codes
                for _, row in df_airports.iterrows():
                    iata = str(row.get('IATA', '') or '').strip()
                    if iata and iata != 'nan' and len(iata) == 3:
                        airports_set.add(iata.upper())
                
                print(f"   ✅ Found {len(airports_set)} valid airport codes")
            except Exception as e:
                print(f"   ⚠️  Error loading airports.csv: {e}")
        
        # Load flights data from flights.csv
        flights_list = []
        if flights_csv.exists():
            print(f"📊 Loading {flights_csv.name}...")
            try:
                # Read flights.csv - US Flight Delays dataset
                # Read 100K rows for good coverage
                df_flights = pd.read_csv(flights_csv, nrows=100000)
                print(f"   Loaded {len(df_flights)} flight records")
                
                # Convert to standardized format
                valid_flights = 0
                for _, row in df_flights.iterrows():
                    try:
                        # Extract origin and destination airports
                        origin = str(row.get('ORIGIN_AIRPORT', '') or '').strip().upper()
                        destination = str(row.get('DESTINATION_AIRPORT', '') or '').strip().upper()
                        
                        # Skip if missing or invalid airport codes
                        if not origin or not destination or len(origin) != 3 or len(destination) != 3:
                            continue
                        
                        # Validate against airports.csv if available
                        if airports_set and (origin not in airports_set or destination not in airports_set):
                            continue  # Skip invalid airports
                        
                        # Extract airline code
                        airline_code = str(row.get('AIRLINE', '') or '').strip().upper()
                        
                        # Map airline code to name
                        airline_name = airlines_data.get(airline_code, airline_code) if airline_code else 'Unknown'
                        
                        # Extract flight number
                        flight_num_raw = row.get('FLIGHT_NUMBER', '')
                        
                        # Extract scheduled departure time (format: HHMM, e.g., 1430)
                        scheduled_dep = row.get('SCHEDULED_DEPARTURE', '')
                        
                        # Extract duration (in minutes)
                        duration_minutes = None
                        if pd.notna(row.get('SCHEDULED_TIME')):
                            try:
                                duration_minutes = int(row.get('SCHEDULED_TIME'))
                            except:
                                pass
                        
                        # Extract year, month, day
                        year = int(row.get('YEAR', 0)) if pd.notna(row.get('YEAR')) else None
                        month = int(row.get('MONTH', 0)) if pd.notna(row.get('MONTH')) else None
                        day = int(row.get('DAY', 0)) if pd.notna(row.get('DAY')) else None
                        
                        # Create flight dict
                        flight_dict = {
                            'origin': origin,
                            'destination': destination,
                            'airline': airline_name,
                            'airline_code': airline_code,
                            'flight_number': str(flight_num_raw) if pd.notna(flight_num_raw) else None,
                            'scheduled_departure': str(scheduled_dep) if pd.notna(scheduled_dep) else None,
                            'duration_minutes': duration_minutes,
                            'year': year,
                            'month': month,
                            'day': day,
                        }
                        
                        flights_list.append(flight_dict)
                        valid_flights += 1
                    except Exception as e:
                        continue  # Skip problematic rows
                
                print(f"   ✅ Processed {valid_flights} valid flights from CSV")
                
                # Show sample routes
                if flights_list:
                    sample_routes = {}
                    for f in flights_list[:1000]:
                        route = f"{f['origin']}→{f['destination']}"
                        sample_routes[route] = sample_routes.get(route, 0) + 1
                    print(f"   📋 Sample routes: {dict(list(sorted(sample_routes.items(), key=lambda x: x[1], reverse=True))[:10])}")
                    
            except Exception as e:
                print(f"   ⚠️  Error reading flights.csv: {e}")
                import traceback
                traceback.print_exc()
        
        if not flights_list:
            print("❌ No flights found in CSV files!")
            return 0
        
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Clear existing flights (optional - comment out if you want to keep existing)
        # cursor.execute("DELETE FROM flights WHERE status = 'scheduled'")
        # conn.commit()
        # print("🗑️  Cleared existing flights")
        
        count = 0
        flight_num = 1
        added_routes = set()
        
        # Popular routes to create in both directions
        popular_routes = [
            ('BOM', 'DEL'), ('DEL', 'BOM'),
            ('BOM', 'BLR'), ('BLR', 'BOM'),
            ('DEL', 'BLR'), ('BLR', 'DEL'),
            ('BOM', 'MAA'), ('MAA', 'BOM'),
            ('JFK', 'LAX'), ('LAX', 'JFK'),
            ('JFK', 'SFO'), ('SFO', 'JFK'),
            ('LAX', 'SFO'), ('SFO', 'LAX'),
        ]
        
        print(f"\n✈️  Processing {len(flights_list)} flights...")
        
        for flight_data in flights_list:
            try:
                origin = flight_data['origin']
                destination = flight_data['destination']
                airline = flight_data['airline']
                
                if not origin or not destination or not airline:
                    continue
                
                # Create flights in both directions for popular routes
                routes_to_add = [(origin, destination)]
                if (origin, destination) in popular_routes or (destination, origin) in popular_routes:
                    if (destination, origin) not in added_routes:
                        routes_to_add.append((destination, origin))
                
                for route_origin, route_dest in routes_to_add:
                    route_key = f"{route_origin}-{route_dest}"
                    if route_key in added_routes:
                        continue
                    
                    # Check if route already exists
                    cursor.execute("""
                        SELECT flight_id FROM flights 
                        WHERE departure_airport = %s AND arrival_airport = %s 
                        LIMIT 1
                    """, (route_origin, route_dest))
                    if cursor.fetchone():
                        added_routes.add(route_key)
                        continue
                    
                    # Generate price (flights.csv doesn't have prices)
                    price = random.uniform(200, 2000)
                    
                    # Get duration from CSV or estimate
                    duration_minutes = flight_data.get('duration_minutes')
                    if not duration_minutes or duration_minutes <= 0:
                        # Estimate based on route
                        if route_origin in ['BOM', 'DEL'] and route_dest in ['BOM', 'DEL']:
                            duration_minutes = 120  # 2 hours
                        elif route_origin in ['JFK', 'LAX'] and route_dest in ['JFK', 'LAX']:
                            duration_minutes = 360  # 6 hours
                        else:
                            duration_minutes = random.randint(90, 300)
                    
                    # Create flights for next 60 days
                    flights_per_route = 3 if (route_origin, route_dest) in popular_routes else 1
                    for day_offset in range(0, 60, 1):
                        for flight_instance in range(flights_per_route):
                            # Use scheduled departure time from CSV if available
                            scheduled_dep = flight_data.get('scheduled_departure')
                            
                            # Calculate departure time
                            dep_time = datetime.now() + timedelta(days=day_offset + random.randint(0, 2))
                            
                            if scheduled_dep and str(scheduled_dep).isdigit() and len(str(scheduled_dep)) >= 3:
                                try:
                                    # Format: HHMM (e.g., 1430 = 2:30 PM)
                                    dep_str = str(int(scheduled_dep)).zfill(4)
                                    hour = int(dep_str[:2]) % 24
                                    minute = int(dep_str[2:4]) % 60
                                    dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                                except:
                                    hour = random.randint(6, 22)
                                    minute = random.choice([0, 15, 30, 45])
                                    dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            else:
                                hour = random.randint(6, 22)
                                minute = random.choice([0, 15, 30, 45])
                                dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            
                            # Calculate arrival time
                            arr_time = dep_time + timedelta(minutes=duration_minutes)
                            
                            # Generate unique flight ID
                            unique_flight_id = f"{generate_flight_id(airline, flight_num)}{day_offset:02d}{flight_instance}"
                            flight_num += 1
                            
                            # Determine flight class
                            flight_class = 'economy'
                            if random.random() < 0.1:  # 10% business
                                flight_class = 'business'
                            elif random.random() < 0.02:  # 2% first
                                flight_class = 'first'
                            
                            total_seats = random.randint(100, 300)
                            available_seats = random.randint(10, total_seats)
                            
                            # Insert flight
                            cursor.execute("""
                                INSERT INTO flights (
                                    flight_id, airline_name, departure_airport, arrival_airport,
                                    departure_datetime, arrival_datetime, duration_minutes,
                                    flight_class, price_per_ticket, total_seats, available_seats,
                                    rating, reviews_count, status
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                unique_flight_id, airline, route_origin, route_dest, dep_time, arr_time,
                                duration_minutes, flight_class, price, total_seats, available_seats,
                                round(random.uniform(3.5, 5.0), 2), random.randint(10, 500),
                                'scheduled'
                            ))
                            count += 1
                            
                            if count % 100 == 0:
                                conn.commit()
                                print(f"  ✅ Processed {count} flights...")
                    
                    added_routes.add(route_key)
                    
            except Exception as e:
                print(f"Error inserting flight: {e}")
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\n✅ Inserted {count} flights into booking database")
        return count
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 0

if __name__ == "__main__":
    populate_flights_from_datasets()

