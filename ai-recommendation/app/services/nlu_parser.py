"""Natural Language Understanding (NLU) parser for trip requests"""
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import os

try:
    from dateutil import parser as date_parser
    from dateutil.relativedelta import relativedelta
    DATEUTIL_AVAILABLE = True
except ImportError:
    DATEUTIL_AVAILABLE = False
    # Fallback date parsing
    def date_parser_parse(date_string, default=None):
        # Simple fallback - just return default
        return default or datetime.now()

try:
    from app.services.ollama_service import get_ollama_service
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    get_ollama_service = None


class NLUParser:
    """
    Parses natural language trip requests into structured data
    
    Can use Ollama for intelligent parsing if available, otherwise falls back to rule-based parsing.
    """
    
    # Common airport codes (3-letter IATA codes)
    # Will be enhanced with Global Airports dataset if available
    AIRPORT_CODES = {
        'sfo', 'lax', 'jfk', 'lga', 'ewr', 'ord', 'dfw', 'atl', 'den', 'sea',
        'las', 'mco', 'phx', 'mia', 'iad', 'bwi', 'sju', 'bna', 'msy',
        'bos', 'iad', 'dtw', 'msp', 'slt', 'clt', 'iah', 'mci', 'pdx', 'san',
        'nrt', 'hnd', 'del', 'bom', 'cdg', 'lhr', 'lgw'
    }
    
    # Common city names
    MAJOR_CITIES = {
        'tokyo', 'new york', 'nyc', 'los angeles', 'la', 'chicago', 'miami',
        'san francisco', 'sf', 'seattle', 'boston', 'washington', 'dc',
        'paris', 'london', 'dubai', 'singapore', 'bangkok', 'sydney',
        'toronto', 'vancouver', 'mexico city', 'rio', 'buenos aires',
        'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad',
        'bombay'  # Mumbai is also known as Bombay
    }
    
    # Budget keywords
    BUDGET_KEYWORDS = {
        'under', 'below', 'less than', 'max', 'maximum', 'budget', 'total',
        'for', 'per person', 'per person', 'pp', 'total budget'
    }
    
    # Constraint keywords
    CONSTRAINT_KEYWORDS = {
        'pet-friendly': ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'pet-friendly', 'pet friendly'],
        'near-transit': ['transit', 'metro', 'subway', 'train', 'public transport', 'public transportation', 'near transit'],
        'near-airport': ['near airport', 'near the airport', 'airport', 'close to airport', 'airport proximity', 'near jfk', 'near lga', 'near sfo', 'near lax'],
        'no-red-eye': ['no red-eye', 'no redeye', 'avoid red-eye', 'avoid redeye', 'no red eye', 'avoid red eye'],
        'direct': ['direct', 'nonstop', 'non-stop', 'no layover', 'no stops'],
        'refundable': ['refundable', 'refund', 'cancel', 'cancellation'],
        'luxury': ['luxury', '5 star', 'five star', 'upscale', 'premium'],
        'beach': ['beach', 'beachfront', 'ocean', 'seaside'],
        'downtown': ['downtown', 'city center', 'city centre', 'central']
    }
    
    def __init__(self, use_ollama: Optional[bool] = None):
        """
        Initialize NLU Parser
        
        Args:
            use_ollama: Whether to use Ollama for parsing (None = auto-detect)
        """
        self.use_ollama = use_ollama
        if use_ollama is None:
            # Auto-detect: use Ollama if available and enabled
            self.use_ollama = (
                OLLAMA_AVAILABLE and 
                os.getenv("USE_OLLAMA", "false").lower() == "true"
            )
        
        if self.use_ollama and OLLAMA_AVAILABLE:
            try:
                self.ollama_service = get_ollama_service()
                self.use_ollama = self.ollama_service.is_available
            except Exception:
                self.use_ollama = False
                self.ollama_service = None
        else:
            self.ollama_service = None
    
    def parse(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parse natural language message into structured trip request
        
        Example: "Weekend in Tokyo under $900 for two, SFO departure, pet-friendly, near transit."
        
        Returns:
            {
                'origin': 'SFO',
                'destination': 'Tokyo',
                'city': 'Tokyo',
                'dates': {'start': datetime, 'end': datetime, 'type': 'weekend'},
                'budget': 900.0,
                'travelers': 2,
                'constraints': ['pet-friendly', 'near-transit'],
                'confidence': 0.85
            }
        """
        # Use fast rule-based parsing (default) - Ollama is too slow for real-time chat
        # Only use Ollama if explicitly enabled, available, and with very short timeout
        if self.use_ollama and self.ollama_service and self.ollama_service.is_available:
            try:
                # Try Ollama with 2 second timeout (very short)
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(self.ollama_service.parse_trip_request, message)
                    parsed = future.result(timeout=2.0)
                
                # Validate and merge with rule-based parsing for confidence
                rule_based = self._parse_rule_based(message, context=context)
                # Merge results, preferring Ollama but using rule-based as fallback
                for key in ['origin', 'destination', 'city', 'budget', 'travelers']:
                    if not parsed.get(key) and rule_based.get(key):
                        parsed[key] = rule_based[key]
                # Use higher confidence
                parsed['confidence'] = max(parsed.get('confidence', 0.5), rule_based.get('confidence', 0.5))
                parsed['raw_message'] = message
                return parsed
            except (Exception, concurrent.futures.TimeoutError) as e:
                # Fast fallback to rule-based
                pass
        
        # Use fast rule-based parsing (default)
        return self._parse_rule_based(message, context=context)
    
    def _parse_rule_based(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Rule-based parsing (original implementation)"""
        message_lower = message.lower()
        message_clean = message.strip()
        
        # Use context to help disambiguate follow-up messages
        # If we're asking for origin and user provides a city, treat it as origin
        if context:
            awaiting = context.get('awaiting_clarification', False)
            missing_fields = context.get('_missing_fields', [])
            
            # If we're asking for origin and user provides just a city/airport code
            if 'origin' in missing_fields and not any(word in message_lower for word in ['to', 'destination', 'going']):
                # Check city/airport mapping first (before generic extraction)
                origin = self._extract_city_or_airport(message_clean)
                if not origin:
                    origin = self._extract_origin(message_lower)
                if origin:
                    return {
                        'origin': origin,
                        'destination': None,
                        'city': None,
                        'dates': None,
                        'budget': None,
                        'travelers': None,
                        'constraints': [],
                        'raw_message': message,
                        'confidence': 0.9
                    }
            
            # If we're asking for destination and user provides just a city
            if 'destination' in missing_fields and not any(word in message_lower for word in ['from', 'depart', 'leaving']):
                destination = self._extract_destination(message_lower) or self._extract_city_or_airport(message_clean)
                if destination:
                    return {
                        'origin': None,
                        'destination': destination,
                        'city': destination,
                        'dates': None,
                        'budget': None,
                        'travelers': None,
                        'constraints': [],
                        'raw_message': message,
                        'confidence': 0.9
                    }
            
            # If we're asking for budget and user provides just a number
            if 'budget' in missing_fields:
                budget = self._extract_budget(message_lower)
                if budget:
                    return {
                        'origin': None,
                        'destination': None,
                        'city': None,
                        'dates': None,
                        'budget': budget,
                        'travelers': None,
                        'constraints': [],
                        'raw_message': message,
                        'confidence': 0.9
                    }
        
        origin = self._extract_origin(message_lower)
        destination = self._extract_destination(message_lower)
        city = self._extract_city(message_lower)
        
        # Clean up destination - remove "from" if it was accidentally captured
        if destination:
            dest_lower = destination.lower()
            if 'from' in dest_lower:
                # Split at "from" and take the first part
                destination = dest_lower.split('from')[0].strip().title()
                city = destination if not city else city
        
        result = {
            'origin': origin,
            'destination': destination,
            'city': city or destination,
            'dates': self._extract_dates(message, message_lower),
            'budget': self._extract_budget(message_lower),
            'travelers': self._extract_travelers(message_lower),
            'constraints': self._extract_constraints(message_lower),
            'raw_message': message,
            'confidence': self._calculate_confidence(message_lower)
        }
        
        return result
    
    def _extract_origin(self, text: str) -> Optional[str]:
        """Extract origin airport code or city"""
        text_lower = text.lower()
        
        # Handle "from X to Y" pattern - extract origin after "from"
        if ' from ' in text_lower and ' to ' in text_lower:
            # Pattern: "from Mumbai to Delhi"
            from_parts = text_lower.split(' from ')
            if len(from_parts) > 1:
                after_from = from_parts[1].split(' to ')[0].strip()
                # Remove any trailing words
                for stop_word in [' for ', ' with ', ' budget', ' under', ' people', ' travelers']:
                    if stop_word in after_from:
                        after_from = after_from.split(stop_word)[0].strip()
                # Check if it's a known city
                origin = self._extract_city_or_airport(after_from)
                if origin:
                    return origin
        elif ' from ' in text_lower:
            # Pattern: "from Mumbai" (no "to")
            from_parts = text_lower.split(' from ')
            if len(from_parts) > 1:
                after_from = from_parts[1].strip()
                # Remove trailing words
                for stop_word in [' for ', ' with ', ' budget', ' under', ' people', ' travelers', ' to ']:
                    if stop_word in after_from:
                        after_from = after_from.split(stop_word)[0].strip()
                origin = self._extract_city_or_airport(after_from)
                if origin:
                    return origin
        
        # Look for airport codes (3 uppercase letters)
        airport_pattern = r'\b([A-Z]{3})\s+(?:departure|depart|from|leaving|leaves)\b'
        match = re.search(airport_pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        
        # Look for "from [city]" or "departure from [city]"
        # Improved pattern to handle "go to Miami from SFO" correctly
        from_pattern = r'(?:from|departure from|leaving from|depart from|departing from)\s+([A-Z]{3}|[a-z]+(?:\s+[a-z]+)?)'
        match = re.search(from_pattern, text, re.IGNORECASE)
        if match:
            city = match.group(1).strip()
            # Check if it's a known airport code (3 uppercase letters)
            if len(city) == 3 and city.upper() in [c.upper() for c in self.AIRPORT_CODES]:
                return city.upper()
            # Check if it's a known city name
            if city.title() in [c.title() for c in self.MAJOR_CITIES]:
                return city.title()
            return city.title()
        
        # Look for standalone airport codes
        codes_pattern = r'\b([A-Z]{3})\b'
        matches = re.findall(codes_pattern, text.upper())
        for code in matches:
            if code.lower() in self.AIRPORT_CODES:
                return code
        
        # Check for common city names that might be origins
        # If message is just a city name, it could be origin or destination
        text_lower = text.lower().strip()
        for city in self.MAJOR_CITIES:
            if city.lower() in text_lower:
                # If it contains "from" or "depart", it's likely origin
                if 'from' in text_lower or 'depart' in text_lower:
                    return city.title()
                # Otherwise, could be either - but if it's a standalone city, assume destination
                # This is a heuristic
        
        return None
    
    def _extract_destination(self, text: str) -> Optional[str]:
        """Extract destination city or region"""
        text_lower = text.lower()
        
        # First, check for flexible destinations (before city extraction)
        if 'anywhere warm' in text_lower or ('anywhere' in text_lower and 'warm' in text_lower):
            return 'warm region'
        if 'warm destination' in text_lower:
            return 'warm region'
        if 'anywhere' in text_lower and ('beach' in text_lower or 'tropical' in text_lower):
            return 'tropical region'
        if 'anywhere' in text_lower:
            return 'anywhere'  # Flexible destination
        
        # Handle "from X to Y" pattern - extract destination after "to"
        if ' to ' in text_lower:
            # Pattern: "from Mumbai to Delhi" or "Mumbai to Delhi"
            to_parts = text_lower.split(' to ')
            if len(to_parts) > 1:
                after_to = to_parts[1].strip()
                # Remove any trailing words like "for", "with", "budget", etc.
                for stop_word in [' for ', ' with ', ' budget', ' under', ' people', ' travelers']:
                    if stop_word in after_to:
                        after_to = after_to.split(stop_word)[0].strip()
                # Check if it's a known city
                dest = self._extract_city_or_airport(after_to)
                if dest:
                    return dest
        
        # Split text at "from" to separate destination and origin
        # This prevents "miami from sfo" from being captured as destination
        if ' from ' in text_lower:
            # Get the part before "from" - this should contain the destination
            before_from = text_lower.split(' from ')[0]
            text_to_search = before_from
        else:
            text_to_search = text_lower
        
        # Look for "to [destination]" or "in [destination]" in the part before "from"
        to_patterns = [
            r'(?:travel to|traveling to|travelling to|going to|want to go to|visit|trip to)\s+([a-z]+(?:\s+[a-z]+)?)',
            r'\bto\s+([a-z]+(?:\s+[a-z]+)?)',
            r'\bin\s+([a-z]+(?:\s+[a-z]+)?)',
        ]
        
        for pattern in to_patterns:
            match = re.search(pattern, text_to_search)
            if match:
                dest = match.group(1).strip()
                # Remove common words that shouldn't be destinations
                dest = re.sub(r'\b(weekend|trip|vacation|holiday|travel|go|the|a|an|under|below|less than)\b', '', dest, flags=re.IGNORECASE).strip()
                # Remove "to" if it was captured
                dest = re.sub(r'^\s*to\s+', '', dest, flags=re.IGNORECASE).strip()
                # Remove price-related words that might be captured
                dest = re.sub(r'\$\d+', '', dest).strip()
                if dest and len(dest) > 2:  # Valid destination should be more than 2 chars
                    return dest.title()
        
        # Look for "anywhere warm" or similar region descriptions
        # Check for "anywhere warm" first (more specific)
        if 'anywhere warm' in text_lower or ('anywhere' in text_lower and 'warm' in text_lower):
            return 'warm region'
        if 'warm destination' in text_lower:
            return 'warm region'
        if 'anywhere' in text_lower and ('beach' in text_lower or 'tropical' in text_lower):
            return 'tropical region'
        if 'anywhere' in text_lower:
            return 'anywhere'  # Flexible destination
        
        # Check if message is just a city name (standalone)
        text_clean = text.strip()
        # If it's a known city name, assume it's a destination
        for city in self.MAJOR_CITIES:
            if city.lower() == text_clean.lower():
                return city.title()
        
        # Look for city names in the text
        words = text.split()
        for i, word in enumerate(words[:5]):  # Check first 5 words
            if word.title() in [c.title() for c in self.MAJOR_CITIES]:
                # If preceded by "to" or "in", it's likely destination
                if i > 0 and words[i-1].lower() in ['to', 'in', 'going', 'travel']:
                    return word.title()
                # If it's a standalone city name, assume destination
                if len(words) == 1 or (len(words) == 2 and words[0].lower() in ['to', 'in']):
                    return word.title()
        
        return None
    
    def _extract_city(self, text: str) -> Optional[str]:
        """Extract city name (same as destination for now)"""
        return self._extract_destination(text)
    
    def _extract_dates(self, text: str, text_lower: str) -> Optional[Dict[str, Any]]:
        """Extract dates or time window"""
        result = {
            'start': None,
            'end': None,
            'type': None,
            'flexible': False
        }
        
        # Look for "weekend"
        if 'weekend' in text_lower:
            result['type'] = 'weekend'
            result['flexible'] = True
            # Calculate next weekend
            today = datetime.now()
            days_until_saturday = (5 - today.weekday()) % 7
            if days_until_saturday == 0:
                days_until_saturday = 7
            saturday = today + timedelta(days=days_until_saturday)
            result['start'] = saturday
            result['end'] = saturday + timedelta(days=1)
            return result
        
        # Look for "next week", "next month"
        if 'next week' in text_lower:
            result['type'] = 'next_week'
            result['flexible'] = True
            today = datetime.now()
            next_monday = today + timedelta(days=(7 - today.weekday()))
            result['start'] = next_monday
            result['end'] = next_monday + timedelta(days=6)
            return result
        
        if 'next month' in text_lower:
            result['type'] = 'next_month'
            result['flexible'] = True
            today = datetime.now()
            if DATEUTIL_AVAILABLE:
                next_month = today + relativedelta(months=1)
                result['start'] = next_month.replace(day=1)
                result['end'] = next_month.replace(day=28)  # Approximate
            else:
                # Fallback: add 30 days
                result['start'] = today + timedelta(days=30)
                result['end'] = today + timedelta(days=37)
            return result
        
        # Look for date ranges (e.g., "Oct 25-27", "October 25 to 27")
        date_range_patterns = [
            r'(\w+\s+\d+)\s*[-–—]\s*(\w+\s+\d+)',  # "Oct 25 - Oct 27"
            r'(\w+\s+\d+)\s+to\s+(\w+\s+\d+)',      # "Oct 25 to Oct 27"
            r'(\d+/\d+)\s*[-–—]\s*(\d+/\d+)',       # "10/25 - 10/27"
        ]
        
        for pattern in date_range_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_str = match.group(1)
                    end_str = match.group(2)
                    if DATEUTIL_AVAILABLE:
                        result['start'] = date_parser.parse(start_str, default=datetime.now().replace(day=1))
                        result['end'] = date_parser.parse(end_str, default=datetime.now().replace(day=1))
                    else:
                        result['start'] = datetime.now()
                        result['end'] = datetime.now() + timedelta(days=2)
                    result['type'] = 'date_range'
                    return result
                except:
                    continue
        
        # Look for single dates
        single_date_patterns = [
            r'(\w+\s+\d+)',  # "October 25"
            r'(\d+/\d+)',    # "10/25"
        ]
        
        for pattern in single_date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    date_str = match.group(1)
                    if DATEUTIL_AVAILABLE:
                        parsed_date = date_parser.parse(date_str, default=datetime.now())
                    else:
                        parsed_date = datetime.now()
                    result['start'] = parsed_date
                    result['end'] = parsed_date + timedelta(days=2)  # Default 2-day trip
                    result['type'] = 'single_date'
                    return result
                except:
                    continue
        
        return None
    
    def _extract_budget(self, text: str) -> Optional[float]:
        """Extract budget amount"""
        # Look for "$900", "$1,200", "900 dollars", etc.
        patterns = [
            r'\$\s*([\d,]+)',                    # "$900" or "$1,200"
            r'([\d,]+)\s*(?:dollars?|usd|\$)',  # "900 dollars" or "1200 USD"
            r'(?:under|below|less than|max|maximum|budget of)\s*\$?\s*([\d,]+)',  # "under $900"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                    # Check if it's "per person" and adjust
                    if 'per person' in text or 'pp' in text:
                        # Assume 2 travelers if not specified
                        travelers = self._extract_travelers(text) or 2
                        amount = amount * travelers
                    return amount
                except ValueError:
                    continue
        
        # Also check for standalone numbers that might be budgets
        # If message is just a number, it's likely a budget
        text_clean = text.strip()
        if text_clean.isdigit() or (text_clean.replace(',', '').isdigit()):
            try:
                amount = float(text_clean.replace(',', ''))
                # Reasonable budget range: $100 - $50,000
                if 100 <= amount <= 50000:
                    return amount
            except ValueError:
                pass
        
        return None
    
    def _extract_travelers(self, text: str) -> Optional[int]:
        """Extract number of travelers"""
        patterns = [
            r'for\s+(\d+)\s*(?:people|persons|travelers|guests|adults)?',
            r'(\d+)\s*(?:people|persons|travelers|guests|adults)',
            r'(\d+)\s*(?:person|traveler|guest|adult)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        
        # Look for "two", "three", etc.
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        
        for word, num in number_words.items():
            if f'for {word}' in text or f'{word} people' in text:
                return num
        
        return None
    
    def _extract_constraints(self, text: str) -> List[str]:
        """Extract constraints and preferences"""
        constraints = []
        
        for constraint_key, keywords in self.CONSTRAINT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    constraints.append(constraint_key)
                    break
        
        return constraints
    
    def _calculate_confidence(self, text: str) -> float:
        """Calculate confidence score for the parsed result"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on extracted fields
        if self._extract_origin(text):
            confidence += 0.15
        if self._extract_destination(text):
            confidence += 0.15
        if self._extract_budget(text):
            confidence += 0.1
        if self._extract_dates(text, text):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _extract_city_or_airport(self, text: str) -> Optional[str]:
        """Extract city name or airport code from simple text"""
        text_upper = text.upper().strip()
        text_lower = text.lower().strip()
        
        # City to airport code mapping
        city_to_airport = {
            'san francisco': 'SFO',
            'sf': 'SFO',
            'new york': 'JFK',
            'nyc': 'JFK',
            'los angeles': 'LAX',
            'la': 'LAX',
            'chicago': 'ORD',
            'miami': 'MIA',
            'seattle': 'SEA',
            'boston': 'BOS',
            'tokyo': 'NRT',
            'delhi': 'DEL',
            'mumbai': 'BOM',
            'bombay': 'BOM',  # Mumbai is also known as Bombay
            'paris': 'CDG',
            'london': 'LHR',
        }
        
        # Check city mapping first
        if text_lower in city_to_airport:
            return city_to_airport[text_lower]
        
        # Check if it's a 3-letter airport code
        if len(text_upper) == 3 and text_upper.isalpha():
            if text_upper.lower() in self.AIRPORT_CODES:
                return text_upper
        
        # Check if it's a known city (return city name, not code)
        text_title = text.strip().title()
        for city in self.MAJOR_CITIES:
            if city.lower() == text_lower or text_lower in city.lower():
                # Map to airport code if available, otherwise return city name
                return city_to_airport.get(city.lower(), city.title())
        
        # Check common city name patterns
        if len(text.split()) <= 3:  # Likely a city name if 1-3 words
            return text_title
        
        return None

