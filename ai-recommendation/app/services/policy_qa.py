"""Policy Q&A Service - Answers questions about policies, logistics, and alternatives"""
from typing import Dict, Any, Optional, List
from sqlmodel import Session
from app.models import FlightDeal, HotelDeal, Bundle
import re
import os

try:
    from app.services.ollama_service import get_ollama_service
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    get_ollama_service = None


class PolicyQA:
    """
    Answers questions about policies, logistics, and alternatives
    using fields present in the datasets.
    """
    
    # Policy keywords mapping
    POLICY_KEYWORDS = {
        'refund': ['refund', 'refundable', 'refundability', 'money back', 'get money back'],
        'cancel': ['cancel', 'cancellation', 'cancelled', 'cancel policy', 'cancellation policy', 'cancel rules'],
        'pet': ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'pet-friendly', 'pet policy', 'allow pets'],
        'breakfast': ['breakfast', 'breakfast included', 'free breakfast', 'continental breakfast', 'meal'],
        'fee': ['fee', 'fees', 'additional fee', 'extra charge', 'hidden fee', 'resort fee', 'cleaning fee'],
        'neighborhood': ['neighborhood', 'area', 'location', 'nearby', 'surrounding', 'district', 'where is'],
        'alternative': ['alternative', 'other options', 'other choices', 'different', 'instead', 'else'],
        'parking': ['parking', 'park', 'car park', 'valet'],
        'wifi': ['wifi', 'internet', 'wireless', 'connection'],
        'checkin': ['check-in', 'check in', 'checkin', 'arrival', 'when can i check in'],
        'checkout': ['check-out', 'check out', 'checkout', 'departure', 'when do i check out']
    }
    
    def __init__(self, session: Session):
        self.session = session
        # Initialize Ollama if available
        self.use_ollama = (
            OLLAMA_AVAILABLE and 
            os.getenv("USE_OLLAMA", "false").lower() == "true"
        )
        if self.use_ollama:
            try:
                self.ollama_service = get_ollama_service()
                self.use_ollama = self.ollama_service.is_available
            except Exception:
                self.use_ollama = False
                self.ollama_service = None
        else:
            self.ollama_service = None
    
    def answer_question(
        self,
        question: str,
        bundle_id: Optional[int] = None,
        flight_id: Optional[int] = None,
        hotel_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Answer a policy/logistics question
        
        Args:
            question: User's question
            bundle_id: Optional bundle ID for context
            flight_id: Optional flight ID for context
            hotel_id: Optional hotel ID for context
        
        Returns:
            Dictionary with answer and relevant information
        """
        question_lower = question.lower()
        
        # Detect question type
        question_type = self._detect_question_type(question_lower)
        
        # Get relevant deal information
        flight = None
        hotel = None
        
        if flight_id:
            flight = self.session.get(FlightDeal, flight_id)
        if hotel_id:
            hotel = self.session.get(HotelDeal, hotel_id)
        
        if bundle_id:
            bundle = self.session.get(Bundle, bundle_id)
            if bundle:
                # Extract flight and hotel IDs from bundle
                if bundle.flight_deal_ids:
                    flight_ids = [int(id) for id in bundle.flight_deal_ids.split(",") if id]
                    if flight_ids:
                        flight = self.session.get(FlightDeal, flight_ids[0])
                if bundle.hotel_deal_ids:
                    hotel_ids = [int(id) for id in bundle.hotel_deal_ids.split(",") if id]
                    if hotel_ids:
                        hotel = self.session.get(HotelDeal, hotel_ids[0])
        
        # Try Ollama first if available
        if self.use_ollama and self.ollama_service:
            try:
                context = {}
                if flight:
                    context["flight"] = {
                        "airline": flight.airline,
                        "price": flight.discounted_price,
                        "tags": flight.tags or ""
                    }
                if hotel:
                    context["hotel"] = {
                        "name": hotel.name,
                        "city": hotel.city,
                        "price": hotel.discounted_price_per_night,
                        "tags": hotel.tags or ""
                    }
                
                ai_answer = self.ollama_service.answer_policy_question(question, context)
                if ai_answer and not ai_answer.startswith("I'm currently using"):
                    # Get details from rule-based for structured data
                    rule_answer = self._generate_answer(question_type, question_lower, flight, hotel)
                    return {
                        "question": question,
                        "question_type": question_type,
                        "answer": ai_answer,
                        "details": rule_answer.get("details", {}),
                        "source": "ollama"
                    }
            except Exception as e:
                print(f"[PolicyQA] Ollama answer failed: {e}")
        
        # Fallback to rule-based answers
        answer = self._generate_answer(question_type, question_lower, flight, hotel)
        
        return {
            "question": question,
            "question_type": question_type,
            "answer": answer["text"],
            "details": answer.get("details", {}),
            "source": answer.get("source", "dataset")
        }
    
    def _detect_question_type(self, question: str) -> str:
        """Detect what type of question this is"""
        for policy_type, keywords in self.POLICY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in question:
                    return policy_type
        
        return "general"
    
    def _generate_answer(
        self,
        question_type: str,
        question: str,
        flight: Optional[FlightDeal],
        hotel: Optional[HotelDeal]
    ) -> Dict[str, Any]:
        """Generate answer based on question type and available data"""
        
        if question_type == "refund":
            return self._answer_refundability(flight, hotel)
        
        elif question_type == "cancel":
            return self._answer_cancellation(flight, hotel)
        
        elif question_type == "pet":
            return self._answer_pets(hotel)
        
        elif question_type == "breakfast":
            return self._answer_breakfast(hotel)
        
        elif question_type == "fee":
            return self._answer_fees(flight, hotel)
        
        elif question_type == "neighborhood":
            return self._answer_neighborhood(hotel)
        
        elif question_type == "alternative":
            return self._answer_alternatives(flight, hotel)
        
        elif question_type == "parking":
            return self._answer_parking(hotel)
        
        elif question_type == "wifi":
            return self._answer_wifi(hotel)
        
        elif question_type == "checkin" or question_type == "checkout":
            return self._answer_checkin_checkout(hotel, question_type)
        
        else:
            return {
                "text": "I can help you with questions about refunds, cancellation policies, pets, breakfast, fees, neighborhood, and alternatives. Could you be more specific?",
                "source": "general"
            }
    
    def _answer_refundability(self, flight: Optional[FlightDeal], hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about refundability"""
        answers = []
        details = {}
        
        if flight:
            # Check tags for refundable
            is_refundable = flight.tags and "refundable" in flight.tags.lower()
            if is_refundable:
                answers.append(f"✅ The {flight.airline} flight is refundable.")
                details["flight_refundable"] = True
            else:
                answers.append(f"⚠️ The {flight.airline} flight may have restrictions. Check the airline's refund policy.")
                details["flight_refundable"] = False
        
        if hotel:
            # Check tags for refundable
            is_refundable = hotel.tags and "refundable" in hotel.tags.lower()
            if is_refundable:
                answers.append(f"✅ The {hotel.name} hotel booking is refundable.")
                details["hotel_refundable"] = True
            else:
                answers.append(f"⚠️ The {hotel.name} hotel may have cancellation restrictions. Review the booking terms.")
                details["hotel_refundable"] = False
        
        if not answers:
            return {
                "text": "Refundability depends on the specific deal. Look for 'refundable' tags in the deal details, or check the provider's cancellation policy.",
                "source": "general"
            }
        
        return {
            "text": " ".join(answers),
            "details": details,
            "source": "tags"
        }
    
    def _answer_cancellation(self, flight: Optional[FlightDeal], hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about cancellation policies"""
        answers = []
        
        if flight:
            is_refundable = flight.tags and "refundable" in flight.tags.lower()
            if is_refundable:
                answers.append(f"✈️ {flight.airline} flight: Cancellation allowed with refund. Check airline policy for specific timeframes.")
            else:
                answers.append(f"✈️ {flight.airline} flight: May have cancellation fees or restrictions. Review terms before booking.")
        
        if hotel:
            is_refundable = hotel.tags and "refundable" in hotel.tags.lower()
            if is_refundable:
                answers.append(f"🏨 {hotel.name}: Free cancellation available. Confirm cancellation deadline with the hotel.")
            else:
                answers.append(f"🏨 {hotel.name}: Cancellation policy varies. Some bookings may be non-refundable.")
        
        if not answers:
            return {
                "text": "Cancellation policies vary by provider. Generally, refundable bookings allow free cancellation up to 24-48 hours before check-in/departure. Non-refundable bookings typically have no refund option.",
                "source": "general"
            }
        
        return {
            "text": " ".join(answers) if answers else "Check the specific cancellation policy for your booking.",
            "source": "tags"
        }
    
    def _answer_pets(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about pet policies"""
        if hotel:
            is_pet_friendly = hotel.tags and "pet-friendly" in hotel.tags.lower()
            if is_pet_friendly:
                return {
                    "text": f"✅ {hotel.name} is pet-friendly! Pets are allowed. There may be additional fees or restrictions - contact the hotel for details.",
                    "details": {"pet_friendly": True},
                    "source": "tags"
                }
            else:
                return {
                    "text": f"⚠️ {hotel.name} does not appear to be pet-friendly based on available information. Contact the hotel directly to confirm their pet policy.",
                    "details": {"pet_friendly": False},
                    "source": "tags"
                }
        
        return {
            "text": "Pet policies vary by hotel. Look for 'pet-friendly' tags in hotel listings. Even pet-friendly hotels may have restrictions on size, number of pets, or require additional fees.",
            "source": "general"
        }
    
    def _answer_breakfast(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about breakfast"""
        if hotel:
            has_breakfast = hotel.tags and "breakfast" in hotel.tags.lower()
            if has_breakfast:
                return {
                    "text": f"✅ {hotel.name} includes breakfast! Check if it's continental, buffet, or à la carte.",
                    "details": {"breakfast_included": True},
                    "source": "tags"
                }
            else:
                return {
                    "text": f"⚠️ Breakfast may not be included at {hotel.name}. Check the hotel amenities or contact them directly.",
                    "details": {"breakfast_included": False},
                    "source": "tags"
                }
        
        return {
            "text": "Breakfast inclusion varies by hotel. Some hotels include continental breakfast, while others offer it as an add-on or have on-site restaurants.",
            "source": "general"
        }
    
    def _answer_fees(self, flight: Optional[FlightDeal], hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about fees"""
        answers = []
        details = {}
        
        if flight:
            answers.append(f"✈️ Flight fees: The displayed price (${flight.discounted_price:.2f}) may not include baggage fees, seat selection, or other add-ons. Check with {flight.airline} for complete pricing.")
            details["flight_base_price"] = flight.discounted_price
        
        if hotel:
            answers.append(f"🏨 Hotel fees: Base rate is ${hotel.discounted_price_per_night:.2f}/night. Additional fees may include resort fees, parking, or cleaning fees. Contact {hotel.name} for a complete breakdown.")
            details["hotel_base_price"] = hotel.discounted_price_per_night
        
        if not answers:
            return {
                "text": "Key fees to watch for: Flight baggage fees, seat selection, hotel resort fees, parking, cleaning fees, and city taxes. Always check the final price before booking.",
                "source": "general"
            }
        
        return {
            "text": " ".join(answers),
            "details": details,
            "source": "pricing"
        }
    
    def _answer_neighborhood(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about neighborhood/location"""
        if hotel:
            location_info = []
            if hotel.address:
                location_info.append(f"located at {hotel.address}")
            if hotel.city:
                location_info.append(f"in {hotel.city}")
            if hotel.state:
                location_info.append(f", {hotel.state}")
            
            location_str = " ".join(location_info) if location_info else f"in {hotel.city}"
            
            # Check for location tags
            tags_info = []
            if hotel.tags:
                location_tags = ["downtown", "city-center", "airport", "beachfront", "near-transit"]
                found_tags = [tag for tag in location_tags if tag in hotel.tags.lower()]
                if found_tags:
                    tags_info.append(f"Tags: {', '.join(found_tags)}")
            
            answer_parts = [f"📍 {hotel.name} is {location_str}."]
            if tags_info:
                answer_parts.append(" ".join(tags_info))
            
            return {
                "text": " ".join(answer_parts),
                "details": {
                    "address": hotel.address,
                    "city": hotel.city,
                    "state": hotel.state,
                    "location_tags": found_tags if hotel.tags else []
                },
                "source": "dataset"
            }
        
        return {
            "text": "I can provide neighborhood information for specific hotels. Please ask about a particular hotel or bundle.",
            "source": "general"
        }
    
    def _answer_alternatives(self, flight: Optional[FlightDeal], hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about alternatives"""
        if flight or hotel:
            return {
                "text": "I can show you alternative options! Would you like me to search for other flights, hotels, or bundles with similar criteria? Just let me know what you're looking for.",
                "source": "general"
            }
        
        return {
            "text": "I can help you find alternatives! Tell me what you're looking for (different price range, location, dates, etc.) and I'll search for other options.",
            "source": "general"
        }
    
    def _answer_parking(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about parking"""
        if hotel:
            has_parking = hotel.tags and "parking" in hotel.tags.lower()
            if has_parking:
                return {
                    "text": f"✅ {hotel.name} offers parking. There may be additional fees - contact the hotel for rates and availability.",
                    "details": {"parking_available": True},
                    "source": "tags"
                }
            else:
                return {
                    "text": f"⚠️ Parking information not available for {hotel.name}. Contact the hotel directly for parking options and fees.",
                    "details": {"parking_available": None},
                    "source": "tags"
                }
        
        return {
            "text": "Parking availability and fees vary by hotel. Some hotels offer free parking, while others charge daily rates. Contact the hotel for specific information.",
            "source": "general"
        }
    
    def _answer_wifi(self, hotel: Optional[HotelDeal]) -> Dict[str, Any]:
        """Answer about WiFi"""
        if hotel:
            has_wifi = hotel.tags and ("wifi" in hotel.tags.lower() or "internet" in hotel.tags.lower())
            if has_wifi:
                return {
                    "text": f"✅ {hotel.name} offers WiFi. Most hotels include basic WiFi, with premium high-speed options sometimes available for an additional fee.",
                    "details": {"wifi_available": True},
                    "source": "tags"
                }
            else:
                return {
                    "text": f"WiFi information not explicitly listed for {hotel.name}, but most modern hotels offer WiFi. Contact the hotel to confirm.",
                    "details": {"wifi_available": None},
                    "source": "tags"
                }
        
        return {
            "text": "Most hotels offer WiFi, though quality and cost vary. Free WiFi is common, but some hotels charge for premium high-speed internet.",
            "source": "general"
        }
    
    def _answer_checkin_checkout(self, hotel: Optional[HotelDeal], question_type: str) -> Dict[str, Any]:
        """Answer about check-in/check-out times"""
        if hotel:
            if question_type == "checkin":
                return {
                    "text": f"🏨 {hotel.name}: Standard check-in is typically 3:00 PM or 4:00 PM. Early check-in may be available for an additional fee. Contact the hotel to confirm and request early check-in.",
                    "source": "general"
                }
            else:  # checkout
                return {
                    "text": f"🏨 {hotel.name}: Standard check-out is typically 11:00 AM or 12:00 PM. Late check-out may be available for an additional fee. Contact the hotel to arrange.",
                    "source": "general"
                }
        
        return {
            "text": "Standard check-in is usually 3-4 PM, and check-out is typically 11 AM-12 PM. Times may vary by hotel - always confirm with the property.",
            "source": "general"
        }

