"""Offer tagger - tags deals with attributes"""
from typing import List, Dict, Any


class OfferTagger:
    """Tags offers with relevant attributes"""
    
    # Tag categories
    PRICE_TAGS = ["budget", "mid-range", "luxury", "premium"]
    LOCATION_TAGS = ["city-center", "airport", "beachfront", "downtown", "suburban"]
    AMENITY_TAGS = ["wifi", "pool", "gym", "parking", "breakfast", "pet-friendly"]
    TIME_TAGS = ["last-minute", "early-bird", "weekend", "weekday"]
    DEAL_TAGS = ["flash-sale", "limited-time", "best-value", "top-rated"]
    
    @staticmethod
    def tag_flight(flight_data: Dict[str, Any]) -> List[str]:
        """Tag flight offer"""
        tags = []
        
        # Price-based tags
        price = flight_data.get("price", 0)
        if price < 200:
            tags.append("budget")
        elif price < 500:
            tags.append("mid-range")
        else:
            tags.append("luxury")
        
        # Time-based tags
        if flight_data.get("departure_time"):
            # Could check if it's last minute, weekend, etc.
            tags.append("available")
        
        # Deal quality tags
        if flight_data.get("deal_score", 0) > 80:
            tags.append("best-value")
        if flight_data.get("discount_percentage", 0) > 30:
            tags.append("flash-sale")
        
        return tags
    
    @staticmethod
    def tag_hotel(hotel_data: Dict[str, Any]) -> List[str]:
        """Tag hotel offer"""
        tags = []
        
        # Price-based tags
        price = hotel_data.get("price_per_night", 0)
        if price < 100:
            tags.append("budget")
        elif price < 250:
            tags.append("mid-range")
        elif price < 500:
            tags.append("luxury")
        else:
            tags.append("premium")
        
        # Location-based tags
        location = hotel_data.get("location", "").lower()
        if "airport" in location:
            tags.append("airport")
        if "beach" in location or "coast" in location:
            tags.append("beachfront")
        if "downtown" in location or "center" in location:
            tags.append("city-center")
        
        # Amenity-based tags
        amenities = hotel_data.get("amenities", [])
        if isinstance(amenities, str):
            amenities = [a.strip() for a in amenities.split(",")]
        
        amenity_mapping = {
            "wifi": "wifi",
            "pool": "pool",
            "gym": "gym",
            "fitness": "gym",
            "parking": "parking",
            "breakfast": "breakfast",
            "pet": "pet-friendly",
            "pets": "pet-friendly"
        }
        
        for amenity in amenities:
            amenity_lower = amenity.lower()
            for key, tag in amenity_mapping.items():
                if key in amenity_lower:
                    tags.append(tag)
                    break
        
        # Rating-based tags
        rating = hotel_data.get("rating", 0)
        if rating >= 4.5:
            tags.append("top-rated")
        
        # Deal quality tags
        if hotel_data.get("deal_score", 0) > 80:
            tags.append("best-value")
        if hotel_data.get("discount_percentage", 0) > 25:
            tags.append("flash-sale")
        
        return list(set(tags))  # Remove duplicates
    
    @staticmethod
    def tag_car(car_data: Dict[str, Any]) -> List[str]:
        """Tag car rental offer"""
        tags = []
        
        # Price-based tags
        price = car_data.get("price_per_day", 0)
        if price < 30:
            tags.append("budget")
        elif price < 60:
            tags.append("mid-range")
        else:
            tags.append("luxury")
        
        # Feature-based tags
        features = car_data.get("features", [])
        if isinstance(features, str):
            features = [f.strip() for f in features.split(",")]
        
        if "gps" in str(features).lower():
            tags.append("gps")
        if "automatic" in str(features).lower() or "auto" in str(features).lower():
            tags.append("automatic")
        
        # Deal quality tags
        if car_data.get("deal_score", 0) > 80:
            tags.append("best-value")
        
        return tags

