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
        """Normalize Inside Airbnb dataset data"""
        for _, row in df.iterrows():
            yield {
                "type": "hotel",
                "name": row.get("name", ""),
                "city": row.get("neighbourhood_group_cleansed", "NYC"),
                "state": "NY",
                "country": "USA",
                "address": row.get("street", ""),
                "price_per_night": float(row.get("price", 0)) if pd.notna(row.get("price")) else 0,
                "original_price": float(row.get("price", 0)) if pd.notna(row.get("price")) else 0,
                "available_rooms": 1 if row.get("availability_365", 0) > 0 else 0,
                "rating": float(row.get("review_scores_rating", 0)) if pd.notna(row.get("review_scores_rating")) else 0,
                "amenities": str(row.get("amenities", "")),
                "latitude": float(row.get("latitude", 0)) if pd.notna(row.get("latitude")) else 0,
                "longitude": float(row.get("longitude", 0)) if pd.notna(row.get("longitude")) else 0,
                "listing_id": str(row.get("id", "")),
                "room_type": str(row.get("room_type", "")),
                "minimum_nights": int(row.get("minimum_nights", 1)) if pd.notna(row.get("minimum_nights")) else 1,
                "source": "inside_airbnb"
            }
    
    @staticmethod
    def normalize_hotel_booking_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """Normalize Hotel Booking Demand dataset"""
        for _, row in df.iterrows():
            yield {
                "type": "hotel",
                "name": f"Hotel_{row.get('hotel', 'Unknown')}",
                "city": str(row.get("hotel", "")),
                "country": str(row.get("country", "")),
                "price_per_night": float(row.get("adr", 0)) if pd.notna(row.get("adr")) else 0,
                "original_price": float(row.get("adr", 0)) if pd.notna(row.get("adr")) else 0,
                "available_rooms": int(row.get("availability", 0)) if pd.notna(row.get("availability")) else 0,
                "check_in": str(row.get("arrival_date", "")),
                "check_out": str(row.get("arrival_date", "")),  # Simplified
                "adults": int(row.get("adults", 1)) if pd.notna(row.get("adults")) else 1,
                "children": int(row.get("children", 0)) if pd.notna(row.get("children")) else 0,
                "is_canceled": bool(row.get("is_canceled", False)),
                "source": "hotel_booking_demand"
            }
    
    @staticmethod
    def normalize_flight_price_data(df: pd.DataFrame) -> Iterator[Dict[str, Any]]:
        """Normalize Flight Price Prediction dataset"""
        for _, row in df.iterrows():
            yield {
                "type": "flight",
                "airline": str(row.get("airline", "Unknown")),
                "flight_number": str(row.get("flight", "")),
                "origin": str(row.get("source_city", "")),
                "destination": str(row.get("destination_city", "")),
                "departure_time": str(row.get("dep_time", "")),
                "arrival_time": str(row.get("arrival_time", "")),
                "price": float(row.get("price", 0)) if pd.notna(row.get("price")) else 0,
                "original_price": float(row.get("price", 0)) if pd.notna(row.get("price")) else 0,
                "stops": int(row.get("stops", 0)) if pd.notna(row.get("stops")) else 0,
                "class": str(row.get("class", "Economy")),
                "duration": float(row.get("duration", 0)) if pd.notna(row.get("duration")) else 0,
                "days_left": int(row.get("days_left", 0)) if pd.notna(row.get("days_left")) else 0,
                "available_seats": 10,  # Default
                "source": "flight_price_prediction"
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
        else:
            raise ValueError(f"Unknown dataset type: {dataset_type}")

