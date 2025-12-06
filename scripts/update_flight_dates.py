#!/usr/bin/env python3
"""Update flight dates to be spread across a wider date range"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pymysql
from datetime import datetime, timedelta
import random

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

def update_flight_dates():
    """Update flight dates to span from today to 6 months ahead"""
    print("=" * 60)
    print("🔄 UPDATING FLIGHT DATES")
    print("=" * 60)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get all flights
    cursor.execute("""
        SELECT flight_id, departure_datetime, arrival_datetime, duration_minutes
        FROM flights 
        WHERE status = 'scheduled'
        ORDER BY flight_id
    """)
    
    flights = cursor.fetchall()
    print(f"Found {len(flights)} flights to update")
    
    # Date range: from tomorrow to 6 months ahead
    today = datetime.now()
    start_date = today + timedelta(days=1)  # Tomorrow
    end_date = today + timedelta(days=180)  # 6 months ahead
    
    updated_count = 0
    
    for flight in flights:
        try:
            # Generate random date within range
            days_ahead = random.randint(1, 180)
            new_departure = start_date + timedelta(days=days_ahead)
            
            # Keep the same time of day (hour/minute) but update date
            old_departure = flight['departure_datetime']
            if isinstance(old_departure, str):
                old_departure = datetime.strptime(old_departure, '%Y-%m-%d %H:%M:%S')
            
            # Preserve time component
            new_departure = new_departure.replace(
                hour=old_departure.hour,
                minute=old_departure.minute,
                second=old_departure.second
            )
            
            # Calculate new arrival based on duration
            duration_minutes = flight['duration_minutes']
            new_arrival = new_departure + timedelta(minutes=duration_minutes)
            
            # Update flight
            cursor.execute("""
                UPDATE flights 
                SET departure_datetime = %s,
                    arrival_datetime = %s
                WHERE flight_id = %s
            """, (new_departure, new_arrival, flight['flight_id']))
            
            updated_count += 1
            
            if updated_count % 1000 == 0:
                conn.commit()
                print(f"   Updated {updated_count} flights...")
                
        except Exception as e:
            print(f"   Error updating flight {flight['flight_id']}: {e}")
            continue
    
    conn.commit()
    
    # Get date distribution
    cursor.execute("""
        SELECT 
            DATE(departure_datetime) as date,
            COUNT(*) as flights
        FROM flights 
        WHERE status = 'scheduled'
        GROUP BY DATE(departure_datetime)
        ORDER BY date ASC
        LIMIT 10
    """)
    
    earliest = cursor.fetchall()
    
    cursor.execute("""
        SELECT 
            MIN(departure_datetime) as earliest,
            MAX(departure_datetime) as latest,
            COUNT(*) as total
        FROM flights 
        WHERE status = 'scheduled'
    """)
    
    stats = cursor.fetchone()
    
    print("\n" + "=" * 60)
    print("✅ UPDATE COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   Flights updated: {updated_count}")
    print(f"   Earliest flight: {stats['earliest']}")
    print(f"   Latest flight: {stats['latest']}")
    print(f"   Total flights: {stats['total']}")
    print(f"\n📅 First 10 dates with flights:")
    for row in earliest:
        print(f"   {row['date']}: {row['flights']} flights")
    
    conn.close()

if __name__ == "__main__":
    update_flight_dates()

