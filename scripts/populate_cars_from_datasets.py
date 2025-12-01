#!/usr/bin/env python3
"""
Populate cars database with realistic car rental data
Uses real car models, rental companies, and locations from airports.csv
"""

import sys
import os
from pathlib import Path
import mysql.connector
from mysql.connector import Error
import pandas as pd
import random
from datetime import datetime

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

def generate_car_id(company: str, num: int) -> str:
    """Generate car ID like CARENT001"""
    company_clean = ''.join(c for c in company if c.isalnum())[:5].upper()
    return f"CAR{company_clean}{num:04d}"

# Real car rental companies
CAR_COMPANIES = [
    'Enterprise', 'Hertz', 'Avis', 'Budget', 'National', 'Alamo', 
    'Thrifty', 'Dollar', 'Sixt', 'Europcar', 'Advantage', 'Payless'
]

# Real car models by type
CAR_MODELS = {
    'compact': [
        ('Toyota Corolla', 5, 30, 60),
        ('Honda Civic', 5, 32, 65),
        ('Nissan Sentra', 5, 30, 58),
        ('Hyundai Elantra', 5, 31, 62),
        ('Mazda 3', 5, 33, 68),
        ('Ford Focus', 5, 29, 59),
        ('Chevrolet Cruze', 5, 30, 61),
        ('Kia Forte', 5, 28, 57)
    ],
    'sedan': [
        ('Toyota Camry', 5, 45, 85),
        ('Honda Accord', 5, 47, 90),
        ('Nissan Altima', 5, 45, 88),
        ('Ford Fusion', 5, 44, 86),
        ('Chevrolet Malibu', 5, 43, 84),
        ('Hyundai Sonata', 5, 42, 82),
        ('Kia Optima', 5, 41, 80),
        ('Mazda 6', 5, 46, 89)
    ],
    'suv': [
        ('Toyota RAV4', 5, 55, 120),
        ('Honda CR-V', 5, 56, 125),
        ('Ford Explorer', 7, 65, 150),
        ('Jeep Grand Cherokee', 5, 70, 160),
        ('Nissan Rogue', 5, 54, 118),
        ('Chevrolet Equinox', 5, 53, 115),
        ('Hyundai Tucson', 5, 52, 112),
        ('Mazda CX-5', 5, 55, 122),
        ('Subaru Outback', 5, 57, 128),
        ('GMC Acadia', 7, 68, 155)
    ],
    'luxury': [
        ('BMW 5 Series', 5, 120, 250),
        ('Mercedes E-Class', 5, 125, 260),
        ('Audi A6', 5, 118, 245),
        ('Lexus ES', 5, 115, 240),
        ('Cadillac XTS', 5, 110, 235),
        ('Infiniti Q50', 5, 112, 242),
        ('Acura TLX', 5, 108, 230),
        ('Genesis G80', 5, 105, 225),
        ('BMW X5', 7, 140, 280),
        ('Mercedes GLE', 7, 145, 290)
    ],
    'van': [
        ('Chrysler Pacifica', 7, 75, 180),
        ('Honda Odyssey', 7, 73, 175),
        ('Toyota Sienna', 7, 74, 178),
        ('Ford Transit', 8, 80, 200),
        ('Dodge Grand Caravan', 7, 72, 170),
        ('Kia Carnival', 7, 71, 168),
        ('Nissan Quest', 7, 70, 165)
    ],
    'truck': [
        ('Ford F-150', 5, 85, 200),
        ('Chevrolet Silverado', 5, 88, 210),
        ('Ram 1500', 5, 87, 205),
        ('Toyota Tundra', 5, 86, 202),
        ('GMC Sierra', 5, 89, 212),
        ('Nissan Titan', 5, 84, 198)
    ]
}

# Popular rental locations
RENTAL_LOCATIONS = [
    'Airport', 'Downtown', 'City Center', 'Hotel District', 
    'Shopping Mall', 'Train Station', 'Convention Center',
    'Business District', 'Resort Area', 'Beach Area'
]

def populate_cars_from_datasets():
    """Populate cars table with realistic data using airports.csv for locations"""
    try:
        # Paths to CSV files
        data_dir = Path(__file__).parent.parent / "ai-recommendation" / "data" / "raw"
        airports_csv = data_dir / "airports.csv"
        
        print("🚗 Populating cars from real datasets...")
        print(f"📂 Data directory: {data_dir}")
        
        # Load airports data for cities/locations
        cities_data = []
        if airports_csv.exists():
            print(f"📊 Loading {airports_csv.name} for city locations...")
            try:
                df_airports = pd.read_csv(airports_csv, nrows=5000)
                print(f"   Loaded {len(df_airports)} airports")
                
                # Extract unique cities
                for _, row in df_airports.iterrows():
                    city = str(row.get('City', '') or row.get('city', '') or '').strip()
                    country = str(row.get('Country', '') or row.get('country', '') or '').strip()
                    iata = str(row.get('IATA', '') or row.get('iata', '') or '').strip()
                    
                    if city and city != 'nan' and len(city) > 2:
                        # Filter for major cities (US, major international)
                        if (country in ['United States', 'USA', 'Canada', 'United Kingdom', 'France', 
                                       'Germany', 'Italy', 'Spain', 'Japan', 'Australia', 'India'] or
                            iata in ['JFK', 'LAX', 'SFO', 'ORD', 'MIA', 'SEA', 'BOS', 'DFW', 'DEN', 'ATL',
                                    'LHR', 'CDG', 'FRA', 'NRT', 'SYD', 'BOM', 'DEL', 'BLR', 'MAA']):
                            cities_data.append({
                                'city': city,
                                'country': country,
                                'iata': iata if len(iata) == 3 else None
                            })
                
                # Remove duplicates
                seen_cities = set()
                unique_cities = []
                for city_info in cities_data:
                    city_key = city_info['city'].lower()
                    if city_key not in seen_cities:
                        seen_cities.add(city_key)
                        unique_cities.append(city_info)
                
                cities_data = unique_cities
                print(f"   ✅ Found {len(cities_data)} unique major cities")
                
            except Exception as e:
                print(f"   ⚠️  Error loading airports.csv: {e}")
                # Fallback to default cities
                cities_data = [
                    {'city': 'New York', 'country': 'United States', 'iata': 'JFK'},
                    {'city': 'Los Angeles', 'country': 'United States', 'iata': 'LAX'},
                    {'city': 'San Francisco', 'country': 'United States', 'iata': 'SFO'},
                    {'city': 'Chicago', 'country': 'United States', 'iata': 'ORD'},
                    {'city': 'Miami', 'country': 'United States', 'iata': 'MIA'},
                    {'city': 'Seattle', 'country': 'United States', 'iata': 'SEA'},
                    {'city': 'Boston', 'country': 'United States', 'iata': 'BOS'},
                    {'city': 'London', 'country': 'United Kingdom', 'iata': 'LHR'},
                    {'city': 'Paris', 'country': 'France', 'iata': 'CDG'},
                    {'city': 'Tokyo', 'country': 'Japan', 'iata': 'NRT'},
                    {'city': 'Mumbai', 'country': 'India', 'iata': 'BOM'},
                    {'city': 'Delhi', 'country': 'India', 'iata': 'DEL'},
                ]
        else:
            # Default cities if airports.csv not found
            cities_data = [
                {'city': 'New York', 'country': 'United States', 'iata': 'JFK'},
                {'city': 'Los Angeles', 'country': 'United States', 'iata': 'LAX'},
                {'city': 'San Francisco', 'country': 'United States', 'iata': 'SFO'},
                {'city': 'Chicago', 'country': 'United States', 'iata': 'ORD'},
                {'city': 'Miami', 'country': 'United States', 'iata': 'MIA'},
                {'city': 'Seattle', 'country': 'United States', 'iata': 'SEA'},
                {'city': 'Boston', 'country': 'United States', 'iata': 'BOS'},
                {'city': 'London', 'country': 'United Kingdom', 'iata': 'LHR'},
                {'city': 'Paris', 'country': 'France', 'iata': 'CDG'},
                {'city': 'Tokyo', 'country': 'Japan', 'iata': 'NRT'},
                {'city': 'Mumbai', 'country': 'India', 'iata': 'BOM'},
                {'city': 'Delhi', 'country': 'India', 'iata': 'DEL'},
            ]
        
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Clear existing cars (optional - comment out if you want to keep existing)
        # cursor.execute("DELETE FROM cars WHERE available = TRUE")
        # conn.commit()
        # print("🗑️  Cleared existing cars")
        
        count = 0
        car_num = 1
        
        print(f"\n🚗 Processing cars for {len(cities_data)} cities...")
        
        # Create cars for each city
        for city_info in cities_data:
            city = city_info['city']
            
            # Determine how many cars per city (more for major cities)
            if city_info.get('iata') in ['JFK', 'LAX', 'SFO', 'ORD', 'MIA', 'LHR', 'CDG', 'NRT']:
                cars_per_city = 25  # Major hubs get more cars
            elif city_info.get('iata') in ['SEA', 'BOS', 'DFW', 'DEN', 'ATL', 'BOM', 'DEL']:
                cars_per_city = 18  # Secondary hubs
            else:
                cars_per_city = 12  # Other cities
            
            # Distribute cars across types
            car_type_distribution = {
                'compact': int(cars_per_city * 0.25),  # 25%
                'sedan': int(cars_per_city * 0.30),    # 30%
                'suv': int(cars_per_city * 0.25),      # 25%
                'luxury': int(cars_per_city * 0.10),   # 10%
                'van': int(cars_per_city * 0.05),      # 5%
                'truck': int(cars_per_city * 0.05)     # 5%
            }
            
            for car_type, num_cars in car_type_distribution.items():
                for _ in range(num_cars):
                    try:
                        # Select random company
                        company = random.choice(CAR_COMPANIES)
                        
                        # Select random model for this type
                        model_info = random.choice(CAR_MODELS[car_type])
                        model_name, seats, min_price, max_price = model_info
                        
                        # Generate car ID
                        car_id = generate_car_id(company, car_num)
                        car_num += 1
                        
                        # Check if exists
                        cursor.execute("SELECT car_id FROM cars WHERE car_id = %s", (car_id,))
                        if cursor.fetchone():
                            continue
                        
                        # Generate daily rate (with some variation)
                        daily_rate = random.uniform(min_price, max_price)
                        
                        # Add premium for luxury cars
                        if car_type == 'luxury':
                            daily_rate *= random.uniform(1.0, 1.3)
                        
                        # Select location
                        location_type = random.choice(RENTAL_LOCATIONS)
                        if city_info.get('iata'):
                            # Use airport code if available
                            location = f"{city} {location_type} ({city_info['iata']})"
                        else:
                            location = f"{city} {location_type}"
                        
                        # Determine transmission (mostly automatic, some manual)
                        transmission = 'automatic' if random.random() < 0.9 else 'manual'
                        
                        # Generate year (2020-2024)
                        year = random.randint(2020, 2024)
                        
                        # Generate rating (3.5 to 5.0)
                        rating = round(random.uniform(3.5, 5.0), 2)
                        
                        # Generate reviews count
                        reviews_count = random.randint(10, 500)
                        
                        # Insert car
                        cursor.execute("""
                            INSERT INTO cars (
                                car_id, car_type, company_name, model, year,
                                transmission, seats, daily_rate, location,
                                rating, reviews_count, available
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            car_id, car_type, company, model_name, year,
                            transmission, seats, round(daily_rate, 2), location,
                            rating, reviews_count, True
                        ))
                        count += 1
                        
                        if count % 50 == 0:
                            conn.commit()
                            print(f"  ✅ Processed {count} cars...")
                            
                    except Exception as e:
                        print(f"Error inserting car: {e}")
                        continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\n✅ Inserted {count} cars into booking database")
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
    populate_cars_from_datasets()

