"""Airport Mapper - Maps airport codes to cities and locations using Global Airports dataset"""
from typing import Dict, Optional, List
from pathlib import Path
import pandas as pd
import os


class AirportMapper:
    """
    Maps airport codes (IATA/ICAO) to cities and locations
    
    Uses Global Airports dataset:
    https://www.kaggle.com/datasets/samvelkoch/global-airports-iata-icao-timezone-geo
    """
    
    def __init__(self, airports_csv_path: Optional[str] = None):
        """
        Initialize airport mapper
        
        Args:
            airports_csv_path: Path to global airports CSV file
        """
        self.airports: Dict[str, Dict[str, any]] = {}
        self.city_to_airports: Dict[str, List[str]] = {}
        
        if airports_csv_path:
            self.load_airports(airports_csv_path)
        else:
            # Try to find in default location
            default_path = Path(__file__).parent.parent.parent / "data" / "raw" / "global_airports.csv"
            if default_path.exists():
                self.load_airports(str(default_path))
            else:
                # Load default airport codes
                self._load_default_airports()
    
    def load_airports(self, csv_path: str):
        """Load airports from CSV file"""
        try:
            df = pd.read_csv(csv_path)
            
            for _, row in df.iterrows():
                iata = str(row.get("iata", "")).strip().upper()
                icao = str(row.get("icao", "")).strip().upper()
                city = str(row.get("city", "")).strip()
                country = str(row.get("country", "")).strip()
                latitude = float(row.get("latitude", 0)) if pd.notna(row.get("latitude")) else 0
                longitude = float(row.get("longitude", 0)) if pd.notna(row.get("longitude")) else 0
                timezone = str(row.get("timezone", "")).strip()
                
                airport_info = {
                    "iata": iata,
                    "icao": icao,
                    "city": city,
                    "country": country,
                    "latitude": latitude,
                    "longitude": longitude,
                    "timezone": timezone
                }
                
                # Index by IATA code
                if iata and len(iata) == 3:
                    self.airports[iata] = airport_info
                
                # Index by ICAO code
                if icao and len(icao) == 4:
                    self.airports[icao] = airport_info
                
                # Index by city
                if city:
                    city_key = city.lower()
                    if city_key not in self.city_to_airports:
                        self.city_to_airports[city_key] = []
                    if iata and iata not in self.city_to_airports[city_key]:
                        self.city_to_airports[city_key].append(iata)
            
            print(f"[AirportMapper] Loaded {len(self.airports)} airports")
        except Exception as e:
            print(f"[AirportMapper] Error loading airports: {e}")
            self._load_default_airports()
    
    def _load_default_airports(self):
        """Load default airport codes (fallback if CSV not available)"""
        default_airports = {
            "SFO": {"city": "San Francisco", "country": "USA", "iata": "SFO"},
            "LAX": {"city": "Los Angeles", "country": "USA", "iata": "LAX"},
            "JFK": {"city": "New York", "country": "USA", "iata": "JFK"},
            "LGA": {"city": "New York", "country": "USA", "iata": "LGA"},
            "EWR": {"city": "Newark", "country": "USA", "iata": "EWR"},
            "ORD": {"city": "Chicago", "country": "USA", "iata": "ORD"},
            "DFW": {"city": "Dallas", "country": "USA", "iata": "DFW"},
            "ATL": {"city": "Atlanta", "country": "USA", "iata": "ATL"},
            "DEN": {"city": "Denver", "country": "USA", "iata": "DEN"},
            "SEA": {"city": "Seattle", "country": "USA", "iata": "SEA"},
            "LAS": {"city": "Las Vegas", "country": "USA", "iata": "LAS"},
            "MCO": {"city": "Orlando", "country": "USA", "iata": "MCO"},
            "PHX": {"city": "Phoenix", "country": "USA", "iata": "PHX"},
            "MIA": {"city": "Miami", "country": "USA", "iata": "MIA"},
        }
        
        for code, info in default_airports.items():
            self.airports[code] = info
            city_key = info["city"].lower()
            if city_key not in self.city_to_airports:
                self.city_to_airports[city_key] = []
            self.city_to_airports[city_key].append(code)
        
        print(f"[AirportMapper] Loaded {len(self.airports)} default airports")
    
    def get_airport_info(self, code: str) -> Optional[Dict[str, any]]:
        """Get airport information by IATA or ICAO code"""
        code_upper = code.strip().upper()
        return self.airports.get(code_upper)
    
    def get_city_from_code(self, code: str) -> Optional[str]:
        """Get city name from airport code"""
        info = self.get_airport_info(code)
        return info.get("city") if info else None
    
    def get_airports_in_city(self, city: str) -> List[str]:
        """Get list of airport codes in a city"""
        city_key = city.lower().strip()
        return self.city_to_airports.get(city_key, [])
    
    def normalize_origin_destination(
        self,
        origin: Optional[str],
        destination: Optional[str]
    ) -> Dict[str, Optional[str]]:
        """
        Normalize origin and destination to airport codes or cities
        
        Returns:
            {
                "origin": normalized origin (airport code or city),
                "destination": normalized destination (airport code or city),
                "origin_city": city name if origin is airport code,
                "destination_city": city name if destination is airport code
            }
        """
        result = {
            "origin": origin,
            "destination": destination,
            "origin_city": None,
            "destination_city": None
        }
        
        # Normalize origin
        if origin:
            origin_upper = origin.strip().upper()
            # Check if it's an airport code
            if len(origin_upper) == 3 and origin_upper in self.airports:
                result["origin"] = origin_upper
                result["origin_city"] = self.airports[origin_upper].get("city")
            else:
                # Check if city name matches an airport
                airports = self.get_airports_in_city(origin)
                if airports:
                    result["origin"] = airports[0]  # Use first airport
                    result["origin_city"] = origin
        
        # Normalize destination
        if destination:
            dest_upper = destination.strip().upper()
            # Check if it's an airport code
            if len(dest_upper) == 3 and dest_upper in self.airports:
                result["destination"] = dest_upper
                result["destination_city"] = self.airports[dest_upper].get("city")
            else:
                # Check if city name matches an airport
                airports = self.get_airports_in_city(destination)
                if airports:
                    result["destination"] = airports[0]  # Use first airport
                    result["destination_city"] = destination
        
        return result

