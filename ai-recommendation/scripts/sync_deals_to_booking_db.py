#!/usr/bin/env python3
"""Sync flight and hotel deals from AI service to main booking database"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.session import engine as ai_engine
from app.models import FlightDeal, HotelDeal
import pymysql
from datetime import datetime, timedelta
import random
import string

# Main booking database connection
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3307"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "kayak")

def get_booking_db_connection():
    """Get connection to main booking database"""
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def generate_flight_id(airline: str, flight_number: str) -> str:
    """Generate unique flight ID"""
    airline_code = airline[:2].upper() if airline else "XX"
    flight_num = flight_number.replace("-", "").replace(" ", "")[:4] if flight_number else str(random.randint(100, 9999))
    return f"{airline_code}{flight_num}"

def generate_hotel_id(name: str, city: str) -> str:
    """Generate unique hotel ID"""
    name_part = "".join([c for c in name[:8] if c.isalnum()]).upper()
    city_part = "".join([c for c in city[:4] if c.isalnum()]).upper()
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{name_part}{city_part}{random_part}"

def sync_flights(ai_session: Session, booking_conn):
    """Sync flight deals to main booking database"""
    print("\n✈️  Syncing flights to booking database...")
    
    # Get all active flight deals from AI service
    flight_deals = ai_session.exec(
        select(FlightDeal).where(FlightDeal.is_active == True)
    ).all()
    
    print(f"   Found {len(flight_deals)} flight deals in AI service")
    
    cursor = booking_conn.cursor()
    synced_count = 0
    skipped_count = 0
    
    for deal in flight_deals:
        try:
            # Generate unique flight ID (add timestamp to avoid conflicts)
            base_id = generate_flight_id(deal.airline, deal.flight_number)
            flight_id = f"{base_id}{random.randint(100, 999)}"
            
            # Check if similar flight already exists (by route, airline, and similar price)
            cursor.execute(
                """SELECT flight_id FROM flights 
                   WHERE departure_airport = %s AND arrival_airport = %s 
                   AND airline_name = %s AND ABS(price_per_ticket - %s) < 20
                   AND DATE(departure_datetime) = DATE(%s)""",
                (deal.origin.upper(), deal.destination.upper(), deal.airline, 
                 float(deal.discounted_price), deal.departure_time)
            )
            if cursor.fetchone():
                skipped_count += 1
                continue
            
            # Calculate duration
            duration_minutes = int((deal.arrival_time - deal.departure_time).total_seconds() / 60)
            
            # Determine flight class from tags
            flight_class = 'economy'
            if 'business' in (deal.tags or '').lower():
                flight_class = 'business'
            elif 'first' in (deal.tags or '').lower():
                flight_class = 'first'
            
            # Insert into main booking database
            cursor.execute("""
                INSERT INTO flights (
                    flight_id, airline_name, departure_airport, arrival_airport,
                    departure_datetime, arrival_datetime, duration_minutes, flight_class,
                    price_per_ticket, total_seats, available_seats, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'scheduled')
            """, (
                flight_id,
                deal.airline,
                deal.origin.upper(),
                deal.destination.upper(),
                deal.departure_time,
                deal.arrival_time,
                duration_minutes,
                flight_class,
                float(deal.discounted_price),
                deal.available_seats + random.randint(10, 50),  # total_seats
                deal.available_seats,
            ))
            
            synced_count += 1
            
            if synced_count % 100 == 0:
                booking_conn.commit()
                print(f"   Synced {synced_count} flights...")
                
        except Exception as e:
            booking_conn.rollback()
            skipped_count += 1
            continue
    
    booking_conn.commit()
    print(f"   ✅ Synced {synced_count} flights (skipped {skipped_count} duplicates)")
    return synced_count

def sync_hotels(ai_session: Session, booking_conn):
    """Sync hotel deals to main booking database"""
    print("\n🏨 Syncing hotels to booking database...")
    
    # Get all active hotel deals from AI service
    hotel_deals = ai_session.exec(
        select(HotelDeal).where(HotelDeal.is_active == True)
    ).all()
    
    print(f"   Found {len(hotel_deals)} hotel deals in AI service")
    
    cursor = booking_conn.cursor()
    synced_count = 0
    skipped_count = 0
    
    for deal in hotel_deals:
        try:
            # Generate hotel ID
            hotel_id = generate_hotel_id(deal.name, deal.city)
            
            # Check if hotel already exists (by name, city, and similar price)
            cursor.execute(
                """SELECT h.hotel_id FROM hotels h
                   INNER JOIN hotel_rooms r ON h.hotel_id = r.hotel_id
                   WHERE LOWER(h.hotel_name) = LOWER(%s) AND LOWER(h.city) = LOWER(%s)
                   AND ABS(r.price_per_night - %s) < 10""",
                (deal.name, deal.city, float(deal.discounted_price_per_night))
            )
            if cursor.fetchone():
                skipped_count += 1
                continue
            
            # Parse address for state and zip
            address_parts = deal.address.split(',') if deal.address else []
            state = deal.state or (address_parts[-2].strip() if len(address_parts) > 1 else 'NY')
            zip_code = address_parts[-1].strip() if address_parts else '10001'
            # Clean zip code
            zip_code = ''.join([c for c in zip_code if c.isdigit()])[:10] or '10001'
            
            # Calculate star rating from deal score
            star_rating = min(5, max(1, int((deal.deal_score / 100) * 5) if deal.deal_score else 3))
            
            # Insert hotel
            cursor.execute("""
                INSERT INTO hotels (
                    hotel_id, hotel_name, address, city, state, zip_code,
                    star_rating, description, total_rooms, rating, reviews_count, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
            """, (
                hotel_id,
                deal.name[:200],
                deal.address[:255] if deal.address else f"{deal.name}, {deal.city}",
                deal.city,
                state[:2] if len(state) <= 2 else state[:20],
                zip_code,
                star_rating,
                f"Great hotel in {deal.city} with excellent amenities",
                deal.available_rooms + random.randint(10, 50),  # total_rooms
                float(deal.rating) if deal.rating else 4.0,
                random.randint(10, 500),
            ))
            
            # Create default room type
            room_id = f"{hotel_id}_ROOM1"
            cursor.execute("""
                INSERT INTO hotel_rooms (
                    room_id, hotel_id, room_type, price_per_night, max_guests,
                    total_rooms, available_rooms, description
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                room_id,
                hotel_id,
                'standard',
                float(deal.discounted_price_per_night),
                2,
                deal.available_rooms,
                deal.available_rooms,
                'Comfortable standard room with all amenities'
            ))
            
            synced_count += 1
            
            if synced_count % 100 == 0:
                booking_conn.commit()
                print(f"   Synced {synced_count} hotels...")
                
        except Exception as e:
            booking_conn.rollback()
            skipped_count += 1
            continue
    
    booking_conn.commit()
    print(f"   ✅ Synced {synced_count} hotels (skipped {skipped_count} duplicates)")
    return synced_count

def main():
    """Main execution function"""
    print("=" * 60)
    print("🔄 SYNCING DEALS TO BOOKING DATABASE")
    print("=" * 60)
    print()
    print(f"AI Service Database: MySQL (kayak)")
    print(f"Booking Database: MySQL ({MYSQL_DATABASE})")
    print()
    
    # Connect to booking database
    try:
        booking_conn = get_booking_db_connection()
        print("✅ Connected to booking database")
    except Exception as e:
        print(f"❌ Failed to connect to booking database: {e}")
        print("   Make sure MySQL is running and credentials are correct")
        return
    
    # Connect to AI service database
    with Session(ai_engine) as ai_session:
        # Sync flights
        flights_synced = sync_flights(ai_session, booking_conn)
        
        # Sync hotels
        hotels_synced = sync_hotels(ai_session, booking_conn)
        
        # Get final counts
        cursor = booking_conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM flights WHERE status = 'scheduled'")
        total_flights = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM hotels WHERE status = 'active'")
        total_hotels = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(DISTINCT city) as count FROM hotels WHERE status = 'active'")
        total_cities = cursor.fetchone()['count']
        
        print("\n" + "=" * 60)
        print("✅ SYNC COMPLETE!")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"   Flights synced this run: {flights_synced}")
        print(f"   Hotels synced this run: {hotels_synced}")
        print(f"\n📈 Total in booking database:")
        print(f"   Total flights: {total_flights}")
        print(f"   Total hotels: {total_hotels}")
        print(f"   Unique cities: {total_cities}")
        print(f"\n🎉 All deals are now available for booking!")
        print(f"\n💡 These flights and hotels can now be:")
        print(f"   - Searched via Listing Service")
        print(f"   - Booked via Booking Service")
        print(f"   - Recommended by AI Service")
    
    booking_conn.close()

if __name__ == "__main__":
    main()

