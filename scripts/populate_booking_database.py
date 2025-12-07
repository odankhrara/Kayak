"""Populate main booking database (MySQL) with flights, hotels, and cars from CSV data"""
import sys
import os
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent.parent / "ai-recommendation"))

import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import random
import string

# Database configuration
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3307)),  # Docker maps to 3307
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'password'),
    'database': os.getenv('MYSQL_DATABASE', 'kayak')
}

def generate_flight_id(airline: str, num: int) -> str:
    """Generate flight ID like AA123"""
    airline_code = airline[:2].upper() if len(airline) >= 2 else "XX"
    return f"{airline_code}{num:03d}"

def generate_hotel_id(name: str, num: int) -> str:
    """Generate hotel ID"""
    name_clean = ''.join(c for c in name if c.isalnum())[:8].upper()
    return f"HTL{name_clean}{num:03d}"

def generate_car_id(company: str, num: int) -> str:
    """Generate car ID"""
    company_clean = ''.join(c for c in company if c.isalnum())[:5].upper()
    return f"CAR{company_clean}{num:03d}"

def populate_flights_from_csv():
    """Populate flights table from CSV data"""
    try:
        # Change to ai-recommendation directory for imports
        import os
        os.chdir(Path(__file__).parent.parent / "ai-recommendation")
        
        # CSVQueryService now uses MySQL by default (kayak_csv_index database)
        from app.services.csv_query_service import CSVQueryService
        csv_service = CSVQueryService()
        
        # Get flights from CSV
        flights = csv_service.search_flights(limit=200)
        print(f"📊 Found {len(flights)} flights in CSV")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        count = 0
        flight_num = 1
        
        # Track routes we've added to avoid duplicates
        added_routes = set()
        
        for flight_data in flights[:200]:  # Process more flights
            try:
                # Extract origin and destination - flights.csv uses 'origin' and 'destination' keys
                origin = (flight_data.get('origin') or 
                         flight_data.get('departure_airport') or 
                         flight_data.get('from') or
                         flight_data.get('source') or
                         flight_data.get('departure_city') or
                         flight_data.get('origin_city') or
                         flight_data.get('ORIGIN_AIRPORT') or
                         flight_data.get('origin_airport'))
                destination = (flight_data.get('destination') or 
                              flight_data.get('arrival_airport') or 
                              flight_data.get('to') or
                              flight_data.get('dest') or
                              flight_data.get('arrival_city') or
                              flight_data.get('destination_city') or
                              flight_data.get('DESTINATION_AIRPORT') or
                              flight_data.get('destination_airport'))
                
                if not origin or not destination:
                    continue
                
                # Extract airline - use airline name if available, otherwise map code
                airline = (flight_data.get('airline') or 
                          flight_data.get('airline_name') or 
                          flight_data.get('carrier') or
                          'Unknown')
                
                # If airline is a code, map it using airlines.csv
                airline_code = flight_data.get('airline_code') or flight_data.get('AIRLINE')
                if airline_code and (len(airline_code) == 2 or len(airline_code) == 3):
                    mapped_name = airlines_data.get(airline_code.upper())
                    if mapped_name:
                        airline = mapped_name
                
                if not origin or not destination or not airline:
                    continue
                
                # Convert city names to airport codes using AirportMapper
                try:
                    os.chdir(Path(__file__).parent.parent / "ai-recommendation")
                    from app.data.airport_mapper import AirportMapper
                    airport_mapper = AirportMapper()
                    
                    # Try to get airport code for origin
                    origin_codes = airport_mapper.get_airport_codes_for_city(origin)
                    if origin_codes:
                        origin = origin_codes[0].upper()  # Use first IATA code
                    else:
                        origin = origin.upper()[:3] if len(origin) >= 3 else origin.upper()
                    
                    # Try to get airport code for destination
                    dest_codes = airport_mapper.get_airport_codes_for_city(destination)
                    if dest_codes:
                        destination = dest_codes[0].upper()  # Use first IATA code
                    else:
                        destination = destination.upper()[:3] if len(destination) >= 3 else destination.upper()
                except:
                    # Fallback to simple mapping
                    origin = origin.upper()[:3] if len(origin) >= 3 else origin.upper()
                    destination = destination.upper()[:3] if len(destination) >= 3 else destination.upper()
                
                # Common city to airport mappings
                city_to_code = {
                    'DEL': 'DEL', 'DELHI': 'DEL', 'MUM': 'BOM', 'MUMBAI': 'BOM', 'BOMBAY': 'BOM',
                    'BAN': 'BLR', 'BANGALORE': 'BLR', 'CHE': 'MAA', 'CHENNAI': 'MAA',
                    'KOL': 'CCU', 'KOLKATA': 'CCU', 'HYD': 'HYD', 'HYDERABAD': 'HYD',
                    'NYC': 'JFK', 'NEW YORK': 'JFK', 'LA': 'LAX', 'LOS ANGELES': 'LAX',
                    'SF': 'SFO', 'SAN FRANCISCO': 'SFO', 'CHI': 'ORD', 'CHICAGO': 'ORD',
                    'TOK': 'NRT', 'TOKYO': 'NRT'
                }
                origin = city_to_code.get(origin, origin[:3] if len(origin) >= 3 else origin)
                destination = city_to_code.get(destination, destination[:3] if len(destination) >= 3 else destination)
                
                # Ensure we have valid 3-character airport codes
                if len(origin) != 3 or len(destination) != 3:
                    continue
                
                # Create flights in BOTH directions for popular routes
                routes_to_add = [(origin, destination)]
                
                # Add reverse route for popular Indian routes
                popular_routes = [('BOM', 'DEL'), ('DEL', 'BOM'), ('BOM', 'BLR'), ('BLR', 'BOM'),
                                ('DEL', 'BLR'), ('BLR', 'DEL'), ('BOM', 'MAA'), ('MAA', 'BOM')]
                if (origin, destination) in popular_routes or (destination, origin) in popular_routes:
                    # Add reverse route
                    if (destination, origin) not in added_routes:
                        routes_to_add.append((destination, origin))
                
                for route_origin, route_dest in routes_to_add:
                    route_key = f"{route_origin}-{route_dest}"
                    if route_key in added_routes:
                        continue
                    
                    flight_id = generate_flight_id(airline, flight_num)
                    flight_num += 1
                    
                    # Check if this exact route already exists
                    cursor.execute("""
                        SELECT flight_id FROM flights 
                        WHERE departure_airport = %s AND arrival_airport = %s 
                        LIMIT 1
                    """, (route_origin, route_dest))
                    if cursor.fetchone():
                        added_routes.add(route_key)
                        continue
                    
                # Get price - try multiple fields
                price = None
                for price_key in ['price', 'price_per_ticket', 'fare', 'ticket_price', 'base_fare', 'total_fare', 'adult_fare']:
                    if price_key in flight_data and flight_data[price_key]:
                        try:
                            price = float(flight_data[price_key])
                            break
                        except:
                            pass
                if not price or price <= 0:
                    price = random.uniform(200, 2000)  # Random price if not found
                    
                    # Get duration from data if available
                    duration_hours = None
                    for dur_key in ['duration', 'flight_time', 'duration_hours', 'time']:
                        if dur_key in flight_data and flight_data[dur_key]:
                            try:
                                dur_val = float(flight_data[dur_key])
                                # If duration is in minutes, convert to hours
                                if dur_val > 100:  # Likely in minutes
                                    duration_hours = dur_val / 60
                                else:
                                    duration_hours = dur_val
                                break
                            except:
                                pass
                    
                    # Use original date from CSV if available, otherwise create future dates
                    use_csv_date = False
                    csv_year = flight_data.get('year')
                    csv_month = flight_data.get('month')
                    csv_day = flight_data.get('day')
                    
                    if csv_year and csv_month and csv_day:
                        try:
                            # Use the date from CSV but project it to the future
                            csv_date = datetime(csv_year, csv_month, csv_day)
                            # Project to next 60 days
                            days_from_now = (csv_date - datetime.now()).days
                            if days_from_now < 0:
                                # Date is in the past, project to future
                                base_offset = abs(days_from_now) % 60
                                use_csv_date = True
                        except:
                            pass
                    
                    # Create multiple flights for the same route (different dates/times)
                    # Create flights for next 60 days, multiple per day for popular routes
                    flights_per_route = 3 if (route_origin, route_dest) in popular_routes else 1
                    for day_offset in range(0, 60, 1):  # Every day for next 60 days
                        for flight_instance in range(flights_per_route):
                            if use_csv_date and csv_year and csv_month and csv_day:
                                # Use CSV date projected to future
                                try:
                                    base_date = datetime.now() + timedelta(days=base_offset + day_offset)
                                    dep_time = base_date.replace(month=csv_month, day=min(csv_day, 28))
                                except:
                                    dep_time = datetime.now() + timedelta(days=day_offset + random.randint(0, 2))
                            else:
                                dep_time = datetime.now() + timedelta(days=day_offset + random.randint(0, 2))
                            
                            # Use scheduled departure time from CSV if available
                            scheduled_dep = flight_data.get('scheduled_departure')
                            if scheduled_dep and str(scheduled_dep).isdigit() and len(str(scheduled_dep)) >= 3:
                                try:
                                    # Format: HHMM (e.g., 1430 = 2:30 PM)
                                    dep_str = str(int(scheduled_dep)).zfill(4)
                                    hour = int(dep_str[:2]) % 24
                                    minute = int(dep_str[2:4]) % 60
                                    dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                                except:
                                    # Fallback to random time
                                    hour = random.randint(6, 22)
                                    minute = random.choice([0, 15, 30, 45])
                                    dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            else:
                                # Adjust time to reasonable hours (6 AM to 10 PM)
                                hour = random.randint(6, 22)
                                minute = random.choice([0, 15, 30, 45])
                                dep_time = dep_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            
                            # Flight duration based on route or data
                            if duration_hours:
                                pass  # Use from data
                            elif route_origin in ['BOM', 'DEL'] and route_dest in ['BOM', 'DEL']:
                                duration_hours = 2.0  # Mumbai-Delhi is ~2 hours
                            elif route_origin in ['BOM', 'BLR'] and route_dest in ['BOM', 'BLR']:
                                duration_hours = 1.5  # Mumbai-Bangalore is ~1.5 hours
                            elif route_origin in ['DEL', 'BLR'] and route_dest in ['DEL', 'BLR']:
                                duration_hours = 2.5  # Delhi-Bangalore
                            else:
                                duration_hours = random.uniform(1.5, 4.0)
                            
                            arr_time = dep_time + timedelta(hours=int(duration_hours), minutes=int((duration_hours % 1) * 60))
                            duration = int((arr_time - dep_time).total_seconds() / 60)
                        
                        # Determine flight class
                        flight_class = 'economy'
                        if 'business' in str(flight_data.get('class', '')).lower():
                            flight_class = 'business'
                        elif 'first' in str(flight_data.get('class', '')).lower():
                            flight_class = 'first'
                        
                        total_seats = random.randint(100, 300)
                        available_seats = random.randint(10, total_seats)
                        
                        # Generate unique flight ID for each flight instance
                        unique_flight_id = f"{flight_id}{day_offset:02d}"
                        
                        cursor.execute("""
                            INSERT INTO flights (
                                flight_id, airline_name, departure_airport, arrival_airport,
                                departure_datetime, arrival_datetime, duration_minutes,
                                flight_class, price_per_ticket, total_seats, available_seats,
                                rating, reviews_count, status
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            unique_flight_id, airline, route_origin, route_dest, dep_time, arr_time,
                            duration, flight_class, price, total_seats, available_seats,
                            round(random.uniform(3.5, 5.0), 2), random.randint(10, 500),
                            'scheduled'
                        ))
                        count += 1
                        
                        if count % 50 == 0:
                            conn.commit()
                            print(f"  ✅ Processed {count} flights...")
                    
                    added_routes.add(route_key)
                    
            except Exception as e:
                print(f"Error inserting flight: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Inserted {count} flights into booking database")
        return count
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

def populate_hotels_from_csv():
    """Populate hotels table from hotel_booking.csv and indexed CSV data"""
    try:
        import csv
        import pandas as pd
        
        # First, try to read from hotel_booking.csv directly
        hotel_csv_path = Path(__file__).parent.parent / "ai-recommendation" / "data" / "raw" / "hotel_booking.csv"
        hotels_from_file = []
        
        if hotel_csv_path.exists():
            print(f"📂 Reading from {hotel_csv_path.name}...")
            try:
                # Use pandas for better CSV handling
                # Read more rows to get better coverage
                df = pd.read_csv(hotel_csv_path, nrows=20000)
                print(f"📊 Loaded {len(df)} rows from hotel_booking.csv")
                
                # Group by hotel type and country to create unique hotels
                # The CSV has 'hotel' column with values like "Resort Hotel" or "City Hotel"
                # and 'country' column with country codes
                unique_hotels = {}
                
                for _, row in df.iterrows():
                    hotel_type = str(row.get('hotel', 'Hotel')).strip()
                    country_code = str(row.get('country', '')).strip()
                    
                    # Skip invalid entries
                    if not hotel_type or hotel_type == 'nan' or not country_code or country_code == 'nan':
                        continue
                    
                    # Create unique key: hotel_type + country
                    hotel_key = f"{hotel_type}_{country_code}"
                    
                    if hotel_key not in unique_hotels:
                        # Country code to city mapping (common destinations)
                        country_to_city = {
                            'PRT': 'Lisbon', 'GBR': 'London', 'FRA': 'Paris', 'ESP': 'Madrid',
                            'DEU': 'Berlin', 'ITA': 'Rome', 'NLD': 'Amsterdam', 'BEL': 'Brussels',
                            'USA': 'New York', 'CAN': 'Toronto', 'AUS': 'Sydney', 'JPN': 'Tokyo',
                            'CHN': 'Beijing', 'IND': 'Mumbai', 'BRA': 'Rio de Janeiro', 'MEX': 'Mexico City',
                            'THA': 'Bangkok', 'SGP': 'Singapore', 'ARE': 'Dubai', 'TUR': 'Istanbul'
                        }
                        
                        # Get city from country or use country name
                        city = country_to_city.get(country_code, country_code)
                        
                        # Get average ADR for this hotel type + country
                        hotel_rows = df[(df['hotel'] == hotel_type) & (df['country'] == country_code)]
                        avg_adr = hotel_rows['adr'].mean() if 'adr' in df.columns and not hotel_rows.empty else None
                        
                        # Get room types used
                        room_types = hotel_rows['reserved_room_type'].dropna().unique().tolist() if 'reserved_room_type' in df.columns else []
                        
                        # Create hotel entry
                        hotel_dict = {
                            'name': f"{hotel_type} {city}",
                            'hotel_type': hotel_type,
                            'city': city,
                            'country': country_code,
                            'price_per_night': float(avg_adr) if avg_adr and not pd.isna(avg_adr) else random.uniform(80, 250),
                            'room_type': room_types[0] if room_types else 'A',
                            'all_room_types': room_types,
                            'rating': round(random.uniform(3.8, 4.8), 2),  # Generate rating
                            'address': f"{hotel_type}, {city}",
                            'state': country_code[:2] if len(country_code) >= 2 else 'XX',
                            'raw_data': {
                                'hotel_type': hotel_type,
                                'country': country_code,
                                'avg_adr': float(avg_adr) if avg_adr and not pd.isna(avg_adr) else None,
                                'booking_count': len(hotel_rows)
                            }
                        }
                        unique_hotels[hotel_key] = hotel_dict
                
                hotels_from_file = list(unique_hotels.values())
                print(f"✅ Extracted {len(hotels_from_file)} unique hotels from booking data")
            except Exception as e:
                print(f"⚠️  Error reading CSV with pandas: {e}")
                print("   Trying with csv module...")
                try:
                    with open(hotel_csv_path, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for i, row in enumerate(reader):
                            if i >= 1000:  # Limit to 1000 rows
                                break
                            hotels_from_file.append(row)
                    print(f"✅ Loaded {len(hotels_from_file)} hotels using csv module")
                except Exception as e2:
                    print(f"❌ Error reading CSV: {e2}")
        
        # Also get hotels from indexed CSV data (MySQL database)
        hotels_from_index = []
        try:
            os.chdir(Path(__file__).parent.parent / "ai-recommendation")
            
            # CSVQueryService now uses MySQL by default (kayak_csv_index database)
            from app.services.csv_query_service import CSVQueryService
            csv_service = CSVQueryService()
            hotels_from_index = csv_service.search_hotels(limit=500)
            print(f"📊 Found {len(hotels_from_index)} hotels in indexed data")
        except Exception as e:
            print(f"⚠️  Could not load hotels from CSV index (MySQL): {e}")
            print("   Continuing with hotels from CSV file only...")
        
        # Combine both sources, prioritizing hotel_booking.csv
        all_hotels = hotels_from_file + hotels_from_index
        print(f"🏨 Total hotels to process: {len(all_hotels)}")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        count = 0
        hotel_num = 1
        seen_hotels = set()  # Track hotels we've already inserted
        
        for hotel_data in all_hotels:
            try:
                # Extract hotel name
                hotel_name = (hotel_data.get('name') or 
                             hotel_data.get('hotel_name') or 
                             hotel_data.get('hotel') or
                             hotel_data.get('hotel_name') or
                             'Unknown Hotel')
                
                # Extract city
                city = (hotel_data.get('city') or 
                       hotel_data.get('hotel_city') or
                       hotel_data.get('destination') or
                       'Unknown')
                
                if not city or city == 'Unknown' or not hotel_name or hotel_name == 'Unknown Hotel':
                    continue
                
                # Create unique key to avoid duplicates
                hotel_key = f"{hotel_name}_{city}".lower()
                if hotel_key in seen_hotels:
                    continue
                seen_hotels.add(hotel_key)
                
                hotel_id = generate_hotel_id(hotel_name, hotel_num)
                hotel_num += 1
                
                # Check if exists
                cursor.execute("SELECT hotel_id FROM hotels WHERE hotel_id = %s", (hotel_id,))
                if cursor.fetchone():
                    continue
                
                # Extract price
                price = None
                for price_key in ['price_per_night', 'price', 'adr', 'average_daily_rate', 'room_rate']:
                    if price_key in hotel_data and hotel_data[price_key]:
                        try:
                            price = float(hotel_data[price_key])
                            break
                        except:
                            pass
                if not price or price <= 0:
                    price = random.uniform(50, 300)
                
                # Extract rating
                rating = None
                for rating_key in ['rating', 'score', 'review_score', 'guest_rating']:
                    if rating_key in hotel_data and hotel_data[rating_key]:
                        try:
                            rating = float(hotel_data[rating_key])
                            # Normalize to 0-5 scale if needed
                            if rating > 5:
                                rating = rating / 2.0
                            break
                        except:
                            pass
                if not rating or rating <= 0:
                    rating = round(random.uniform(3.5, 5.0), 2)
                
                star_rating = min(5, max(1, int(round(rating))))
                
                # Extract state
                state = (hotel_data.get('state') or 
                        hotel_data.get('hotel_state') or
                        hotel_data.get('region') or
                        random.choice(['CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'MA', 'GA', 'NC', 'AZ']))
                
                # Ensure state is exactly 2 characters
                if len(state) > 2:
                    state = state[:2].upper()
                elif len(state) < 2:
                    state = random.choice(['CA', 'NY', 'TX', 'FL', 'IL'])
                
                # Extract address
                address = (hotel_data.get('address') or 
                          hotel_data.get('location') or
                          hotel_data.get('hotel_address') or
                          f"{hotel_name}, {city}")
                
                # Extract zip code
                zip_code = (hotel_data.get('zip_code') or 
                           hotel_data.get('zip') or
                           hotel_data.get('postal_code') or
                           f"{random.randint(10000, 99999)}")
                
                # Extract coordinates
                latitude = None
                longitude = None
                for lat_key in ['latitude', 'lat']:
                    if lat_key in hotel_data and hotel_data[lat_key]:
                        try:
                            latitude = float(hotel_data[lat_key])
                            break
                        except:
                            pass
                for lon_key in ['longitude', 'lng', 'lon']:
                    if lon_key in hotel_data and hotel_data[lon_key]:
                        try:
                            longitude = float(hotel_data[lon_key])
                            break
                        except:
                            pass
                
                # Extract description from raw_data if available
                description = None
                if 'raw_data' in hotel_data and isinstance(hotel_data['raw_data'], dict):
                    for desc_key in ['description', 'overview', 'details', 'summary']:
                        if desc_key in hotel_data['raw_data']:
                            description = str(hotel_data['raw_data'][desc_key])[:500]  # Limit to 500 chars
                            break
                
                # Calculate total rooms (if available in data, otherwise random)
                total_rooms = random.randint(20, 150)
                if 'total_rooms' in hotel_data:
                    try:
                        total_rooms = int(hotel_data['total_rooms'])
                    except:
                        pass
                elif 'number_of_rooms' in hotel_data:
                    try:
                        total_rooms = int(hotel_data['number_of_rooms'])
                    except:
                        pass
                
                # Insert hotel
                cursor.execute("""
                    INSERT INTO hotels (
                        hotel_id, hotel_name, address, city, state, zip_code,
                        star_rating, description, total_rooms, rating, reviews_count,
                        latitude, longitude, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    hotel_id,
                    hotel_name[:200],  # Limit to 200 chars
                    address[:255],  # Limit to 255 chars
                    city[:100],
                    state,
                    str(zip_code)[:10],
                    star_rating,
                    description,
                    total_rooms,
                    round(rating, 2),
                    random.randint(20, 1000),
                    latitude,
                    longitude,
                    'active'
                ))
                
                # Extract amenities and create amenity records
                amenities_str = (hotel_data.get('amenities') or 
                               hotel_data.get('facilities') or
                               hotel_data.get('features') or
                               '')
                
                # Common amenities to look for
                amenity_mapping = {
                    'wifi': 'WiFi',
                    'pool': 'Pool',
                    'gym': 'Gym',
                    'fitness': 'Gym',
                    'parking': 'Parking',
                    'breakfast': 'Breakfast',
                    'spa': 'Spa',
                    'restaurant': 'Restaurant',
                    'bar': 'Bar',
                    'airport': 'Airport Shuttle',
                    'shuttle': 'Airport Shuttle',
                    'pet': 'Pet Friendly',
                    'business': 'Business Center'
                }
                
                found_amenities = []
                if amenities_str:
                    amenities_lower = str(amenities_str).lower()
                    for key, amenity_name in amenity_mapping.items():
                        if key in amenities_lower:
                            found_amenities.append(amenity_name)
                
                # Add some default amenities if none found
                if not found_amenities:
                    found_amenities = ['WiFi', 'Parking']
                
                # Insert amenities
                for amenity_name in found_amenities[:10]:  # Limit to 10 amenities
                    cursor.execute("""
                        INSERT INTO hotel_amenities (hotel_id, amenity_name, is_free)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE amenity_name = amenity_name
                    """, (hotel_id, amenity_name, True))
                
                # Create hotel rooms based on room types in data
                room_types_data = []
                if 'room_type' in hotel_data and hotel_data['room_type']:
                    room_type_str = str(hotel_data['room_type']).lower()
                    if 'single' in room_type_str or 'standard' in room_type_str:
                        room_types_data.append(('single', 1, 1.0))
                    if 'double' in room_type_str or 'deluxe' in room_type_str:
                        room_types_data.append(('double', 2, 1.3))
                    if 'suite' in room_type_str or 'executive' in room_type_str:
                        room_types_data.append(('suite', 4, 2.0))
                
                # Default room types if none found
                if not room_types_data:
                    room_types_data = [
                        ('single', 1, 1.0),
                        ('double', 2, 1.3),
                        ('suite', 4, 2.0)
                    ]
                
                for room_type, max_guests, price_multiplier in room_types_data:
                    rooms_per_type = max(5, total_rooms // len(room_types_data))
                    available_rooms = random.randint(1, rooms_per_type)
                    
                    cursor.execute("""
                        INSERT INTO hotel_rooms (
                            hotel_id, room_type, price_per_night, max_guests,
                            total_rooms, available_rooms
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        hotel_id,
                        room_type,
                        round(price * price_multiplier, 2),
                        max_guests,
                        rooms_per_type,
                        available_rooms
                    ))
                
                count += 1
                
                if count % 50 == 0:
                    conn.commit()
                    print(f"  ✅ Processed {count} hotels...")
                    
            except Exception as e:
                print(f"⚠️  Error inserting hotel {hotel_data.get('name', 'Unknown')}: {e}")
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Inserted {count} hotels into booking database")
        return count
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 0

def populate_cars():
    """Populate cars table using the dedicated cars dataset script"""
    try:
        # Import and call the dedicated cars population script
        import subprocess
        import sys
        
        script_path = Path(__file__).parent / "populate_cars_from_datasets.py"
        if script_path.exists():
            print("🚗 Using populate_cars_from_datasets.py for car data...")
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True
            )
            # Print output
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr)
            
            # Try to extract count from output
            output_lines = result.stdout.split('\n')
            for line in output_lines:
                if 'Inserted' in line and 'cars' in line:
                    try:
                        count_str = line.split('Inserted')[1].split('cars')[0].strip()
                        return int(count_str)
                    except:
                        pass
            
            return 0
        else:
            # Fallback to basic car data if script doesn't exist
            print("⚠️  populate_cars_from_datasets.py not found, using basic car data...")
            return populate_cars_basic()
    except Exception as e:
        print(f"⚠️  Error calling cars script: {e}")
        print("   Falling back to basic car data...")
        return populate_cars_basic()

def populate_cars_basic():
    """Basic car population (fallback)"""
    try:
        car_companies = ['Enterprise', 'Hertz', 'Avis', 'Budget', 'National', 'Alamo', 'Thrifty']
        car_types = ['sedan', 'suv', 'compact', 'luxury', 'van']
        car_models = {
            'sedan': ['Toyota Camry', 'Honda Accord', 'Nissan Altima', 'Ford Fusion'],
            'suv': ['Toyota RAV4', 'Honda CR-V', 'Ford Explorer', 'Jeep Grand Cherokee'],
            'compact': ['Toyota Corolla', 'Honda Civic', 'Nissan Sentra', 'Hyundai Elantra'],
            'luxury': ['BMW 5 Series', 'Mercedes E-Class', 'Audi A6', 'Lexus ES'],
            'van': ['Chrysler Pacifica', 'Honda Odyssey', 'Toyota Sienna', 'Ford Transit']
        }
        locations = ['Airport', 'Downtown', 'City Center', 'Hotel District', 'Shopping Mall']
        cities = ['New York', 'Los Angeles', 'Miami', 'Chicago', 'San Francisco', 'Seattle', 'Boston', 'Tokyo', 'London', 'Paris']
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        count = 0
        car_num = 1
        
        for city in cities:
            for car_type in car_types:
                for _ in range(3):  # 3 cars per type per city
                    try:
                        company = random.choice(car_companies)
                        model = random.choice(car_models[car_type])
                        car_id = generate_car_id(company, car_num)
                        car_num += 1
                        
                        # Check if exists
                        cursor.execute("SELECT car_id FROM cars WHERE car_id = %s", (car_id,))
                        if cursor.fetchone():
                            continue
                        
                        daily_rate = random.uniform(30, 200) if car_type != 'luxury' else random.uniform(150, 400)
                        location = f"{city} {random.choice(locations)}"
                        
                        cursor.execute("""
                            INSERT INTO cars (
                                car_id, car_type, company_name, model, year,
                                transmission, seats, daily_rate, location,
                                rating, reviews_count, available
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            car_id, car_type, company, model,
                            random.randint(2020, 2024),
                            'automatic',
                            random.randint(4, 8),
                            round(daily_rate, 2),
                            location,
                            round(random.uniform(3.5, 5.0), 2),
                            random.randint(10, 300),
                            True
                        ))
                        count += 1
                    except Exception as e:
                        continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Inserted {count} cars into booking database")
        return count
        
    except Error as e:
        print(f"❌ Database error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0

def main():
    print("🚀 Populating booking database with CSV data...\n")
    
    # Test connection
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.close()
        print("✅ Database connection successful\n")
    except Error as e:
        print(f"❌ Cannot connect to database: {e}")
        print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"   Database: {DB_CONFIG['database']}")
        print("\n💡 Make sure MySQL is running and credentials are correct")
        return
    
    # Populate data
    flight_count = populate_flights_from_csv()
    hotel_count = populate_hotels_from_csv()
    car_count = populate_cars()
    
    # Summary
    print(f"\n✅ Population Complete!")
    print(f"   Flights: {flight_count}")
    print(f"   Hotels: {hotel_count}")
    print(f"   Cars: {car_count}")
    print(f"   Total: {flight_count + hotel_count + car_count}")
    print(f"\n🎉 Booking database is now populated and ready for bookings!")

if __name__ == "__main__":
    main()

