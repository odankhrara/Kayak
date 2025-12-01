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
        """Tag flight offer with explicit Refundable/Nonrefundable per specification"""
        tags = []
        
        # Refundable/Nonrefundable tags (per specification)
        fare_type = flight_data.get("fare_type", "").lower()
        refundable = flight_data.get("refundable", None)
        if refundable is True or "refundable" in fare_type or "flexible" in fare_type:
            tags.append("refundable")
        elif refundable is False or "non-refundable" in fare_type or "basic" in fare_type:
            tags.append("non-refundable")
        else:
            # Default: economy/basic = non-refundable, business/first = refundable
            fare_class = flight_data.get("class", "").lower()
            if fare_class in ["economy", "basic"]:
                tags.append("non-refundable")
            else:
                tags.append("refundable")
        
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
        """Tag hotel offer with explicit Refundable/Nonrefundable per specification"""
        tags = []
        
        # Refundable/Nonrefundable tags (per specification)
        cancellation_policy = hotel_data.get("cancellation_policy", "").lower()
        refundable = hotel_data.get("refundable", None)
        if refundable is True or "refundable" in cancellation_policy or "free cancellation" in cancellation_policy:
            tags.append("refundable")
        elif refundable is False or "non-refundable" in cancellation_policy or "no refund" in cancellation_policy:
            tags.append("non-refundable")
        else:
            # Default based on common patterns
            if "strict" in cancellation_policy or "no refund" in cancellation_policy:
                tags.append("non-refundable")
            else:
                tags.append("refundable")  # Default assumption
        
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
        address = hotel_data.get("address", "").lower()
        neighborhood = hotel_data.get("neighbourhood", "").lower() or hotel_data.get("neighborhood", "").lower()
        
        if "airport" in location or "airport" in address:
            tags.append("airport")
        if "beach" in location or "coast" in location or "beach" in address:
            tags.append("beachfront")
        if "downtown" in location or "center" in location or "downtown" in address:
            tags.append("city-center")
        
        # Near transit tag (per specification)
        location_text = f"{location} {address} {neighborhood}".lower()
        if any(keyword in location_text for keyword in ["transit", "subway", "metro", "train", "bus stop", "station"]):
            tags.append("near-transit")
        
        # Amenity-based tags (per specification: Pet-friendly, Breakfast)
        amenities = hotel_data.get("amenities", "")
        if isinstance(amenities, str):
            amenities_lower = amenities.lower()
            # Check for pet-friendly
            if "pet" in amenities_lower or "dog" in amenities_lower or "cat" in amenities_lower:
                tags.append("pet-friendly")
            # Check for breakfast
            if "breakfast" in amenities_lower or "continental" in amenities_lower:
                tags.append("breakfast")
            # Other amenities
            amenity_mapping = {
                "wifi": "wifi",
                "internet": "wifi",
                "pool": "pool",
                "gym": "gym",
                "fitness": "gym",
                "parking": "parking"
            }
            for key, tag in amenity_mapping.items():
                if key in amenities_lower and tag not in tags:
                    tags.append(tag)
        elif isinstance(amenities, list):
            amenities_lower = " ".join([str(a).lower() for a in amenities])
            if "pet" in amenities_lower or "dog" in amenities_lower or "cat" in amenities_lower:
                tags.append("pet-friendly")
            if "breakfast" in amenities_lower or "continental" in amenities_lower:
                tags.append("breakfast")
        
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

