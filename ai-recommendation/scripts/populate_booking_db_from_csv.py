#!/usr/bin/env python3
"""Directly populate booking database from CSV files"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pymysql
import pandas as pd
from datetime import datetime, timedelta
import random
import string

# Database connection
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3307"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "kayak")

def get_connection():
    """Get MySQL connection"""
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def generate_flight_id(airline: str, flight_num: str = None) -> str:
    """Generate unique flight ID"""
    airline_code = (airline[:2] if airline else "XX").upper()
    if flight_num:
        num_part = ''.join([c for c in flight_num if c.isdigit()])[:4] or str(random.randint(100, 9999))
    else:
        num_part = str(random.randint(100, 9999))
    return f"{airline_code}{num_part}"

def generate_hotel_id(name: str, city: str) -> str:
    """Generate unique hotel ID"""
    name_part = ''.join([c for c in name[:6] if c.isalnum()]).upper()
    city_part = ''.join([c for c in city[:3] if c.isalnum()]).upper()
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{name_part}{city_part}{random_part}"

def populate_flights_from_csv(conn, data_dir: Path):
    """Populate flights directly from CSV files"""
    print("\n✈️  Populating flights from CSV files...")
    
    cursor = conn.cursor()
    flight_count = 0
    skipped = 0
    
    flight_files = ["economy.csv", "business.csv", "Clean_Dataset.csv"]
    
    for csv_file in flight_files:
        csv_path = data_dir / csv_file
        if not csv_path.exists():
            continue
        
        try:
            print(f"   Processing {csv_file}...")
            df = pd.read_csv(csv_path, nrows=5000, low_memory=False)
            
            file_count = 0
            for _, row in df.iterrows():
                try:
                    origin = str(row.get("from", "") or row.get("origin", "") or row.get("source_city", "")).upper().strip()
                    dest = str(row.get("to", "") or row.get("destination", "") or row.get("destination_city", "")).upper().strip()
                    airline = str(row.get("airline", "") or row.get("ch_code", "") or "Unknown").strip()
                    
                    if not origin or not dest or len(origin) < 2 or len(dest) < 2:
                        skipped += 1
                        continue
                    
                    # Parse price
                    price_str = str(row.get("price", "500")).replace(",", "").replace("$", "").strip()
                    try:
                        price = float(price_str) if price_str else 500
                    except:
                        price = 500
                    
                    if price <= 0 or price > 5000:
                        skipped += 1
                        continue
                    
                    # Generate flight ID
                    flight_id = generate_flight_id(airline, str(row.get("num_code", "") or row.get("flight_number", "")))
                    
                    # Check for duplicates
                    cursor.execute(
                        """SELECT flight_id FROM flights 
                           WHERE departure_airport = %s AND arrival_airport = %s 
                           AND airline_name = %s AND ABS(price_per_ticket - %s) < 20""",
                        (origin, dest, airline, price)
                    )
                    if cursor.fetchone():
                        skipped += 1
                        continue
                    
                    # Generate dates
                    dep_time = datetime.now() + timedelta(days=random.randint(1, 90))
                    arr_time = dep_time + timedelta(hours=random.randint(2, 15))
                    duration = int((arr_time - dep_time).total_seconds() / 60)
                    
                    # Determine class
                    flight_class = 'economy'
                    if 'business' in csv_file.lower():
                        flight_class = 'business'
                    
                    # Insert flight
                    cursor.execute("""
                        INSERT INTO flights (
                            flight_id, airline_name, departure_airport, arrival_airport,
                            departure_datetime, arrival_datetime, duration_minutes, flight_class,
                            price_per_ticket, total_seats, available_seats, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'scheduled')
                    """, (
                        flight_id,
                        airline,
                        origin,
                        dest,
                        dep_time,
                        arr_time,
                        duration,
                        flight_class,
                        price,
                        random.randint(50, 200),  # total_seats
                        random.randint(5, 50),     # available_seats
                    ))
                    
                    file_count += 1
                    flight_count += 1
                    
                    if file_count % 100 == 0:
                        conn.commit()
                        print(f"      Added {file_count} flights from {csv_file}...")
                        
                except Exception as e:
                    skipped += 1
                    continue
            
            conn.commit()
            print(f"   ✅ Added {file_count} flights from {csv_file}")
        except Exception as e:
            print(f"   ⚠️  Error processing {csv_file}: {e}")
            conn.rollback()
    
    print(f"   ✅ Total: {flight_count} flights added, {skipped} skipped")
    return flight_count

def populate_hotels_from_csv(conn, data_dir: Path):
    """Populate hotels directly from CSV files"""
    print("\n🏨 Populating hotels from CSV files...")
    
    cursor = conn.cursor()
    hotel_count = 0
    skipped = 0
    
    hotel_files = ["hotel_booking.csv", "listings.csv", "listings 2.csv"]
    
    for csv_file in hotel_files:
        csv_path = data_dir / csv_file
        if not csv_path.exists():
            continue
        
        try:
            print(f"   Processing {csv_file}...")
            df = pd.read_csv(csv_path, nrows=5000, low_memory=False)
            
            file_count = 0
            for _, row in df.iterrows():
                try:
                    # Skip cancelled bookings
                    if pd.notna(row.get("is_canceled")) and bool(row.get("is_canceled")):
                        skipped += 1
                        continue
                    
                    name = str(row.get("name", "") or row.get("hotel", "") or f"Hotel {row.get('id', '')}").strip()
                    city = str(row.get("city", "") or row.get("neighbourhood_cleansed", "") or row.get("neighbourhood_group_cleansed", "")).strip()
                    
                    if not name or not city:
                        skipped += 1
                        continue
                    
                    # Parse price
                    price = 0
                    if pd.notna(row.get("adr")):
                        price = float(row.get("adr"))
                    elif pd.notna(row.get("price")):
                        price_str = str(row.get("price")).replace("$", "").replace(",", "").strip()
                        try:
                            price = float(price_str)
                        except:
                            price = 0
                    
                    if price <= 0 or price > 1000:
                        skipped += 1
                        continue
                    
                    # Generate hotel ID
                    hotel_id = generate_hotel_id(name, city)
                    
                    # Check for duplicates
                    cursor.execute(
                        """SELECT h.hotel_id FROM hotels h
                           INNER JOIN hotel_rooms r ON h.hotel_id = r.hotel_id
                           WHERE LOWER(h.hotel_name) = LOWER(%s) AND LOWER(h.city) = LOWER(%s)
                           AND ABS(r.price_per_night - %s) < 10""",
                        (name, city, price)
                    )
                    if cursor.fetchone():
                        skipped += 1
                        continue
                    
                    # Parse address
                    address = str(row.get("address", "") or row.get("street", "") or f"{name}, {city}")[:255]
                    state = str(row.get("state", "") or "NY")[:2] if pd.notna(row.get("state")) else "NY"
                    zip_code = str(row.get("zipcode", "") or row.get("zip_code", "") or "10001")[:10]
                    zip_code = ''.join([c for c in zip_code if c.isdigit()])[:10] or '10001'
                    country = str(row.get("country", "") or "USA")
                    
                    # Calculate star rating
                    rating_val = float(row.get("review_scores_rating", 80)) / 20 if pd.notna(row.get("review_scores_rating")) else 4.0
                    star_rating = min(5, max(1, int(rating_val)))
                    
                    # Insert hotel
                    cursor.execute("""
                        INSERT INTO hotels (
                            hotel_id, hotel_name, address, city, state, zip_code,
                            star_rating, description, total_rooms, rating, reviews_count, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                    """, (
                        hotel_id,
                        name[:200],
                        address,
                        city,
                        state,
                        zip_code,
                        star_rating,
                        f"Great hotel in {city} with excellent amenities",
                        random.randint(20, 100),  # total_rooms
                        rating_val,
                        random.randint(10, 500),
                    ))
                    
                    # Create default room
                    room_id = f"{hotel_id}_ROOM1"
                    available_rooms = random.randint(5, 30)
                    cursor.execute("""
                        INSERT INTO hotel_rooms (
                            room_id, hotel_id, room_type, price_per_night, max_guests,
                            total_rooms, available_rooms, description
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        room_id,
                        hotel_id,
                        'standard',
                        price,
                        2,
                        available_rooms,
                        available_rooms,
                        'Comfortable standard room with all amenities'
                    ))
                    
                    file_count += 1
                    hotel_count += 1
                    
                    if file_count % 100 == 0:
                        conn.commit()
                        print(f"      Added {file_count} hotels from {csv_file}...")
                        
                except Exception as e:
                    skipped += 1
                    continue
            
            conn.commit()
            print(f"   ✅ Added {file_count} hotels from {csv_file}")
        except Exception as e:
            print(f"   ⚠️  Error processing {csv_file}: {e}")
            conn.rollback()
    
    print(f"   ✅ Total: {hotel_count} hotels added, {skipped} skipped")
    return hotel_count

def main():
    """Main execution"""
    print("=" * 60)
    print("🚀 POPULATING BOOKING DATABASE FROM CSV FILES")
    print("=" * 60)
    print()
    
    data_dir = Path("./data/raw")
    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return
    
    # Connect to database
    try:
        conn = get_connection()
        print("✅ Connected to booking database")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return
    
    # Populate flights
    flights_added = populate_flights_from_csv(conn, data_dir)
    
    # Populate hotels
    hotels_added = populate_hotels_from_csv(conn, data_dir)
    
    # Get final counts
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM flights WHERE status = 'scheduled'")
    total_flights = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM hotels WHERE status = 'active'")
    total_hotels = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(DISTINCT city) as count FROM hotels WHERE status = 'active'")
    total_cities = cursor.fetchone()['count']
    
    print("\n" + "=" * 60)
    print("✅ POPULATION COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   Flights added this run: {flights_added}")
    print(f"   Hotels added this run: {hotels_added}")
    print(f"\n📈 Total in booking database:")
    print(f"   Total flights: {total_flights}")
    print(f"   Total hotels: {total_hotels}")
    print(f"   Unique cities: {total_cities}")
    print(f"\n🎉 All deals are now available for booking!")
    
    conn.close()

if __name__ == "__main__":
    main()

