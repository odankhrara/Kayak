"""Deal Detector Worker - Deals Agent Stage 2: Detect and score deals"""
import asyncio
from typing import Dict, Any
from sqlmodel import Session
from app.db.session import get_session
from app.kafka.consumer import KafkaConsumerClient
from app.kafka.producer import create_async_producer
from app.deals_agent.deal_detector import DealDetector
from app.data.price_history import PriceHistoryTracker
import os


class DealDetectorWorker:
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.running = False
        self.input_topic = os.getenv("KAFKA_TOPIC_NORMALIZED", "deals.normalized")
        self.output_topic = os.getenv("KAFKA_TOPIC_SCORED", "deals.scored")
        self.group_id = "deals-agent-detector"
        self.detector = DealDetector()
    
    async def detect_and_score(self, normalized_record: Dict[str, Any]) -> Dict[str, Any]:
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            record_type = normalized_record.get("type", "")
            listing_id = normalized_record.get("raw_id", "")
            
            historical_data = PriceHistoryTracker.get_historical_data(session, record_type, listing_id)
            
            if record_type == "flight":
                deal_info = self.detector.detect_flight_deal(normalized_record, historical_data)
            elif record_type == "hotel":
                deal_info = self.detector.detect_hotel_deal(normalized_record, historical_data)
            else:
                return None
            
            if not deal_info.get("is_good_deal"):
                return None
            
            scored_record = {
                **normalized_record,
                "deal_score": int(deal_info.get("deal_score", 0)),
                "original_price": deal_info.get("original_price") or deal_info.get("original_price_per_night"),
                "discounted_price": deal_info.get("discounted_price") or deal_info.get("discounted_price_per_night"),
                "discount_percentage": deal_info.get("discount_percentage", 0),
                "is_good_deal": True,
                "detection_reason": deal_info.get("reason", ""),
            }
            
            if deal_info.get("discounted_price") or deal_info.get("discounted_price_per_night"):
                price = deal_info.get("discounted_price") or deal_info.get("discounted_price_per_night")
                PriceHistoryTracker.store_price_point(session, record_type, listing_id, price)
            
            return scored_record
        
        except Exception as e:
            print(f"[DealDetector] Error detecting deal: {e}")
            return None
        finally:
            session.close()
    
    async def process_message(self, topic: str, message: Dict[str, Any]):
        try:
            scored = await self.detect_and_score(message)
            if scored:
                key = scored.get("raw_id", "unknown")
                await self.producer.send(self.output_topic, key=key, value=scored)
                print(f"[DealDetector] Scored {scored['type']} deal: {key} (score: {scored['deal_score']})")
        except Exception as e:
            print(f"[DealDetector] Error processing message: {e}")
    
    async def start(self):
        self.producer = create_async_producer()
        await self.producer.start()
        
        self.consumer = KafkaConsumerClient(
            topics=[self.input_topic],
            group_id=self.group_id
        )
        
        self.running = True
        print(f"[DealDetector] Started")
        
        async def message_handler(topic: str, message: Dict[str, Any]):
            await self.process_message(topic, message)
        
        await self.consumer.consume(message_handler)
    
    async def stop(self):
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

