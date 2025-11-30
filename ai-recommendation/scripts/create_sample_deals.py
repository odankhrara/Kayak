#!/usr/bin/env python3
"""
Create sample deals for testing when no data is available

This script creates sample flight and hotel deals so the system
can respond to user queries even before real data is processed.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import get_session, create_db_and_tables
from app.models import FlightDeal, HotelDeal
from datetime import datetime, timedelta
from sqlmodel import select


def create_sample_deals():
    """Create sample flight and hotel deals"""
    create_db_and_tables()
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        # Check if deals already exist
        flight_count = len(list(session.exec(select(FlightDeal)).all()))
        hotel_count = len(list(session.exec(select(HotelDeal)).all()))
        
        if flight_count > 0 and hotel_count > 0:
            print(f"✅ Deals already exist: {flight_count} flights, {hotel_count} hotels")
            return
        
        print("Creating sample deals...")
        
        # Sample Flight Deals
        sample_flights = [
            {
                "airline": "Delta",
                "flight_number": "DL123",
                "origin": "SFO",
                "destination": "JFK",
                "departure_time": datetime.now() + timedelta(days=30),
                "arrival_time": datetime.now() + timedelta(days=30, hours=5),
                "original_price": 450.0,
                "discounted_price": 380.0,
                "discount_percentage": 15.6,
                "deal_score": 72,
                "tags": "refundable,direct",
                "available_seats": 8
            },
            {
                "airline": "United",
                "flight_number": "UA456",
                "origin": "SFO",
                "destination": "MIA",
                "departure_time": datetime.now() + timedelta(days=25),
                "arrival_time": datetime.now() + timedelta(days=25, hours=6),
                "original_price": 520.0,
                "discounted_price": 420.0,
                "discount_percentage": 19.2,
                "deal_score": 78,
                "tags": "refundable,non-stop",
                "available_seats": 12
            },
            {
                "airline": "American",
                "flight_number": "AA789",
                "origin": "SFO",
                "destination": "LAX",
                "departure_time": datetime.now() + timedelta(days=20),
                "arrival_time": datetime.now() + timedelta(days=20, hours=1.5),
                "original_price": 280.0,
                "discounted_price": 220.0,
                "discount_percentage": 21.4,
                "deal_score": 85,
                "tags": "refundable,direct",
                "available_seats": 15
            },
            {
                "airline": "JetBlue",
                "flight_number": "B6123",
                "origin": "SFO",
                "destination": "MIA",
                "departure_time": datetime.now() + timedelta(days=27),
                "arrival_time": datetime.now() + timedelta(days=27, hours=5.5),
                "original_price": 480.0,
                "discounted_price": 390.0,
                "discount_percentage": 18.8,
                "deal_score": 75,
                "tags": "refundable",
                "available_seats": 10
            },
            {
                "airline": "Alaska",
                "flight_number": "AS234",
                "origin": "SFO",
                "destination": "SEA",
                "departure_time": datetime.now() + timedelta(days=22),
                "arrival_time": datetime.now() + timedelta(days=22, hours=2),
                "original_price": 320.0,
                "discounted_price": 250.0,
                "discount_percentage": 21.9,
                "deal_score": 82,
                "tags": "refundable,direct",
                "available_seats": 18
            }
        ]
        
        # Sample Hotel Deals
        sample_hotels = [
            {
                "name": "Miami Beach Hotel",
                "city": "Miami",
                "state": "FL",
                "country": "USA",
                "address": "123 Ocean Drive, Miami Beach",
                "original_price_per_night": 180.0,
                "discounted_price_per_night": 145.0,
                "discount_percentage": 19.4,
                "deal_score": 76,
                "tags": "pet-friendly,beachfront,refundable",
                "available_rooms": 5,
                "rating": 4.5
            },
            {
                "name": "Manhattan Downtown Hotel",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "address": "456 Broadway, Manhattan",
                "original_price_per_night": 220.0,
                "discounted_price_per_night": 175.0,
                "discount_percentage": 20.5,
                "deal_score": 80,
                "tags": "downtown,near-transit,refundable",
                "available_rooms": 8,
                "rating": 4.3
            },
            {
                "name": "Tokyo City Center Hotel",
                "city": "Tokyo",
                "state": None,
                "country": "Japan",
                "address": "789 Shibuya Street, Tokyo",
                "original_price_per_night": 150.0,
                "discounted_price_per_night": 120.0,
                "discount_percentage": 20.0,
                "deal_score": 78,
                "tags": "city-center,near-transit,breakfast",
                "available_rooms": 6,
                "rating": 4.4
            },
            {
                "name": "Los Angeles Beach Resort",
                "city": "Los Angeles",
                "state": "CA",
                "country": "USA",
                "address": "321 Pacific Coast Highway, LA",
                "original_price_per_night": 200.0,
                "discounted_price_per_night": 160.0,
                "discount_percentage": 20.0,
                "deal_score": 77,
                "tags": "beachfront,pet-friendly,refundable",
                "available_rooms": 7,
                "rating": 4.6
            },
            {
                "name": "San Diego Downtown Inn",
                "city": "San Diego",
                "state": "CA",
                "country": "USA",
                "address": "654 Harbor Drive, San Diego",
                "original_price_per_night": 170.0,
                "discounted_price_per_night": 135.0,
                "discount_percentage": 20.6,
                "deal_score": 79,
                "tags": "downtown,near-transit,pet-friendly",
                "available_rooms": 9,
                "rating": 4.2
            },
            {
                "name": "Miami Airport Hotel",
                "city": "Miami",
                "state": "FL",
                "country": "USA",
                "address": "987 Airport Boulevard, Miami",
                "original_price_per_night": 140.0,
                "discounted_price_per_night": 110.0,
                "discount_percentage": 21.4,
                "deal_score": 81,
                "tags": "airport,refundable,breakfast",
                "available_rooms": 12,
                "rating": 4.1
            }
        ]
        
        # Create flight deals
        for flight_data in sample_flights:
            # Check if exists
            existing = session.exec(
                select(FlightDeal).where(
                    FlightDeal.airline == flight_data["airline"],
                    FlightDeal.flight_number == flight_data["flight_number"]
                )
            ).first()
            
            if not existing:
                flight = FlightDeal(**flight_data)
                session.add(flight)
                print(f"  Created flight: {flight_data['airline']} {flight_data['flight_number']}")
        
        # Create hotel deals
        for hotel_data in sample_hotels:
            # Check if exists
            existing = session.exec(
                select(HotelDeal).where(
                    HotelDeal.name == hotel_data["name"],
                    HotelDeal.city == hotel_data["city"]
                )
            ).first()
            
            if not existing:
                hotel = HotelDeal(**hotel_data)
                session.add(hotel)
                print(f"  Created hotel: {hotel_data['name']} in {hotel_data['city']}")
        
        session.commit()
        
        # Verify
        flight_count = len(list(session.exec(select(FlightDeal)).all()))
        hotel_count = len(list(session.exec(select(HotelDeal)).all()))
        
        print(f"\n✅ Created sample deals: {flight_count} flights, {hotel_count} hotels")
        print("   The chat should now be able to create bundles!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error creating sample deals: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    create_sample_deals()

