"""CSV processor for Kaggle datasets"""
import csv
import pandas as pd
from typing import Dict, Any, List, Iterator
from pathlib import Path
import os


class CSVProcessor:
    """Processes CSV files from Kaggle datasets"""
    
    @staticmethod
    def read_csv_file(file_path: str) -> pd.DataFrame:
        """Read CSV file into pandas DataFrame"""
        try:
            return pd.read_csv(file_path)
        except Exception as e:
            print(f"Error reading CSV file {file_path}: {e}")
            raise
    
    @staticmethod
    def normalize_airbnb_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Inside Airbnb dataset data (NYC)
        
        Handles the Inside Airbnb NYC dataset schema:
        - Primary dataset: dominoweir/inside-airbnb-nyc
        - Alternative: ahmedmagdee/inside-airbnb
        
        Key fields:
        - id: Listing ID
        - name: Listing name
        - price: Nightly price (may need cleaning - remove $ and commas)
        - neighbourhood_group_cleansed: Borough (Manhattan, Brooklyn, etc.)
        - neighbourhood_cleansed: Specific neighborhood
        - room_type: Entire home/apt, Private room, Shared room
        - amenities: JSON string of amenities
        - review_scores_rating: Rating 0-100
        - availability_365: Days available per year
        - minimum_nights: Minimum stay requirement
        """
        for _, row in df.iterrows():
            # Clean price - handle $ and commas
            price_str = str(row.get("price", "0"))
            price_str = price_str.replace("$", "").replace(",", "").strip()
            try:
                price = float(price_str) if price_str else 0
            except (ValueError, TypeError):
                price = 0
            
            # Skip if price is 0 or invalid
            if price <= 0:
                continue
            
            # Get neighborhood (prefer specific, fallback to group)
            city = row.get("neighbourhood_cleansed") or row.get("neighbourhood_group_cleansed") or "NYC"
            
            # Get address
            address = row.get("street") or ""
            if not address:
                # Try to construct from neighborhood
                address = f"{city}, New York, NY"
            
            # Parse amenities
            amenities_str = str(row.get("amenities", ""))
            # Remove brackets and quotes if it's a JSON-like string
            if amenities_str.startswith("[") or amenities_str.startswith("{"):
                amenities_str = amenities_str.strip("[]{}").replace('"', '').replace("'", "")
            
            # Get rating (0-100 scale, convert to 0-5 for display)
            rating_raw = row.get("review_scores_rating", 0)
            rating = float(rating_raw) / 20 if pd.notna(rating_raw) and float(rating_raw) > 0 else None
            
            # Determine availability
            availability_365 = int(row.get("availability_365", 0)) if pd.notna(row.get("availability_365")) else 0
            available_rooms = 1 if availability_365 > 0 else 0
            
            yield {
                "type": "hotel",
                "name": str(row.get("name", "Unknown Listing"))[:200],  # Limit length
                "city": str(city),
                "state": "NY",
                "country": "USA",
                "address": address[:200],
                "price_per_night": price,
                "original_price": price,  # Will be compared with historical average
                "available_rooms": available_rooms,
                "rating": rating,
                "amenities": amenities_str,
                "latitude": float(row.get("latitude", 0)) if pd.notna(row.get("latitude")) else 0,
                "longitude": float(row.get("longitude", 0)) if pd.notna(row.get("longitude")) else 0,
                "listing_id": str(row.get("id", "")),
                "hotel_id": str(row.get("id", "")),  # For compatibility
                "room_type": str(row.get("room_type", "Unknown")),
                "minimum_nights": int(row.get("minimum_nights", 1)) if pd.notna(row.get("minimum_nights")) else 1,
                "availability_365": availability_365,
                "source": "inside_airbnb_nyc"
            }
    
    @staticmethod
    def normalize_hotel_booking_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Hotel Booking Demand dataset
        Dataset: https://www.kaggle.com/datasets/mojtaba142/hotel-booking
        
        Key fields:
        - hotel: Hotel type (City Hotel, Resort Hotel)
        - country: Country code
        - adr: Average daily rate (price per night)
        - arrival_date: Check-in date
        - adults, children: Guest counts
        - availability: Room availability
        - is_canceled: Cancellation status
        """
        for _, row in df.iterrows():
            # Skip canceled bookings
            if pd.notna(row.get("is_canceled")) and bool(row.get("is_canceled")):
                continue
            
            # Get price (ADR - Average Daily Rate)
            adr = row.get("adr", 0)
            if pd.isna(adr) or float(adr) <= 0:
                continue
            
            price = float(adr)
            
            # Get hotel name/type
            hotel_type = str(row.get("hotel", "Unknown"))
            country = str(row.get("country", "Unknown"))
            
            # Try to get city from dataset (may have city column)
            city = str(row.get("city", "")) or str(row.get("hotel", ""))
            
            # Get availability
            availability = int(row.get("availability", 0)) if pd.notna(row.get("availability")) else 0
            
            yield {
                "type": "hotel",
                "name": f"{hotel_type} - {country}",
                "city": city,
                "country": country,
                "state": None,  # Hotel booking dataset may not have state
                "address": f"{city}, {country}",
                "price_per_night": price,
                "original_price": price,  # Will be compared with historical average
                "available_rooms": max(1, availability) if availability > 0 else 1,
                "check_in": str(row.get("arrival_date", "")),
                "check_out": str(row.get("arrival_date", "")),  # Simplified - would need departure date
                "adults": int(row.get("adults", 1)) if pd.notna(row.get("adults")) else 1,
                "children": int(row.get("children", 0)) if pd.notna(row.get("children")) else 0,
                "is_canceled": False,  # We skip canceled ones
                "rating": None,  # Hotel booking dataset may not have ratings
                "source": "hotel_booking_demand"
            }
    
    @staticmethod
    def normalize_expedia_hotel_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Expedia Hotel Recommendations dataset
        Competition: https://www.kaggle.com/competitions/expedia-hotel-recommendations
        
        Key fields (may vary by competition data):
        - hotel_id: Hotel identifier
        - srch_destination_id: Search destination ID
        - prop_country_id: Property country ID
        - prop_starrating: Star rating
        - prop_review_score: Review score
        - price_usd: Price in USD
        - orig_destination_distance: Distance from origin
        - user_location_country: User location country
        - is_booking: Whether it was booked
        - srch_ci, srch_co: Check-in/check-out dates
        """
        for _, row in df.iterrows():
            # Get price
            price = row.get("price_usd", 0) or row.get("price", 0)
            if pd.isna(price) or float(price) <= 0:
                continue
            
            price = float(price)
            
            # Get hotel info
            hotel_id = str(row.get("hotel_id", "") or row.get("prop_id", ""))
            star_rating = float(row.get("prop_starrating", 0)) if pd.notna(row.get("prop_starrating")) else None
            review_score = float(row.get("prop_review_score", 0)) if pd.notna(row.get("prop_review_score")) else None
            
            # Get location info
            country_id = str(row.get("prop_country_id", "") or row.get("country", ""))
            destination_id = str(row.get("srch_destination_id", ""))
            
            # Get dates
            check_in = str(row.get("srch_ci", "") or row.get("check_in", ""))
            check_out = str(row.get("srch_co", "") or row.get("check_out", ""))
            
            # Determine if booking was made
            is_booking = bool(row.get("is_booking", 0)) if pd.notna(row.get("is_booking")) else False
            
            yield {
                "type": "hotel",
                "name": f"Hotel {hotel_id}",
                "hotel_id": hotel_id,
                "city": f"Destination {destination_id}",  # May need mapping
                "country": country_id,
                "state": None,
                "address": f"Country {country_id}",
                "price_per_night": price,
                "original_price": price,
                "available_rooms": 1 if is_booking else 5,  # Estimate based on booking status
                "rating": review_score / 20 if review_score else star_rating / 5 if star_rating else None,
                "star_rating": star_rating,
                "check_in": check_in,
                "check_out": check_out,
                "destination_id": destination_id,
                "is_booking": is_booking,
                "source": "expedia_hotel_recommendations"
            }
    
    @staticmethod
    def normalize_flight_price_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Flight Price Prediction dataset
        Dataset: https://www.kaggle.com/datasets/shubhambathwal/flight-price-prediction
        
        Key fields:
        - airline: Airline name
        - source_city: Origin city
        - destination_city: Destination city
        - dep_time: Departure time
        - arrival_time: Arrival time
        - price: Flight price
        - duration: Flight duration in hours
        - stops: Number of stops
        - class: Flight class (Economy, Business)
        - days_left: Days until departure
        """
        for _, row in df.iterrows():
            # Get price
            price = row.get("price", 0)
            if pd.isna(price) or float(price) <= 0:
                continue
            
            price = float(price)
            
            # Get flight details
            airline = str(row.get("airline", "Unknown"))
            flight_number = str(row.get("flight", "")) or f"{airline}_{row.get('source_city', '')}_{row.get('destination_city', '')}"
            origin = str(row.get("source_city", ""))
            destination = str(row.get("destination_city", ""))
            
            # Parse times (may be in various formats)
            dep_time = str(row.get("dep_time", ""))
            arr_time = str(row.get("arrival_time", ""))
            
            # Get other details
            stops = int(row.get("stops", 0)) if pd.notna(row.get("stops")) else 0
            flight_class = str(row.get("class", "Economy"))
            duration = float(row.get("duration", 0)) if pd.notna(row.get("duration")) else 0
            days_left = int(row.get("days_left", 0)) if pd.notna(row.get("days_left")) else 0
            
            # Estimate available seats based on days_left (more seats available further in advance)
            if days_left > 30:
                available_seats = 20
            elif days_left > 7:
                available_seats = 10
            else:
                available_seats = 5
            
            yield {
                "type": "flight",
                "airline": airline,
                "flight_number": flight_number,
                "origin": origin,
                "destination": destination,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "price": price,
                "original_price": price,  # Will be compared with historical average
                "stops": stops,
                "class": flight_class,
                "duration": duration,
                "days_left": days_left,
                "available_seats": available_seats,
                "source": "flight_price_prediction"
            }
    
    @staticmethod
    def normalize_flightprices_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Flight Prices dataset (dilwong/flightprices)
        Dataset: https://www.kaggle.com/datasets/dilwong/flightprices
        
        This dataset may have different schema than flight_price_prediction
        """
        for _, row in df.iterrows():
            # Get price
            price = row.get("price", 0) or row.get("Price", 0) or row.get("fare", 0)
            if pd.isna(price) or float(price) <= 0:
                continue
            
            price = float(price)
            
            # Get flight details - try multiple possible column names
            airline = str(row.get("airline", "") or row.get("Airline", "") or row.get("carrier", "") or "Unknown")
            flight_number = str(row.get("flight_number", "") or row.get("Flight", "") or row.get("flight", "") or "")
            
            # Origin and destination - try multiple column names
            origin = str(row.get("origin", "") or row.get("Origin", "") or row.get("from", "") or row.get("departure", "") or "")
            destination = str(row.get("destination", "") or row.get("Destination", "") or row.get("to", "") or row.get("arrival", "") or "")
            
            # Times
            dep_time = str(row.get("departure_time", "") or row.get("dep_time", "") or row.get("Departure", "") or "")
            arr_time = str(row.get("arrival_time", "") or row.get("arr_time", "") or row.get("Arrival", "") or "")
            
            # Other details
            stops = int(row.get("stops", 0) or row.get("Stops", 0) or 0) if pd.notna(row.get("stops", 0) or row.get("Stops", 0)) else 0
            flight_class = str(row.get("class", "") or row.get("Class", "") or row.get("cabin", "") or "Economy")
            duration = float(row.get("duration", 0) or row.get("Duration", 0) or 0) if pd.notna(row.get("duration", 0) or row.get("Duration", 0)) else 0
            
            # Generate flight number if missing
            if not flight_number:
                flight_number = f"{airline}_{origin}_{destination}"
            
            # Estimate available seats
            available_seats = 10  # Default
            
            yield {
                "type": "flight",
                "airline": airline,
                "flight_number": flight_number,
                "origin": origin.upper() if origin else "",
                "destination": destination.upper() if destination else "",
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "price": price,
                "original_price": price,
                "stops": stops,
                "class": flight_class,
                "duration": duration,
                "available_seats": available_seats,
                "source": "flightprices_dilwong"
            }
    
    @staticmethod
    def normalize_airlines_routes_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """
        Normalize Airlines, Airport and Routes dataset
        Dataset: https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes
        
        This dataset contains route information that can be used to:
        - Validate flight routes
        - Find available routes between airports
        - Get airline information
        - Map airport codes to cities
        
        Key fields:
        - airline: Airline name or code
        - airline_id: Airline ID
        - source_airport: Origin airport code
        - destination_airport: Destination airport code
        - source_airport_id: Origin airport ID
        - destination_airport_id: Destination airport ID
        - codeshare: Whether route is codeshare
        - stops: Number of stops
        - equipment: Aircraft type
        """
        for _, row in df.iterrows():
            # Get route information
            airline = str(row.get("airline", "") or row.get("airline_name", "") or row.get("airline_code", "") or "Unknown")
            airline_id = str(row.get("airline_id", ""))
            origin = str(row.get("source_airport", "") or row.get("from", "") or row.get("origin", "") or "").upper()
            destination = str(row.get("destination_airport", "") or row.get("to", "") or row.get("destination", "") or "").upper()
            
            # Skip if missing origin or destination
            if not origin or not destination:
                continue
            
            # Get route details
            stops = int(row.get("stops", 0)) if pd.notna(row.get("stops")) else 0
            codeshare = bool(row.get("codeshare", False)) if pd.notna(row.get("codeshare")) else False
            equipment = str(row.get("equipment", "") or row.get("aircraft", "") or "")
            
            # This is route data, not pricing data, so we create a route record
            # Routes can be used to validate flight availability and find connections
            yield {
                "type": "route",
                "airline": airline,
                "airline_id": airline_id,
                "origin": origin,
                "destination": destination,
                "stops": stops,
                "codeshare": codeshare,
                "equipment": equipment,
                "source": "airlines_airport_routes"
            }
    
    @staticmethod
    def process_dataset(file_path: str, dataset_type: str) -> Iterator[Dict[str, Any]]:
        """Process a dataset file and return normalized records"""
        df = CSVProcessor.read_csv_file(file_path)
        
        if dataset_type == "airbnb":
            return CSVProcessor.normalize_airbnb_data(df)
        elif dataset_type == "hotel_booking":
            return CSVProcessor.normalize_hotel_booking_data(df)
        elif dataset_type == "flight_price":
            return CSVProcessor.normalize_flight_price_data(df)
        elif dataset_type == "flightprices":
            return CSVProcessor.normalize_flightprices_data(df)
        elif dataset_type == "expedia_hotel":
            return CSVProcessor.normalize_expedia_hotel_data(df)
        elif dataset_type == "airlines_routes":
            return CSVProcessor.normalize_airlines_routes_data(df)
        else:
            raise ValueError(f"Unknown dataset type: {dataset_type}")
