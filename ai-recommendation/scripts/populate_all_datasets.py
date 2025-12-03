"""Populate deals from all Kaggle datasets"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.session import engine
from app.models import FlightDeal, HotelDeal
from app.services.csv_query_service import CSVQueryService
from datetime import datetime, timedelta
import random
import pandas as pd
import os

def populate_from_csv_index():
    """Populate from indexed CSV data"""
    csv_service = CSVQueryService()
    
    with Session(engine) as session:
        print("📊 Populating from indexed CSV data...")
        
        # Get flights from CSV - increased limit and removed duplicate check
        flights = csv_service.search_flights(limit=500)
        print(f"Found {len(flights)} flights in CSV index")
        
        flight_count = 0
        for flight in flights:  # Process all flights, no limit
            try:
                if not flight.get('origin') or not flight.get('destination') or not flight.get('airline'):
                    continue
                
                # Removed duplicate check - import all flights
                
                price = float(flight.get('price', 500))
                dep_time = datetime.now() + timedelta(days=random.randint(1, 60))
                arr_time = dep_time + timedelta(hours=random.randint(2, 12))
                
                flight_deal = FlightDeal(
                    airline=flight.get('airline', 'Unknown'),
                    flight_number=flight.get('flight_number', '') or f"{flight.get('airline', 'XX')[:2]}{random.randint(100, 9999)}",
                    origin=flight.get('origin', ''),
                    destination=flight.get('destination', ''),
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    original_price=price * 1.2,
                    discounted_price=price,
                    discount_percentage=16.67,
                    deal_score=random.uniform(0.7, 1.0),
                    is_active=True,
                    tags=flight.get('class', 'economy'),
                    available_seats=random.randint(5, 50)
                )
                session.add(flight_deal)
                flight_count += 1
            except Exception as e:
                session.rollback()
                continue
        
        # Get hotels from CSV - increased limit and removed duplicate check
        hotels = csv_service.search_hotels(limit=500)
        print(f"Found {len(hotels)} hotels in CSV index")
        
        hotel_count = 0
        for hotel in hotels:  # Process all hotels, no limit
            try:
                if not hotel.get('city') or not hotel.get('name'):
                    continue
                
                # Removed duplicate check - import all hotels
                
                price = float(hotel.get('price', 100) or hotel.get('price_per_night', 100))
                address = hotel.get('address', '') or f"{hotel.get('name')}, {hotel.get('city')}"
                
                hotel_deal = HotelDeal(
                    name=hotel.get('name', 'Unknown Hotel'),
                    city=hotel.get('city', 'Unknown'),
                    country=hotel.get('country', 'Unknown'),
                    address=address,
                    original_price_per_night=price * 1.25,
                    discounted_price_per_night=price,
                    discount_percentage=20.0,
                    deal_score=random.uniform(0.7, 1.0),
                    is_active=True,
                    tags=hotel.get('tags', 'standard'),
                    available_rooms=random.randint(5, 20),
                    rating=float(hotel.get('rating', 4.0)) if hotel.get('rating') else 4.0
                )
                session.add(hotel_deal)
                hotel_count += 1
            except Exception as e:
                session.rollback()
                continue
        
        session.commit()
        print(f"✅ Created {flight_count} flights and {hotel_count} hotels from CSV index")

def populate_from_raw_csv():
    """Populate directly from raw CSV files"""
    data_dir = Path("./data/raw")
    
    with Session(engine) as session:
        print("\n📊 Populating from raw CSV files...")
        
        # Load flights from economy.csv and business.csv
        for csv_file in ["economy.csv", "business.csv", "Clean_Dataset.csv"]:
            csv_path = data_dir / csv_file
            if not csv_path.exists():
                continue
            
            try:
                print(f"  Processing {csv_file}...")
                df = pd.read_csv(csv_path, nrows=2000)  # Increased limit
                
                flight_count = 0
                for _, row in df.iterrows():
                    try:
                        origin = str(row.get("from", "") or row.get("origin", "") or "").upper()
                        dest = str(row.get("to", "") or row.get("destination", "") or "").upper()
                        airline = str(row.get("airline", "") or row.get("ch_code", "") or "Unknown")
                        
                        if not origin or not dest or len(origin) < 3 or len(dest) < 3:
                            continue
                        
                        # Removed duplicate check - import all flights
                        
                        # Parse price
                        price_str = str(row.get("price", "500")).replace(",", "").replace("$", "").strip()
                        try:
                            price = float(price_str) if price_str else 500
                        except:
                            price = 500
                        
                        if price <= 0 or price > 5000:
                            continue
                        
                        dep_time = datetime.now() + timedelta(days=random.randint(1, 60))
                        arr_time = dep_time + timedelta(hours=random.randint(2, 12))
                        
                        flight_deal = FlightDeal(
                            airline=airline,
                            flight_number=str(row.get("num_code", "") or f"{airline[:2]}{random.randint(100, 9999)}"),
                            origin=origin,
                            destination=dest,
                            departure_time=dep_time,
                            arrival_time=arr_time,
                            original_price=price * 1.2,
                            discounted_price=price,
                            discount_percentage=16.67,
                            deal_score=random.uniform(0.7, 1.0),
                            is_active=True,
                            tags=csv_file.split(".")[0].lower(),
                            available_seats=random.randint(5, 50)
                        )
                        session.add(flight_deal)
                        flight_count += 1
                        
                        # Removed per-file limit - process all rows
                        # Commit in batches for performance
                        if flight_count % 100 == 0:
                            session.commit()
                    except Exception as e:
                        continue
                
                session.commit()
                print(f"  ✅ Created {flight_count} flights from {csv_file}")
            except Exception as e:
                print(f"  ⚠️  Error processing {csv_file}: {e}")
                session.rollback()
        
        # Add Tokyo hotels (since CSV might not have them)
        tokyo_hotels = [
            {"name": "Tokyo City Center Hotel", "city": "Tokyo", "country": "Japan", "price": 120},
            {"name": "Shibuya Grand Hotel", "city": "Tokyo", "country": "Japan", "price": 150},
            {"name": "Ginza Business Hotel", "city": "Tokyo", "country": "Japan", "price": 180},
        ]
        
        hotel_count = 0
        for hotel_data in tokyo_hotels:
            # Removed duplicate check - import all hotels
            hotel = HotelDeal(
                name=hotel_data["name"],
                city=hotel_data["city"],
                country=hotel_data["country"],
                address=f"{hotel_data['name']}, {hotel_data['city']}",
                original_price_per_night=hotel_data["price"] * 1.25,
                discounted_price_per_night=hotel_data["price"],
                discount_percentage=20.0,
                deal_score=random.uniform(0.8, 1.0),
                is_active=True,
                tags="pet-friendly,near-transit",
                available_rooms=random.randint(10, 25),
                rating=random.uniform(4.0, 5.0)
            )
            session.add(hotel)
            hotel_count += 1
        
        session.commit()
        if hotel_count > 0:
            print(f"  ✅ Added {hotel_count} Tokyo hotels")

if __name__ == "__main__":
    print("🚀 Populating deals from all Kaggle datasets...\n")
    populate_from_csv_index()
    populate_from_raw_csv()
    
    with Session(engine) as session:
        flight_total = len(list(session.exec(select(FlightDeal).where(FlightDeal.is_active == True)).all()))
        hotel_total = len(list(session.exec(select(HotelDeal).where(HotelDeal.is_active == True)).all()))
        cities = len(set(h.city for h in session.exec(select(HotelDeal).where(HotelDeal.is_active == True)).all()))
        
        print(f"\n✅ Final Summary:")
        print(f"   Flights: {flight_total}")
        print(f"   Hotels: {hotel_total}")
        print(f"   Cities: {cities}")
        print(f"\n🎉 All datasets populated!")

