"""Groq Service - Integration with Groq API for LLM-powered responses"""
import httpx
from typing import Dict, Any, Optional, List
import os
from functools import lru_cache

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    Groq = None

try:
    from app.services.csv_query_service import CSVQueryService
    CSV_QUERY_AVAILABLE = True
except ImportError:
    CSV_QUERY_AVAILABLE = False
    CSVQueryService = None


class GroqService:
    """
    Service for interacting with Groq API
    
    Groq provides fast inference for large language models via API.
    This service provides intelligent natural language understanding and generation.
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.1-8b-instant"):
        """
        Initialize Groq service
        
        Args:
            api_key: Groq API key (default: from GROQ_API_KEY env var)
            model: Model name to use (default: llama-3.1-70b-versatile)
                   Options: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, etc.
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model
        self.client = None
        self._available = False
        
        if self.api_key:
            try:
                if GROQ_AVAILABLE and Groq:
                    self.client = Groq(api_key=self.api_key)
                else:
                    # Fallback to HTTP client
                    self.client = httpx.Client(
                        base_url="https://api.groq.com/openai/v1",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        timeout=30.0
                    )
                self._available = self._check_availability()
            except Exception as e:
                print(f"[GroqService] Error initializing: {e}")
                self._available = False
        else:
            print("[GroqService] No API key provided. Set GROQ_API_KEY environment variable.")
            self._available = False
        
        # Initialize CSV query service for data access
        if CSV_QUERY_AVAILABLE:
            try:
                self.csv_query = CSVQueryService()
            except Exception as e:
                print(f"[GroqService] CSV query service not available: {e}")
                self.csv_query = None
        else:
            self.csv_query = None
    
    def _check_availability(self) -> bool:
        """Check if Groq API is available"""
        if not self.api_key:
            return False
        try:
            # Simple test request
            if GROQ_AVAILABLE and isinstance(self.client, Groq):
                # Test with a minimal request
                return True  # Groq client doesn't have a simple ping, assume available if initialized
            else:
                # HTTP client - test with models endpoint
                response = self.client.get("/models")
                return response.status_code == 200
        except Exception:
            return False
    
    @property
    def is_available(self) -> bool:
        """Check if Groq service is available"""
        return self._available
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        stream: bool = False
    ) -> str:
        """
        Generate text using Groq
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt for context
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response (not fully implemented for HTTP fallback)
        
        Returns:
            Generated text
        """
        if not self.is_available:
            return self._fallback_response(prompt)
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Use official Groq package if available
            if GROQ_AVAILABLE and isinstance(self.client, Groq):
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=stream
                )
                
                if stream:
                    # Handle streaming (collect all chunks)
                    full_response = ""
                    for chunk in response:
                        if chunk.choices[0].delta.content:
                            full_response += chunk.choices[0].delta.content
                    return full_response
                else:
                    return response.choices[0].message.content
            else:
                # Fallback to HTTP API
                response = self.client.post(
                    "/chat/completions",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "stream": stream
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if stream:
                        # Handle streaming response
                        full_response = ""
                        for line in response.iter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break
                                try:
                                    import json
                                    chunk = json.loads(data)
                                    if chunk.get("choices") and chunk["choices"][0].get("delta"):
                                        content = chunk["choices"][0]["delta"].get("content", "")
                                        if content:
                                            full_response += content
                                except:
                                    pass
                        return full_response
                    else:
                        return result.get("choices", [{}])[0].get("message", {}).get("content", "")
                else:
                    print(f"[GroqService] API error: {response.status_code} - {response.text}")
                    return self._fallback_response(prompt)
                
        except Exception as e:
            print(f"[GroqService] Error: {e}")
            return self._fallback_response(prompt)
    
    def parse_trip_request(self, message: str) -> Dict[str, Any]:
        """
        Use Groq to parse natural language trip requests with CSV data context
        
        Args:
            message: User's natural language request
        
        Returns:
            Parsed trip request with structured data
        """
        # Get CSV data context if available
        csv_context = ""
        if self.csv_query:
            try:
                # Extract potential cities/airports from message
                message_upper = message.upper()
                potential_codes = [word for word in message_upper.split() if len(word) == 3 and word.isalpha()]
                
                for code in potential_codes[:2]:  # Check first 2 potential codes
                    airport = self.csv_query.get_airport_info(code)
                    if airport:
                        csv_context += f"Airport {code}: {airport.get('name', '')} in {airport.get('city', '')}\n"
            except Exception:
                pass
        
        system_prompt = """You are a travel booking assistant. Parse the user's trip request and extract:
- origin (airport code or city)
- destination (city or region)
- dates (start and end dates if mentioned)
- budget (maximum price)
- travelers (number of people)
- preferences (pet-friendly, near-transit, luxury, etc.)

Respond in JSON format:
{
  "origin": "SFO" or null,
  "destination": "Miami" or null,
  "city": "Miami" or null,
  "dates": {"start": "YYYY-MM-DD" or null, "end": "YYYY-MM-DD" or null, "type": "weekend" or "date_range" or null},
  "budget": 900.0 or null,
  "travelers": 2 or null,
  "preferences": ["pet-friendly", "near-transit"] or [],
  "confidence": 0.85
}"""
        
        prompt = f"Parse this trip request: {message}"
        if csv_context:
            prompt += f"\n\nContext from datasets:\n{csv_context}"
        prompt += "\n\nRespond with JSON only, no additional text."
        
        response = self.generate(
            prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for more structured output
            max_tokens=300
        )
        
        # Try to extract JSON from response
        try:
            import json
            # Remove markdown code blocks if present
            response_clean = response.strip()
            if response_clean.startswith("```"):
                response_clean = response_clean.split("```")[1]
                if response_clean.startswith("json"):
                    response_clean = response_clean[4:]
            response_clean = response_clean.strip()
            
            parsed = json.loads(response_clean)
            return parsed
        except Exception as e:
            print(f"[GroqService] Failed to parse JSON: {e}")
            return {
                "origin": None,
                "destination": None,
                "city": None,
                "dates": None,
                "budget": None,
                "travelers": None,
                "preferences": [],
                "confidence": 0.3
            }
    
    def generate_explanation(
        self,
        bundle_info: Dict[str, Any],
        flights: List[Dict[str, Any]],
        hotels: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate intelligent explanation for a bundle recommendation with CSV data context
        
        Args:
            bundle_info: Bundle information (price, savings, etc.)
            flights: List of flight deals
            hotels: List of hotel deals
            user_context: User's conversation context for personalized explanations
        
        Returns:
            Natural language explanation
        """
        # Get CSV data context
        csv_context = ""
        if self.csv_query and flights:
            try:
                origin = flights[0].get("origin") or flights[0].get("origin_city")
                dest = flights[0].get("destination") or flights[0].get("dest_city")
                if origin and dest:
                    csv_context = self.csv_query.get_comprehensive_context(
                        origin=origin,
                        destination=dest,
                        city=dest,
                        max_price=bundle_info.get('total_price')
                    )
            except Exception:
                pass
        
        system_prompt = """You are a travel concierge explaining why you recommended a travel bundle.
Be friendly, concise, and highlight the value proposition. Focus on:
- Why this bundle is a good deal
- What makes the flights/hotels special
- Any urgency (limited availability)
- Overall value and savings
- Use actual data from datasets when available"""
        
        prompt = f"""Explain why this travel bundle is recommended:

Bundle: ${bundle_info.get('total_price', 0):.2f} (savings: ${bundle_info.get('savings', 0):.2f})
Flights: {len(flights)} flight(s)
Hotels: {len(hotels)} hotel(s)"""
        
        if csv_context:
            prompt += f"\n\nAvailable data from datasets:\n{csv_context}"
        
        if user_context:
            import json
            prompt += f"\n\nUser's current preferences/context: {json.dumps(user_context)}"
        
        prompt += "\n\nGenerate a friendly explanation highlighting the value in MAXIMUM 25 WORDS. Be concise and explain why this matches their needs."
        
        return self.generate(
            prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=200
        )
    
    def answer_policy_question(
        self,
        question: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Answer policy questions using Groq with context and CSV data
        
        Args:
            question: User's question
            context: Context about the deal/bundle
        
        Returns:
            Natural language answer
        """
        # Get CSV data context
        csv_context = ""
        if self.csv_query:
            try:
                if context.get("hotel"):
                    hotel = context["hotel"]
                    city = hotel.get("city") or hotel.get("name", "")
                    hotels = self.csv_query.search_hotels(city=city, limit=3)
                    if hotels:
                        csv_context += f"Similar hotels in dataset: {len(hotels)} found\n"
                
                if context.get("flight"):
                    flight = context["flight"]
                    origin = flight.get("origin")
                    dest = flight.get("destination")
                    if origin and dest:
                        flights = self.csv_query.search_flights(origin=origin, destination=dest, limit=3)
                        if flights:
                            csv_context += f"Similar flights in dataset: {len(flights)} found\n"
            except Exception:
                pass
        
        system_prompt = """You are a helpful travel assistant answering questions about booking policies.
Be accurate, concise, and helpful. Use data from datasets when available. If you don't know something, say so."""
        
        context_str = ""
        if context.get("hotel"):
            hotel = context["hotel"]
            context_str += f"Hotel: {hotel.get('name', 'N/A')}, "
            context_str += f"Tags: {hotel.get('tags', 'N/A')}, "
            context_str += f"Price: ${hotel.get('price', 0):.2f}/night\n"
        
        if context.get("flight"):
            flight = context["flight"]
            context_str += f"Flight: {flight.get('airline', 'N/A')}, "
            context_str += f"Tags: {flight.get('tags', 'N/A')}, "
            context_str += f"Price: ${flight.get('price', 0):.2f}\n"
        
        prompt = f"""Context:
{context_str}"""
        
        if csv_context:
            prompt += f"\nDataset information:\n{csv_context}"
        
        prompt += f"\n\nQuestion: {question}\n\nProvide a helpful answer based on the context and dataset information."
        
        return self.generate(
            prompt,
            system_prompt=system_prompt,
            temperature=0.5,
            max_tokens=300
        )
    
    def _fallback_response(self, prompt: str) -> str:
        """Fallback response when Groq is not available"""
        return "I'm currently using rule-based responses. To enable AI-powered responses, please set GROQ_API_KEY environment variable."
    
    def list_models(self) -> List[str]:
        """List available Groq models"""
        if not self.is_available:
            return []
        
        # Common Groq models (updated 2024)
        return [
            "llama-3.1-8b-instant",
            "llama-3.1-70b-versatile",
            "llama-3.3-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "llama-3-70b-8192"
        ]
    
    def set_model(self, model: str) -> bool:
        """
        Set the model to use
        
        Args:
            model: Model name
        
        Returns:
            True if model is valid, False otherwise
        """
        available_models = self.list_models()
        if model in available_models:
            self.model = model
            return True
        # Allow custom models too
        self.model = model
        return True
    
    def close(self):
        """Close the HTTP client"""
        if self.client and not isinstance(self.client, Groq):
            self.client.close()


# Global instance
_groq_service: Optional[GroqService] = None


def get_groq_service() -> GroqService:
    """Get or create global Groq service instance"""
    global _groq_service
    
    if _groq_service is None:
        api_key = os.getenv("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
        _groq_service = GroqService(api_key=api_key, model=model)
    
    return _groq_service
