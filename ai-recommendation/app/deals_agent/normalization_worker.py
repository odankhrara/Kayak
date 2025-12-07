"""Normalization Worker - Deals Agent Stage 1: Normalize raw feeds"""
import asyncio
from typing import Dict, Any
from app.kafka.consumer import KafkaConsumerClient
from app.kafka.producer import create_async_producer
import os
import json
from datetime import datetime


class NormalizationWorker:
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.running = False
        self.input_topic = os.getenv("KAFKA_TOPIC_RAW_FEEDS", "raw_supplier_feeds")
        self.output_topic = os.getenv("KAFKA_TOPIC_NORMALIZED", "deals.normalized")
        self.group_id = "deals-agent-normalization"
    
    async def normalize_record(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {
            "type": raw_record.get("type", "").lower(),
            "source": raw_record.get("source", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
            "raw_id": raw_record.get("listing_id") or raw_record.get("hotel_id") or raw_record.get("flight_number", ""),
        }
        
        # Normalize currency (convert to USD if needed)
        currency = raw_record.get("currency", "USD").upper()
        # Handle price strings with commas (e.g., "50,992" -> 50992.0)
        price_str = str(raw_record.get("price", 0) or raw_record.get("price_per_night", 0) or 0)
        price_str = price_str.replace(",", "").replace("$", "").strip()
        try:
            price = float(price_str) if price_str else 0.0
        except (ValueError, TypeError):
            price = 0.0
        
        # Simple currency conversion (in production, use real rates)
        if currency != "USD":
            conversion_rates = {"EUR": 1.1, "GBP": 1.25, "JPY": 0.0067}
            if currency in conversion_rates:
                price = price * conversion_rates[currency]
            currency = "USD"
        
        normalized["currency"] = currency
        normalized["price_usd"] = round(price, 2)
        if raw_record.get("departure_time"):
            normalized["departure_time"] = self._normalize_date(raw_record["departure_time"])
        if raw_record.get("arrival_time"):
            normalized["arrival_time"] = self._normalize_date(raw_record["arrival_time"])
        if raw_record.get("check_in"):
            normalized["check_in"] = self._normalize_date(raw_record["check_in"])
        if raw_record.get("check_out"):
            normalized["check_out"] = self._normalize_date(raw_record["check_out"])
        
        # Copy relevant fields based on type
        if normalized["type"] == "flight":
            normalized.update({
                "airline": raw_record.get("airline", ""),
                "flight_number": raw_record.get("flight_number", ""),
                "origin": raw_record.get("origin", ""),
                "destination": raw_record.get("destination", ""),
                "stops": int(raw_record.get("stops", 0)),
                "class": raw_record.get("class", "Economy"),
                "duration": float(raw_record.get("duration", 0)),
                "available_seats": int(raw_record.get("available_seats", 0)),
            })
        elif normalized["type"] == "hotel":
            normalized.update({
                "name": raw_record.get("name", ""),
                "city": raw_record.get("city", ""),
                "state": raw_record.get("state"),
                "country": raw_record.get("country", ""),
                "address": raw_record.get("address", ""),
                "available_rooms": int(raw_record.get("available_rooms", 0)),
                "rating": float(raw_record.get("rating", 0)) if raw_record.get("rating") else None,
                "amenities": raw_record.get("amenities", ""),
            })
        
        # Keep original for reference
        normalized["original"] = raw_record
        
        return normalized
    
    def _normalize_date(self, date_value: Any) -> str:
        """Normalize date to ISO format"""
        if isinstance(date_value, str):
            # Try to parse common formats
            try:
                from dateutil import parser
                dt = parser.parse(date_value)
                return dt.isoformat()
            except:
                return date_value
        elif hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return str(date_value)
    
    async def process_message(self, topic: str, message: Dict[str, Any]):
        try:
            normalized = await self.normalize_record(message)
            key = normalized.get("raw_id", "unknown")
            await self.producer.send(self.output_topic, key=key, value=normalized)
            print(f"[Normalization] Processed {normalized['type']} record: {key}")
        except Exception as e:
            print(f"[Normalization] Error processing message: {e}")
    
    async def start(self):
        self.producer = create_async_producer()
        await self.producer.start()
        
        self.consumer = KafkaConsumerClient(
            topics=[self.input_topic],
            group_id=self.group_id
        )
        
        self.running = True
        print(f"[Normalization] Started")
        
        async def message_handler(topic: str, message: Dict[str, Any]):
            await self.process_message(topic, message)
        
        await self.consumer.consume(message_handler)
    
    async def stop(self):
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

