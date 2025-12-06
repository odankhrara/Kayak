#!/usr/bin/env python3
"""Comprehensive script to index CSV data and populate all flight and hotel deals"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select, func
from app.db.session import engine, create_db_and_tables
from app.models import FlightDeal, HotelDeal
from app.services.csv_data_indexer import CSVDataIndexer
from app.services.csv_query_service import CSVQueryService
from datetime import datetime, timedelta
import random
import pandas as pd

def index_csv_data():
    """Step 1: Index all CSV files"""
    print("=" * 60)
    print("STEP 1: Indexing CSV Data")
    print("=" * 60)
    
    data_dir = os.getenv("DATASETS_DIR", "./data/raw")
    index_db = os.getenv("CSV_INDEX_DB", "./csv_index.db")
    
    print(f"Data directory: {data_dir}")
    print(f"Index database: {index_db}")
    print()
    
    indexer = CSVDataIndexer(data_dir=data_dir, index_db_path=index_db)
    stats = indexer.index_all_datasets()
    
    print()
    print("✅ Indexing complete!")
    print(f"   Files processed: {stats['files_processed']}")
    print(f"   Hotels indexed: {stats['hotels_indexed']}")
    print(f"   Flights indexed: {stats['flights_indexed']}")
    print(f"   Airports indexed: {stats['airports_indexed']}")
    print(f"   Routes indexed: {stats['routes_indexed']}")
    
    indexer.close()
    return stats

def populate_flights_from_csv_index(csv_service, session, limit=None):
    """Populate flights from indexed CSV data"""
    print("\n📊 Populating flights from CSV index...")
    
    # Get all flights from CSV index
    flights = csv_service.search_flights(limit=limit or 2000)
    print(f"   Found {len(flights)} flights in CSV index")
    
    flight_count = 0
    skipped = 0
    
    for flight in flights:
        try:
            if not flight.get('origin') or not flight.get('destination') or not flight.get('airline'):
                skipped += 1
                continue
            
            # Check if already exists (by origin, destination, airline, and similar price)
            price = float(flight.get('price', 500))
            existing = session.exec(
                select(FlightDeal).where(
                    FlightDeal.origin == flight.get('origin'),
                    FlightDeal.destination == flight.get('destination'),
                    FlightDeal.airline == flight.get('airline', 'Unknown'),
                    FlightDeal.discounted_price.between(price * 0.9, price * 1.1)
                )
            ).first()
            
            if existing:
                skipped += 1
                continue
            
            # Generate realistic dates
            dep_time = datetime.now() + timedelta(days=random.randint(1, 90))
            arr_time = dep_time + timedelta(hours=random.randint(2, 15))
            
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
                deal_score=random.uniform(0.7, 1.0) * 100,
                is_active=True,
                tags=flight.get('class', 'economy'),
                available_seats=random.randint(5, 50)
            )
            session.add(flight_deal)
            flight_count += 1
            
            # Commit in batches for performance
            if flight_count % 100 == 0:
                session.commit()
                print(f"   Processed {flight_count} flights...")
                
        except Exception as e:
            session.rollback()
            skipped += 1
            continue
    
    session.commit()
    print(f"   ✅ Created {flight_count} flight deals (skipped {skipped} duplicates/invalid)")
    return flight_count

def populate_hotels_from_csv_index(csv_service, session, limit=None):
    """Populate hotels from indexed CSV data"""
    print("\n🏨 Populating hotels from CSV index...")
    
    # Get all hotels from CSV index
    hotels = csv_service.search_hotels(limit=limit or 2000)
    print(f"   Found {len(hotels)} hotels in CSV index")
    
    hotel_count = 0
    skipped = 0
    
    for hotel in hotels:
        try:
            if not hotel.get('city') or not hotel.get('name'):
                skipped += 1
                continue
            
            price = float(hotel.get('price_per_night', 100) or hotel.get('price', 100))
            if price <= 0 or price > 1000:
                skipped += 1
                continue
            
            # Check if already exists
            existing = session.exec(
                select(HotelDeal).where(
                    HotelDeal.name == hotel.get('name', 'Unknown'),
                    HotelDeal.city == hotel.get('city', 'Unknown'),
                    HotelDeal.discounted_price_per_night.between(price * 0.9, price * 1.1)
                )
            ).first()
            
            if existing:
                skipped += 1
                continue
            
            address = hotel.get('address', '') or f"{hotel.get('name')}, {hotel.get('city')}"
            
            hotel_deal = HotelDeal(
                name=hotel.get('name', 'Unknown Hotel'),
                city=hotel.get('city', 'Unknown'),
                state=hotel.get('state'),
                country=hotel.get('country', 'Unknown'),
                address=address,
                original_price_per_night=price * 1.25,
                discounted_price_per_night=price,
                discount_percentage=20.0,
                deal_score=random.uniform(0.7, 1.0) * 100,
                is_active=True,
                tags=hotel.get('tags', 'standard') or 'standard',
                available_rooms=random.randint(5, 30),
                rating=float(hotel.get('rating', 4.0)) if hotel.get('rating') else random.uniform(3.5, 5.0)
            )
            session.add(hotel_deal)
            hotel_count += 1
            
            # Commit in batches
            if hotel_count % 100 == 0:
                session.commit()
                print(f"   Processed {hotel_count} hotels...")
                
        except Exception as e:
            session.rollback()
            skipped += 1
            continue
    
    session.commit()
    print(f"   ✅ Created {hotel_count} hotel deals (skipped {skipped} duplicates/invalid)")
    return hotel_count

def populate_from_raw_csv_files(session):
    """Populate directly from raw CSV files (backup method)"""
    print("\n📄 Populating from raw CSV files...")
    data_dir = Path("./data/raw")
    
    flight_count = 0
    hotel_count = 0
    
    # Process flight CSV files
    flight_files = ["economy.csv", "business.csv", "Clean_Dataset.csv"]
    for csv_file in flight_files:
        csv_path = data_dir / csv_file
        if not csv_path.exists():
            continue
        
        try:
            print(f"   Processing {csv_file}...")
            df = pd.read_csv(csv_path, nrows=5000, low_memory=False)
            
            file_flight_count = 0
            for _, row in df.iterrows():
                try:
                    origin = str(row.get("from", "") or row.get("origin", "") or row.get("source_city", "")).upper().strip()
                    dest = str(row.get("to", "") or row.get("destination", "") or row.get("destination_city", "")).upper().strip()
                    airline = str(row.get("airline", "") or row.get("ch_code", "") or "Unknown").strip()
                    
                    if not origin or not dest or len(origin) < 2 or len(dest) < 2:
                        continue
                    
                    # Parse price
                    price_str = str(row.get("price", "500")).replace(",", "").replace("$", "").strip()
                    try:
                        price = float(price_str) if price_str else 500
                    except:
                        price = 500
                    
                    if price <= 0 or price > 5000:
                        continue
                    
                    # Check for duplicates
                    existing = session.exec(
                        select(FlightDeal).where(
                            FlightDeal.origin == origin,
                            FlightDeal.destination == dest,
                            FlightDeal.airline == airline,
                            FlightDeal.discounted_price.between(price * 0.9, price * 1.1)
                        )
                    ).first()
                    
                    if existing:
                        continue
                    
                    dep_time = datetime.now() + timedelta(days=random.randint(1, 90))
                    arr_time = dep_time + timedelta(hours=random.randint(2, 15))
                    
                    flight_deal = FlightDeal(
                        airline=airline,
                        flight_number=str(row.get("num_code", "") or row.get("flight_number", "") or f"{airline[:2]}{random.randint(100, 9999)}"),
                        origin=origin,
                        destination=dest,
                        departure_time=dep_time,
                        arrival_time=arr_time,
                        original_price=price * 1.2,
                        discounted_price=price,
                        discount_percentage=16.67,
                        deal_score=random.uniform(70, 100),
                        is_active=True,
                        tags=csv_file.split(".")[0].lower(),
                        available_seats=random.randint(5, 50)
                    )
                    session.add(flight_deal)
                    file_flight_count += 1
                    flight_count += 1
                    
                    if file_flight_count % 100 == 0:
                        session.commit()
                        
                except Exception as e:
                    continue
            
            session.commit()
            print(f"   ✅ Created {file_flight_count} flights from {csv_file}")
        except Exception as e:
            print(f"   ⚠️  Error processing {csv_file}: {e}")
            session.rollback()
    
    # Process hotel CSV files
    hotel_files = ["hotel_booking.csv", "listings.csv", "listings 2.csv"]
    for csv_file in hotel_files:
        csv_path = data_dir / csv_file
        if not csv_path.exists():
            continue
        
        try:
            print(f"   Processing {csv_file}...")
            df = pd.read_csv(csv_path, nrows=3000, low_memory=False)
            
            file_hotel_count = 0
            for _, row in df.iterrows():
                try:
                    # Skip cancelled bookings
                    if pd.notna(row.get("is_canceled")) and bool(row.get("is_canceled")):
                        continue
                    
                    name = str(row.get("name", "") or row.get("hotel", "") or f"Hotel {row.get('id', '')}").strip()
                    city = str(row.get("city", "") or row.get("neighbourhood_cleansed", "") or row.get("neighbourhood_group_cleansed", "")).strip()
                    
                    if not name or not city:
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
                        continue
                    
                    # Check for duplicates
                    existing = session.exec(
                        select(HotelDeal).where(
                            HotelDeal.name == name,
                            HotelDeal.city == city,
                            HotelDeal.discounted_price_per_night.between(price * 0.9, price * 1.1)
                        )
                    ).first()
                    
                    if existing:
                        continue
                    
                    country = str(row.get("country", "") or row.get("iso_country", "") or "Unknown")
                    address = str(row.get("address", "") or row.get("street", "") or f"{name}, {city}")
                    
                    hotel_deal = HotelDeal(
                        name=name,
                        city=city,
                        state=str(row.get("state", "")) if pd.notna(row.get("state")) else None,
                        country=country,
                        address=address[:200],
                        original_price_per_night=price * 1.25,
                        discounted_price_per_night=price,
                        discount_percentage=20.0,
                        deal_score=random.uniform(70, 100),
                        is_active=True,
                        tags="standard",
                        available_rooms=random.randint(5, 30),
                        rating=float(row.get("review_scores_rating", 4.0)) / 20 if pd.notna(row.get("review_scores_rating")) else random.uniform(3.5, 5.0)
                    )
                    session.add(hotel_deal)
                    file_hotel_count += 1
                    hotel_count += 1
                    
                    if file_hotel_count % 100 == 0:
                        session.commit()
                        
                except Exception as e:
                    continue
            
            session.commit()
            print(f"   ✅ Created {file_hotel_count} hotels from {csv_file}")
        except Exception as e:
            print(f"   ⚠️  Error processing {csv_file}: {e}")
            session.rollback()
    
    return flight_count, hotel_count

def main():
    """Main execution function"""
    print("=" * 60)
    print("🚀 COMPREHENSIVE DEAL POPULATION SCRIPT")
    print("=" * 60)
    print()
    
    # Step 1: Ensure database tables exist
    print("📊 Creating database tables...")
    create_db_and_tables()
    print("✅ Database tables ready")
    
    # Step 2: Index CSV data (if not already indexed)
    print("\n" + "=" * 60)
    print("STEP 2: Checking CSV Index")
    print("=" * 60)
    
    index_db = os.getenv("CSV_INDEX_DB", "./csv_index.db")
    if not Path(index_db).exists() and not os.getenv("USE_MYSQL", "true").lower() == "true":
        print("CSV index not found. Indexing CSV files...")
        index_csv_data()
    else:
        print("✅ CSV index already exists or using MySQL")
    
    # Step 3: Populate deals
    print("\n" + "=" * 60)
    print("STEP 3: Populating Flight and Hotel Deals")
    print("=" * 60)
    
    csv_service = CSVQueryService()
    
    with Session(engine) as session:
        # Check existing counts
        existing_flights = session.exec(select(func.count(FlightDeal.id)).where(FlightDeal.is_active == True)).one()
        existing_hotels = session.exec(select(func.count(HotelDeal.id)).where(HotelDeal.is_active == True)).one()
        
        print(f"\n📊 Current database state:")
        print(f"   Existing flights: {existing_flights}")
        print(f"   Existing hotels: {existing_hotels}")
        print()
        
        # Populate from CSV index
        flights_from_index = populate_flights_from_csv_index(csv_service, session, limit=5000)
        hotels_from_index = populate_hotels_from_csv_index(csv_service, session, limit=5000)
        
        # Populate from raw CSV files (additional data)
        flights_from_raw, hotels_from_raw = populate_from_raw_csv_files(session)
        
        # Final counts
        total_flights = session.exec(select(func.count(FlightDeal.id)).where(FlightDeal.is_active == True)).one()
        total_hotels = session.exec(select(func.count(HotelDeal.id)).where(HotelDeal.is_active == True)).one()
        
        # Get unique cities
        cities = session.exec(select(HotelDeal.city).distinct().where(HotelDeal.is_active == True)).all()
        
        print("\n" + "=" * 60)
        print("✅ POPULATION COMPLETE!")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"   Flights created this run:")
        print(f"      - From CSV index: {flights_from_index}")
        print(f"      - From raw CSV: {flights_from_raw}")
        print(f"   Hotels created this run:")
        print(f"      - From CSV index: {hotels_from_index}")
        print(f"      - From raw CSV: {hotels_from_raw}")
        print(f"\n📈 Total in database:")
        print(f"   Total flights: {total_flights}")
        print(f"   Total hotels: {total_hotels}")
        print(f"   Unique cities: {len(cities)}")
        print(f"\n🎉 All deals are active and ready for booking!")
        print(f"\n💡 These deals are now available:")
        print(f"   - AI Recommendation Service (for bundles)")
        print(f"   - Booking Service (for reservations)")
        print(f"   - Listing Service (for search)")
    
    csv_service.close()

if __name__ == "__main__":
    main()

