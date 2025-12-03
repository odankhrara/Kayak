"""Deal selector service - picks best deals from cache/DB"""
from sqlmodel import Session, select
from typing import List, Optional
from app.models import FlightDeal, HotelDeal, Bundle
from app.schemas import BundleSearchParams


class DealSelector:
    """Service for selecting the best deals"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_best_flight_deals(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[FlightDeal]:
        """
        Get best flight deals matching criteria
        
        First checks AI service's flight_deals table, then falls back to main flights table
        if needed. This ensures AI can access the same data as the main listing service.
        """
        statement = select(FlightDeal).where(FlightDeal.is_active == True)
        
        # Map city names to airport codes
        city_to_airport = {
            'tokyo': ['NRT', 'HND', 'TYO'],
            'new york': ['JFK', 'LGA', 'EWR', 'NYC'],
            'los angeles': ['LAX'],
            'miami': ['MIA'],
            'san francisco': ['SFO'],
            'chicago': ['ORD'],
            'london': ['LHR', 'LGW'],
            'paris': ['CDG', 'ORY'],
            'delhi': ['DEL'],
            'mumbai': ['BOM'],
        }
        
        if origin:
            origin_upper = origin.upper()
            # Try to map city to airport codes
            origin_codes = [origin_upper]
            for city, codes in city_to_airport.items():
                if city in origin.lower():
                    origin_codes.extend(codes)
            # Use ILIKE for flexible matching
            from sqlmodel import or_
            origin_conditions = [FlightDeal.origin.ilike(f"%{code}%") for code in origin_codes]
            statement = statement.where(or_(*origin_conditions))
        
        if destination:
            # Clean up destination - remove "from" if accidentally captured
            dest_clean = destination.replace("From", "").replace("from", "").strip()
            # Don't filter by destination if it's a flexible one
            flexible_destinations = ['warm region', 'tropical region', 'anywhere', 'anywhere warm']
            dest_lower = dest_clean.lower()
            if dest_lower not in flexible_destinations and "anywhere" not in dest_lower:
                # Map city to airport codes
                dest_upper = dest_clean.upper()
                dest_codes = [dest_upper]
                for city, codes in city_to_airport.items():
                    if city in dest_lower:
                        dest_codes.extend(codes)
                
                # Try matching airport codes or city name
                conditions = []
                for code in dest_codes:
                    conditions.append(FlightDeal.destination.ilike(f"%{code}%"))
                conditions.append(FlightDeal.destination.ilike(f"%{dest_clean}%"))
                
                from sqlmodel import or_
                statement = statement.where(or_(*conditions))
        if max_price:
            statement = statement.where(FlightDeal.discounted_price <= max_price)
        
        statement = statement.order_by(FlightDeal.deal_score.desc()).limit(limit)
        results = list(self.session.exec(statement).all())
        
        # If we don't have enough results, try fetching from main flights table (MySQL)
        if len(results) < limit:
            try:
                from sqlalchemy import text
                # Query main flights table directly
                origin_code = origin.upper() if origin else None
                dest_code = destination.upper() if destination else None
                
                query = """
                    SELECT 
                        flight_id, airline_name, departure_airport, arrival_airport,
                        departure_datetime, arrival_datetime,
                        price_per_ticket, available_seats,
                        (price_per_ticket * 0.85) as discounted_price,
                        (price_per_ticket * 0.15) as discount_amount,
                        15.0 as discount_percentage,
                        0.8 as deal_score,
                        flight_class as tags
                    FROM flights 
                    WHERE status = 'scheduled' AND available_seats > 0
                """
                params = {}
                
                if origin_code:
                    query += " AND departure_airport = :origin"
                    params['origin'] = origin_code
                if dest_code:
                    query += " AND arrival_airport = :destination"
                    params['destination'] = dest_code
                if max_price:
                    query += " AND price_per_ticket <= :max_price"
                    params['max_price'] = max_price
                
                query += " ORDER BY price_per_ticket ASC LIMIT :limit"
                params['limit'] = limit - len(results)
                
                # Execute raw SQL query
                from app.db.session import engine
                with engine.connect() as conn:
                    result = conn.execute(text(query), params)
                    rows = result.fetchall()
                    
                    # Convert MySQL flights to FlightDeal objects
                    for row in rows:
                        # Check if we already have this flight
                        existing = any(
                            f.origin == row.departure_airport and 
                            f.destination == row.arrival_airport and
                            f.airline == row.airline_name
                            for f in results
                        )
                        if existing:
                            continue
                        
                        # Convert Decimal to float for calculations
                        price_per_ticket = float(row.price_per_ticket)
                        discounted_price = float(row.discounted_price)
                        
                        flight_deal = FlightDeal(
                            airline=row.airline_name,
                            flight_number=row.flight_id,
                            origin=row.departure_airport,
                            destination=row.arrival_airport,
                            departure_time=row.departure_datetime,
                            arrival_time=row.arrival_datetime,
                            original_price=price_per_ticket / 0.85,  # Reverse calculate original
                            discounted_price=discounted_price,
                            discount_percentage=float(row.discount_percentage),
                            available_seats=int(row.available_seats),
                            deal_score=float(row.deal_score),
                            tags=str(row.tags) if row.tags else "economy",
                            is_active=True
                        )
                        self.session.add(flight_deal)
                        results.append(flight_deal)
                    
                    # Commit the new deals
                    if rows:
                        self.session.commit()
                        # Refresh to get IDs
                        for deal in results[-len(rows):]:
                            self.session.refresh(deal)
            except Exception as e:
                print(f"[DealSelector] Error fetching from main flights table: {e}")
                # Fall through to CSV fallback
        
        # If we still don't have enough results, fetch from CSV
        if len(results) < limit:
            try:
                from app.services.csv_query_service import CSVQueryService
                csv_service = CSVQueryService()
                csv_flights = csv_service.search_flights(
                    origin=origin,
                    destination=destination,
                    max_price=max_price,
                    limit=limit - len(results)
                )
                
                # Convert CSV results to FlightDeal-like objects or create deals
                for flight_data in csv_flights:
                    # Check if we already have this in results
                    if any(f.origin == flight_data.get('origin') and 
                           f.destination == flight_data.get('destination') and
                           f.airline == flight_data.get('airline', 'Unknown')
                           for f in results):
                        continue
                    
                    # Create deal from CSV data with time series simulation
                    from datetime import datetime, timedelta
                    import random
                    from app.data.price_simulator import PriceSimulator
                    
                    base_price = float(flight_data.get('price', 500))
                    seats_left = flight_data.get('seats_left', random.randint(5, 50))
                    
                    # Simulate time series price with mean-reverting behavior and promo dips
                    price_sim = PriceSimulator.simulate_flight_price(
                        base_price=base_price,
                        origin=flight_data.get('origin', ''),
                        destination=flight_data.get('destination', ''),
                        airline=flight_data.get('airline', 'Unknown'),
                        seats_left=seats_left
                    )
                    
                    # Use simulated current price
                    current_price = price_sim['current_price']
                    avg_30d_price = price_sim['avg_30d_price']
                    
                    # Calculate discount based on 30-day average
                    if avg_30d_price > 0:
                        discount_pct = ((avg_30d_price - current_price) / avg_30d_price) * 100
                    else:
                        discount_pct = 16.67  # Default
                    
                    # Calculate deal score using DealDetector
                    from app.deals_agent.deal_detector import DealDetector
                    historical_data = {
                        'avg_30d_price': avg_30d_price,
                        'promo_end_date': None  # Could be set if promo_active
                    }
                    deal_score = DealDetector.calculate_deal_score(
                        discount_percentage=max(0, discount_pct),
                        price=current_price,
                        availability=seats_left,
                        historical_data=historical_data
                    )
                    
                    dep_time = datetime.now() + timedelta(days=random.randint(1, 60))
                    
                    flight_deal = FlightDeal(
                        airline=flight_data.get('airline', 'Unknown'),
                        flight_number=flight_data.get('flight_number', '') or f"{flight_data.get('airline', 'XX')[:2]}{random.randint(100, 9999)}",
                        origin=flight_data.get('origin', ''),
                        destination=flight_data.get('destination', ''),
                        departure_time=dep_time,
                        arrival_time=dep_time + timedelta(hours=random.randint(2, 12)),
                        original_price=avg_30d_price if avg_30d_price > 0 else current_price * 1.2,
                        discounted_price=current_price,
                        discount_percentage=max(0, discount_pct),
                        deal_score=deal_score / 100.0,  # Convert to 0-1 range for model
                        is_active=True,
                        tags=flight_data.get('class', 'economy'),
                        available_seats=seats_left
                    )
                    
                    # Check if exists in DB
                    existing = self.session.exec(
                        select(FlightDeal).where(
                            FlightDeal.origin == flight_deal.origin,
                            FlightDeal.destination == flight_deal.destination,
                            FlightDeal.airline == flight_deal.airline
                        )
                    ).first()
                    
                    if not existing:
                        self.session.add(flight_deal)
                        self.session.commit()
                        self.session.refresh(flight_deal)
                    
                    results.append(flight_deal if not existing else existing)
                    
                    if len(results) >= limit:
                        break
            except Exception as e:
                print(f"[DealSelector] Error fetching from CSV: {e}")
        
        return results[:limit]
    
    def get_best_hotel_deals(
        self,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 10
    ) -> List[HotelDeal]:
        """Get best hotel deals matching criteria - fetches from CSV if needed"""
        
        # Convert airport codes to city names for hotel search
        airport_to_city = {
            'DEL': 'Delhi', 'BOM': 'Mumbai', 'NRT': 'Tokyo', 'HND': 'Tokyo',
            'JFK': 'New York', 'LGA': 'New York', 'EWR': 'New York', 'NYC': 'New York',
            'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'MIA': 'Miami',
            'ORD': 'Chicago', 'LHR': 'London', 'CDG': 'Paris'
        }
        
        # If city is an airport code, convert to city name
        if city and len(city) == 3 and city.upper() in airport_to_city:
            city = airport_to_city[city.upper()]
        elif city and city.upper() in airport_to_city:
            city = airport_to_city[city.upper()]
        
        statement = select(HotelDeal).where(HotelDeal.is_active == True)
        
        if city:
            # Clean up city - remove "from" if accidentally captured
            city_clean = city.replace("From", "").replace("from", "").strip()
            # Match by city name (case-insensitive, partial match)
            from sqlmodel import or_
            statement = statement.where(
                or_(
                    HotelDeal.city.ilike(f"%{city_clean}%"),
                    HotelDeal.city.ilike(f"%{city}%"),
                    HotelDeal.city.ilike(f"%{city.title()}%"),
                    HotelDeal.city.ilike(f"%{city.upper()}%")
                )
            )
        if max_price:
            statement = statement.where(HotelDeal.discounted_price_per_night <= max_price)
        
        statement = statement.order_by(HotelDeal.deal_score.desc()).limit(limit)
        results = list(self.session.exec(statement).all())
        
        # If we don't have enough results, fetch from CSV
        if len(results) < limit:
            try:
                from app.services.csv_query_service import CSVQueryService
                csv_service = CSVQueryService()
                csv_hotels = csv_service.search_hotels(
                    city=city,
                    max_price=max_price,
                    limit=limit - len(results)
                )
                
                # Convert CSV results to HotelDeal objects
                for hotel_data in csv_hotels:
                    # Check if we already have this in results
                    if any(h.name == hotel_data.get('name') and 
                           h.city == hotel_data.get('city')
                           for h in results):
                        continue
                    
                    # Create deal from CSV data
                    import random
                    
                    price = float(hotel_data.get('price', 100) or hotel_data.get('price_per_night', 100))
                    address = hotel_data.get('address', '') or f"{hotel_data.get('name')}, {hotel_data.get('city')}"
                    
                    hotel_deal = HotelDeal(
                        name=hotel_data.get('name', 'Unknown Hotel'),
                        city=hotel_data.get('city', 'Unknown'),
                        country=hotel_data.get('country', 'Unknown'),
                        address=address,
                        original_price_per_night=price * 1.25,
                        discounted_price_per_night=price,
                        discount_percentage=20.0,
                        deal_score=random.uniform(0.7, 1.0),
                        is_active=True,
                        tags=hotel_data.get('tags', 'standard'),
                        available_rooms=random.randint(5, 20),
                        rating=float(hotel_data.get('rating', 4.0)) if hotel_data.get('rating') else 4.0
                    )
                    
                    # Check if exists in DB
                    existing = self.session.exec(
                        select(HotelDeal).where(
                            HotelDeal.name == hotel_deal.name,
                            HotelDeal.city == hotel_deal.city
                        )
                    ).first()
                    
                    if not existing:
                        self.session.add(hotel_deal)
                        self.session.commit()
                        self.session.refresh(hotel_deal)
                    
                    results.append(hotel_deal if not existing else existing)
                    
                    if len(results) >= limit:
                        break
            except Exception as e:
                print(f"[DealSelector] Error fetching hotels from CSV: {e}")
        
        return results[:limit]
    
    def get_best_bundles(self, params: BundleSearchParams, limit: int = 10) -> List[Bundle]:
        """Get best bundles matching search parameters"""
        statement = select(Bundle).where(Bundle.is_active == True)
        
        if params.max_price:
            statement = statement.where(Bundle.total_price <= params.max_price)
        
        statement = statement.order_by(Bundle.savings.desc()).limit(limit * 2)  # Get more to filter
        all_bundles = list(self.session.exec(statement).all())
        
        # Filter bundles by origin/destination by checking their flights
        filtered_bundles = []
        city_to_airport = {
            'tokyo': ['NRT', 'HND', 'TYO'],
            'new york': ['JFK', 'LGA', 'EWR', 'NYC'],
            'los angeles': ['LAX'],
            'miami': ['MIA'],
            'san francisco': ['SFO'],
            'chicago': ['ORD'],
            'london': ['LHR', 'LGW'],
            'paris': ['CDG', 'ORY'],
            'delhi': ['DEL'],
            'mumbai': ['BOM'],
        }
        
        # Get origin/destination codes to match
        origin_codes = []
        if params.origin:
            origin_upper = params.origin.upper()
            origin_codes.append(origin_upper)
            for city, codes in city_to_airport.items():
                if city in params.origin.lower():
                    origin_codes.extend(codes)
        
        dest_codes = []
        if params.destination:
            dest_upper = params.destination.upper()
            dest_codes.append(dest_upper)
            for city, codes in city_to_airport.items():
                if city in params.destination.lower():
                    dest_codes.extend(codes)
        
        for bundle in all_bundles:
            # Check if bundle matches origin/destination by examining its flights
            if bundle.flight_deal_ids:
                flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
                matching = False
                
                for flight_id in flight_ids[:1]:  # Check first flight
                    flight = self.session.get(FlightDeal, flight_id)
                    if flight:
                        # Check origin match
                        origin_match = not origin_codes or any(
                            flight.origin.upper() == code.upper() or 
                            code.upper() in flight.origin.upper() or
                            flight.origin.upper() in code.upper()
                            for code in origin_codes
                        )
                        
                        # Check destination match
                        dest_match = not dest_codes or any(
                            flight.destination.upper() == code.upper() or 
                            code.upper() in flight.destination.upper() or
                            flight.destination.upper() in code.upper()
                            for code in dest_codes
                        )
                        
                        if origin_match and dest_match:
                            matching = True
                            break
                
                if not matching:
                    continue
        
            # Filter by tags if provided
            if params.tags:
                bundle_tags = [tag.strip() for tag in bundle.tags.split(",") if tag.strip()]
                if not any(tag in bundle_tags for tag in params.tags):
                    continue
            
            filtered_bundles.append(bundle)
            
            if len(filtered_bundles) >= limit:
                break
        
        return filtered_bundles
    
    def get_deal_by_id(self, deal_id: int, deal_type: str) -> Optional[FlightDeal | HotelDeal]:
        """Get deal by ID and type"""
        if deal_type == "flight":
            return self.session.get(FlightDeal, deal_id)
        elif deal_type == "hotel":
            return self.session.get(HotelDeal, deal_id)
        return None

