"""CSV Query Service - Query indexed CSV data for AI agent"""
# MySQL only - no SQLite support
from typing import Dict, Any, List, Optional
from pathlib import Path
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class CSVQueryService:
    """
    Service for querying indexed CSV data.
    Used by the AI agent to fetch accurate information from datasets.
    """
    
    def __init__(self, index_db_path: Optional[str] = None):
        """
        Initialize CSV query service
        
        Args:
            index_db_path: Deprecated - MySQL is the only option
        """
        # MySQL is the only database option
        # Initialize connection
        self.engine = None
        self.Session = None
        self._connect()
    
    def _connect(self):
        """Connect to MySQL CSV index database"""
        # Use MySQL - construct connection string from environment variables
        mysql_host = os.getenv("MYSQL_HOST", "localhost")
        mysql_port = os.getenv("MYSQL_PORT", "3307")
        mysql_user = os.getenv("MYSQL_USER", "root")
        mysql_password = os.getenv("MYSQL_PASSWORD", "password")
        mysql_database = os.getenv("MYSQL_DATABASE", "kayak")
        
        # Use same database name pattern as indexer
        csv_db_name = os.getenv("CSV_INDEX_DB_NAME", f"{mysql_database}_csv_index")
        
        # First, ensure database exists
        admin_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/"
        admin_engine = create_engine(admin_url, echo=False)
        with admin_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {csv_db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
        admin_engine.dispose()
        
        # Now connect to the CSV index database
        database_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{csv_db_name}"
        
        try:
            self.engine = create_engine(
                database_url,
                echo=False,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            self.Session = sessionmaker(bind=self.engine)
            print(f"✅ Connected to MySQL CSV index: {csv_db_name}")
        except Exception as e:
            print(f"❌ Failed to connect to MySQL CSV index: {e}")
            self.engine = None
            self.Session = None
    
    def _execute_query(self, query: str, params: List[Any] = None) -> List[Any]:
        """
        Execute query and return results using MySQL
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            List of result rows as dictionaries
        """
        if not self.engine or not self.Session:
            return []
        
        # Convert SQLite placeholders (?) to MySQL placeholders (%s)
        if params:
            query = query.replace("?", "%s")
        
        with self.Session() as session:
            result = session.execute(text(query), params or [])
            # Convert result to list of dicts
            columns = result.keys()
            return [dict(zip(columns, row)) for row in result.fetchall()]
    
    def search_hotels(
        self,
        city: Optional[str] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for hotels matching criteria
        
        Args:
            city: City name
            max_price: Maximum price per night
            min_rating: Minimum rating (0-5)
            limit: Maximum number of results
        
        Returns:
            List of hotel records
        """
        if not self.index_db:
            return []
        
        query = "SELECT * FROM hotels WHERE 1=1"
        params = []
        
        if city:
            # Map airport codes to city names
            airport_to_city = {
                'DEL': 'Delhi', 'BOM': 'Mumbai', 'NRT': 'Tokyo', 'HND': 'Tokyo',
                'JFK': 'New York', 'LGA': 'New York', 'EWR': 'New York', 'NYC': 'New York',
                'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'MIA': 'Miami',
                'ORD': 'Chicago', 'LHR': 'London', 'CDG': 'Paris'
            }
            
            # If city is an airport code, convert to city name
            search_city = city
            if len(city) == 3 and city.upper() in airport_to_city:
                search_city = airport_to_city[city.upper()]
            elif city.upper() in airport_to_city:
                search_city = airport_to_city[city.upper()]
            
            query += " AND (city LIKE ? OR city LIKE ? OR city LIKE ?)"
            params.extend([f"%{search_city}%", f"%{search_city.title()}%", f"%{search_city.upper()}%"])
        
        if max_price:
            query += " AND price_per_night <= ?"
            params.append(max_price)
        
        if min_rating:
            query += " AND rating >= ?"
            params.append(min_rating)
        
        query += " ORDER BY price_per_night ASC LIMIT ?"
        params.append(limit)
        
        return self._execute_query(query, params)
    
    def search_flights(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        max_price: Optional[float] = None,
        airline: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for flights matching criteria
        
        Args:
            origin: Origin airport code or city
            destination: Destination airport code or city
            max_price: Maximum price
            airline: Airline name
            limit: Maximum number of results
        
        Returns:
            List of flight records
        """
        if not self.index_db:
            return []
        
        query = "SELECT * FROM flights WHERE 1=1"
        params = []
        
        if origin:
            # Map city names to airport codes and vice versa
            city_to_code = {
                'mumbai': ['BOM', 'MUMBAI', 'BOMBAY'], 'bombay': ['BOM', 'MUMBAI', 'BOMBAY'],
                'delhi': ['DEL', 'DELHI'], 'tokyo': ['NRT', 'HND', 'TOKYO'],
                'new york': ['JFK', 'LGA', 'EWR', 'NEW YORK', 'NYC'],
                'los angeles': ['LAX', 'LOS ANGELES'], 'san francisco': ['SFO', 'SAN FRANCISCO'],
                'miami': ['MIA', 'MIAMI']
            }
            
            origin_upper = origin.upper()
            origin_terms = [origin_upper, origin.title(), origin]
            
            # Add airport code mappings
            for city, codes in city_to_code.items():
                if city in origin.lower():
                    origin_terms.extend(codes)
            
            # Also add if origin is already a code
            code_to_city = {
                'BOM': ['MUMBAI', 'BOMBAY'], 'DEL': ['DELHI'],
                'NRT': ['TOKYO'], 'JFK': ['NEW YORK', 'NYC'],
                'LAX': ['LOS ANGELES'], 'SFO': ['SAN FRANCISCO'], 'MIA': ['MIAMI']
            }
            if origin_upper in code_to_city:
                origin_terms.extend(code_to_city[origin_upper])
            
            # Remove duplicates
            origin_terms = list(set(origin_terms))
            
            # Search by any matching term (code or city name)
            origin_conditions = " OR ".join(["(origin = ? OR origin LIKE ? OR origin_city LIKE ?)" for _ in origin_terms])
            query += f" AND ({origin_conditions})"
            for term in origin_terms:
                params.extend([term, f"%{term}%", f"%{term}%"])
        
        if destination:
            # Map city names to airport codes and vice versa
            city_to_code = {
                'mumbai': ['BOM', 'MUMBAI', 'BOMBAY'], 'bombay': ['BOM', 'MUMBAI', 'BOMBAY'],
                'delhi': ['DEL', 'DELHI'], 'tokyo': ['NRT', 'HND', 'TOKYO'],
                'new york': ['JFK', 'LGA', 'EWR', 'NEW YORK', 'NYC'],
                'los angeles': ['LAX', 'LOS ANGELES'], 'san francisco': ['SFO', 'SAN FRANCISCO'],
                'miami': ['MIA', 'MIAMI']
            }
            
            dest_upper = destination.upper()
            dest_terms = [dest_upper, destination.title(), destination]
            
            # Add airport code mappings
            for city, codes in city_to_code.items():
                if city in destination.lower():
                    dest_terms.extend(codes)
            
            # Also add if destination is already a code
            code_to_city = {
                'BOM': ['MUMBAI', 'BOMBAY'], 'DEL': ['DELHI'],
                'NRT': ['TOKYO'], 'JFK': ['NEW YORK', 'NYC'],
                'LAX': ['LOS ANGELES'], 'SFO': ['SAN FRANCISCO'], 'MIA': ['MIAMI']
            }
            if dest_upper in code_to_city:
                dest_terms.extend(code_to_city[dest_upper])
            
            # Remove duplicates
            dest_terms = list(set(dest_terms))
            
            # Search by any matching term (code or city name)
            dest_conditions = " OR ".join(["(destination = ? OR destination LIKE ? OR dest_city LIKE ?)" for _ in dest_terms])
            query += f" AND ({dest_conditions})"
            for term in dest_terms:
                params.extend([term, f"%{term}%", f"%{term}%"])
        
        if max_price:
            query += " AND price <= ?"
            params.append(max_price)
        
        if airline:
            query += " AND airline LIKE ?"
            params.append(f"%{airline}%")
        
        query += " ORDER BY price ASC LIMIT ?"
        params.append(limit)
        
        return self._execute_query(query, params)
    
    def get_airport_info(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Get airport information by code
        
        Args:
            code: Airport IATA or ICAO code
        
        Returns:
            Airport record or None
        """
        if not self.index_db:
            return None
        
        query = "SELECT * FROM airports WHERE code = ? OR iata = ? OR icao = ?"
        params = [code.upper(), code.upper(), code.upper()]
        rows = self._execute_query(query, params)
        
        return rows[0] if rows else None
    
    def get_route_info(self, origin: str, destination: str) -> List[Dict[str, Any]]:
        """
        Get route information between airports
        
        Args:
            origin: Origin airport code
            destination: Destination airport code
        
        Returns:
            List of route records
        """
        if not self.index_db:
            return []
        
        query = "SELECT * FROM routes WHERE origin_airport = ? AND dest_airport = ?"
        params = [origin.upper(), destination.upper()]
        return self._execute_query(query, params)
    
    def get_flight_delays(
        self,
        airline: Optional[str] = None,
        origin: Optional[str] = None,
        destination: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get flight delay statistics
        
        Args:
            airline: Airline name
            origin: Origin airport
            destination: Destination airport
        
        Returns:
            List of delay records
        """
        if not self.index_db:
            return []
        
        query = "SELECT * FROM flight_delays WHERE 1=1"
        params = []
        
        if airline:
            query += " AND airline = ?"
            params.append(airline)
        
        if origin:
            query += " AND origin_airport = ?"
            params.append(origin.upper())
        
        if destination:
            query += " AND dest_airport = ?"
            params.append(destination.upper())
        
        query += " LIMIT 100"
        
        return self._execute_query(query, params)
    
    def get_context_for_query(
        self,
        query_type: str,
        **kwargs
    ) -> str:
        """
        Get formatted context string for AI agent
        
        Args:
            query_type: Type of query (hotel, flight, airport, route, delay)
            **kwargs: Query parameters
        
        Returns:
            Formatted context string with relevant data
        """
        context_parts = []
        
        if query_type == "hotel":
            hotels = self.search_hotels(
                city=kwargs.get("city"),
                max_price=kwargs.get("max_price"),
                min_rating=kwargs.get("min_rating"),
                limit=5
            )
            if hotels:
                context_parts.append("Available Hotels:")
                for hotel in hotels:
                    rating_str = f", Rating: {hotel.get('rating', 0):.1f}/5" if hotel.get('rating') else ""
                    context_parts.append(
                        f"- {hotel.get('name', 'Unknown')} in {hotel.get('city', 'Unknown')}: "
                        f"${hotel.get('price_per_night', 0):.2f}/night{rating_str}"
                    )
        
        elif query_type == "flight":
            flights = self.search_flights(
                origin=kwargs.get("origin"),
                destination=kwargs.get("destination"),
                max_price=kwargs.get("max_price"),
                airline=kwargs.get("airline"),
                limit=5
            )
            if flights:
                context_parts.append("Available Flights:")
                for flight in flights:
                    stops_str = f", {flight.get('stops', 0)} stops" if flight.get('stops', 0) > 0 else ", Direct"
                    context_parts.append(
                        f"- {flight.get('airline', 'Unknown')} {flight.get('origin', '')} → "
                        f"{flight.get('destination', '')}: ${flight.get('price', 0):.2f}{stops_str}"
                    )
        
        elif query_type == "airport":
            code = kwargs.get("code")
            if code:
                airport = self.get_airport_info(code)
                if airport:
                    context_parts.append(
                        f"Airport {code}: {airport.get('name', 'Unknown')} in "
                        f"{airport.get('city', 'Unknown')}, {airport.get('country', 'Unknown')}"
                    )
        
        elif query_type == "route":
            origin = kwargs.get("origin")
            dest = kwargs.get("destination")
            if origin and dest:
                routes = self.get_route_info(origin, dest)
                if routes:
                    context_parts.append(f"Routes from {origin} to {dest}:")
                    for route in routes:
                        context_parts.append(
                            f"- {route.get('airline', 'Unknown')}: "
                            f"{route.get('stops', 0)} stops"
                        )
        
        elif query_type == "delay":
            delays = self.get_flight_delays(
                airline=kwargs.get("airline"),
                origin=kwargs.get("origin"),
                destination=kwargs.get("destination")
            )
            if delays:
                avg_dep_delay = sum(d.get("departure_delay", 0) or 0 for d in delays) / len(delays)
                avg_arr_delay = sum(d.get("arrival_delay", 0) or 0 for d in delays) / len(delays)
                context_parts.append(
                    f"Flight Delay Statistics: Avg departure delay: {avg_dep_delay:.1f} min, "
                    f"Avg arrival delay: {avg_arr_delay:.1f} min"
                )
        
        return "\n".join(context_parts) if context_parts else "No relevant data found."
    
    def get_comprehensive_context(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        city: Optional[str] = None,
        max_price: Optional[float] = None
    ) -> str:
        """
        Get comprehensive context for a trip query
        
        Args:
            origin: Origin airport/city
            destination: Destination airport/city
            city: Hotel city
            max_price: Maximum budget
        
        Returns:
            Comprehensive context string
        """
        context_parts = []
        
        # Airport information
        if origin:
            airport = self.get_airport_info(origin)
            if airport:
                context_parts.append(f"Origin Airport: {airport.get('name', origin)} in {airport.get('city', 'Unknown')}")
        
        if destination:
            airport = self.get_airport_info(destination)
            if airport:
                context_parts.append(f"Destination Airport: {airport.get('name', destination)} in {airport.get('city', 'Unknown')}")
        
        # Route information
        if origin and destination:
            routes = self.get_route_info(origin, destination)
            if routes:
                context_parts.append(f"Available routes: {len(routes)} airlines serve this route")
        
        # Flight options
        flights = self.search_flights(origin=origin, destination=destination, max_price=max_price, limit=3)
        if flights:
            context_parts.append("Flight Options:")
            for flight in flights:
                context_parts.append(
                    f"  - {flight.get('airline', 'Unknown')}: ${flight.get('price', 0):.2f}"
                )
        
        # Hotel options
        hotels = self.search_hotels(city=city or destination, max_price=max_price, limit=3)
        if hotels:
            context_parts.append("Hotel Options:")
            for hotel in hotels:
                context_parts.append(
                    f"  - {hotel.get('name', 'Unknown')}: ${hotel.get('price_per_night', 0):.2f}/night"
                )
        
        return "\n".join(context_parts) if context_parts else "No data available for this query."
    
    def close(self):
        """Close database connection"""
        if self.engine:
            self.engine.dispose()

