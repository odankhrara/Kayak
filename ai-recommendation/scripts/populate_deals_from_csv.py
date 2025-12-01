"""Populate FlightDeal and HotelDeal from indexed CSV data"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.session import engine
from app.models import FlightDeal, HotelDeal
from app.services.csv_query_service import CSVQueryService
from datetime import datetime, timedelta
import random

def populate_deals():
    """Populate deals from CSV data"""
    csv_service = CSVQueryService()
    
    with Session(engine) as session:
        # Check existing counts
        flight_count = session.exec(select(FlightDeal)).all()
        hotel_count = session.exec(select(HotelDeal)).all()
        print(f"Existing: {len(flight_count)} flights, {len(hotel_count)} hotels")
        
        # Populate flights from CSV
        print("\n📊 Populating flights from CSV data...")
        flights = csv_service.search_flights(
            origin=None,
            destination=None,
            max_price=2000,
            limit=200  # Get more flights
        )
        
        flight_deals_created = 0
        for flight in flights[:100]:  # Create up to 100 flights
            try:
                # Check if already exists
                existing = session.exec(
                    select(FlightDeal).where(
                        FlightDeal.airline == flight.get('airline', 'Unknown'),
                        FlightDeal.origin == flight.get('origin', ''),
                        FlightDeal.destination == flight.get('destination', '')
                    )
                ).first()
                
                if existing:
                    continue
                
                price = float(flight.get('price', 500))
                # Parse departure/arrival times if available
                dep_time = datetime.now() + timedelta(days=random.randint(1, 30))
                arr_time = dep_time + timedelta(hours=random.randint(2, 8))
                
                if flight.get('departure_time'):
                    try:
                        dep_time = datetime.fromisoformat(str(flight.get('departure_time')))
                    except:
                        pass
                if flight.get('arrival_time'):
                    try:
                        arr_time = datetime.fromisoformat(str(flight.get('arrival_time')))
                    except:
                        pass
                
                flight_deal = FlightDeal(
                    airline=flight.get('airline', 'Unknown'),
                    flight_number=flight.get('flight_number', '') or f"{flight.get('airline', 'XX')}{random.randint(100, 9999)}",
                    origin=flight.get('origin', ''),
                    destination=flight.get('destination', ''),
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    original_price=price * 1.2,  # 20% markup
                    discounted_price=price,
                    discount_percentage=16.67,
                    deal_score=random.uniform(0.7, 1.0),
                    is_active=True,
                    tags=flight.get('class', 'Economy').lower(),
                    available_seats=random.randint(5, 50)
                )
                session.add(flight_deal)
                flight_deals_created += 1
            except Exception as e:
                print(f"Error creating flight deal: {e}")
                session.rollback()
                continue
        
        # Populate hotels from CSV
        print("\n🏨 Populating hotels from CSV data...")
        hotels = csv_service.search_hotels(
            city=None,
            max_price=500,
            limit=200  # Get more hotels
        )
        
        hotel_deals_created = 0
        for hotel in hotels[:100]:  # Create up to 100 hotels
            try:
                # Check if already exists
                existing = session.exec(
                    select(HotelDeal).where(
                        HotelDeal.name == hotel.get('name', 'Unknown'),
                        HotelDeal.city == hotel.get('city', '')
                    )
                ).first()
                
                if existing:
                    continue
                
                price = float(hotel.get('price', 100) or hotel.get('price_per_night', 100))
                # Generate address if not available
                address = hotel.get('address', '') or f"{hotel.get('name', 'Hotel')}, {hotel.get('city', 'Unknown')}"
                hotel_deal = HotelDeal(
                    name=hotel.get('name', 'Unknown Hotel'),
                    city=hotel.get('city', 'Unknown'),
                    country=hotel.get('country', 'Unknown'),
                    address=address,
                    original_price_per_night=price * 1.25,  # 25% markup
                    discounted_price_per_night=price,
                    discount_percentage=20.0,
                    deal_score=random.uniform(0.7, 1.0),
                    is_active=True,
                    tags=hotel.get('tags', 'standard'),
                    available_rooms=random.randint(5, 20),
                    rating=float(hotel.get('rating', 4.0)) if hotel.get('rating') else 4.0
                )
                session.add(hotel_deal)
                hotel_deals_created += 1
            except Exception as e:
                print(f"Error creating hotel deal: {e}")
                session.rollback()
                continue
        
        session.commit()
        
        print(f"\n✅ Created {flight_deals_created} flight deals and {hotel_deals_created} hotel deals")
        print(f"📊 Total deals: {len(session.exec(select(FlightDeal)).all())} flights, {len(session.exec(select(HotelDeal)).all())} hotels")

if __name__ == "__main__":
    populate_deals()

