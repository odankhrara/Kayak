"""Event Emitter - Deals Agent Stage 4: Emit deal events"""
import asyncio
from typing import Dict, Any
from sqlmodel import Session
from app.db.session import get_session
from app.kafka.consumer import KafkaConsumerClient
from app.kafka.producer import create_async_producer
from app.models import FlightDeal, HotelDeal
from sqlmodel import select
import os
from datetime import datetime


class EventEmitter:
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.running = False
        self.input_topic = os.getenv("KAFKA_TOPIC_TAGGED", "deals.tagged")
        self.output_topic = os.getenv("KAFKA_TOPIC_EVENTS", "deal.events")
        self.group_id = "deals-agent-emitter"
    
    async def create_event(self, tagged_record: Dict[str, Any]) -> Dict[str, Any]:
        record_type = tagged_record.get("type", "")
        deal_score = tagged_record.get("deal_score", 0)
        
        event = {
            "event_type": "deal_created",
            "deal_type": record_type,
            "deal_id": tagged_record.get("raw_id", ""),
            "deal_score": deal_score,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if record_type == "flight":
            event.update({
                "route": f"{tagged_record.get('origin', '')} → {tagged_record.get('destination', '')}",
                "airline": tagged_record.get("airline", ""),
                "price": tagged_record.get("discounted_price", 0),
                "discount": tagged_record.get("discount_percentage", 0),
            })
        elif record_type == "hotel":
            event.update({
                "name": tagged_record.get("name", ""),
                "city": tagged_record.get("city", ""),
                "price_per_night": tagged_record.get("discounted_price", 0),
                "discount": tagged_record.get("discount_percentage", 0),
            })
        
        # Add tags summary
        tags = tagged_record.get("tags", [])
        event["tags"] = tags
        event["key_features"] = [t for t in tags if t in ["refundable", "pet-friendly", "near-transit", "breakfast"]]
        
        return event
    
    async def store_deal(self, tagged_record: Dict[str, Any]):
        """Store deal in database"""
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            record_type = tagged_record.get("type", "")
            
            if record_type == "flight":
                statement = select(FlightDeal).where(
                    FlightDeal.airline == tagged_record.get("airline", ""),
                    FlightDeal.flight_number == tagged_record.get("flight_number", "")
                )
                existing = session.exec(statement).first()
                
                if existing:
                    existing.discounted_price = tagged_record.get("discounted_price", 0)
                    existing.discount_percentage = tagged_record.get("discount_percentage", 0)
                    existing.deal_score = tagged_record.get("deal_score", 0)
                    existing.tags = tagged_record.get("tags_string", "")
                    existing.available_seats = tagged_record.get("available_seats", 0)
                else:
                    deal = FlightDeal(
                        airline=tagged_record.get("airline", ""),
                        flight_number=tagged_record.get("flight_number", ""),
                        origin=tagged_record.get("origin", ""),
                        destination=tagged_record.get("destination", ""),
                        departure_time=tagged_record.get("departure_time"),
                        arrival_time=tagged_record.get("arrival_time"),
                        original_price=tagged_record.get("original_price", 0),
                        discounted_price=tagged_record.get("discounted_price", 0),
                        discount_percentage=tagged_record.get("discount_percentage", 0),
                        deal_score=tagged_record.get("deal_score", 0),
                        tags=tagged_record.get("tags_string", ""),
                        available_seats=tagged_record.get("available_seats", 0)
                    )
                    session.add(deal)
            
            elif record_type == "hotel":
                statement = select(HotelDeal).where(
                    HotelDeal.name == tagged_record.get("name", ""),
                    HotelDeal.city == tagged_record.get("city", "")
                )
                existing = session.exec(statement).first()
                
                if existing:
                    existing.discounted_price_per_night = tagged_record.get("discounted_price", 0)
                    existing.discount_percentage = tagged_record.get("discount_percentage", 0)
                    existing.deal_score = tagged_record.get("deal_score", 0)
                    existing.tags = tagged_record.get("tags_string", "")
                    existing.available_rooms = tagged_record.get("available_rooms", 0)
                else:
                    deal = HotelDeal(
                        name=tagged_record.get("name", ""),
                        city=tagged_record.get("city", ""),
                        state=tagged_record.get("state"),
                        country=tagged_record.get("country", ""),
                        address=tagged_record.get("address", ""),
                        original_price_per_night=tagged_record.get("original_price", 0),
                        discounted_price_per_night=tagged_record.get("discounted_price", 0),
                        discount_percentage=tagged_record.get("discount_percentage", 0),
                        deal_score=tagged_record.get("deal_score", 0),
                        tags=tagged_record.get("tags_string", ""),
                        available_rooms=tagged_record.get("available_rooms", 0),
                        rating=tagged_record.get("rating")
                    )
                    session.add(deal)
            
            session.commit()
        
        except Exception as e:
            session.rollback()
            print(f"[EventEmitter] Error storing deal: {e}")
        finally:
            session.close()
    
    async def process_message(self, topic: str, message: Dict[str, Any]):
        try:
            await self.store_deal(message)
            event = await self.create_event(message)
            
            key = message.get("raw_id", "unknown")
            if message.get("type") == "flight":
                key = f"{message.get('origin', '')}-{message.get('destination', '')}"
            
            await self.producer.send(self.output_topic, key=key, value=event)
            print(f"[EventEmitter] Emitted event for {message.get('type')} deal: {key}")
        except Exception as e:
            print(f"[EventEmitter] Error processing message: {e}")
    
    async def start(self):
        self.producer = create_async_producer()
        await self.producer.start()
        
        self.consumer = KafkaConsumerClient(
            topics=[self.input_topic],
            group_id=self.group_id
        )
        
        self.running = True
        print(f"[EventEmitter] Started")
        
        async def message_handler(topic: str, message: Dict[str, Any]):
            await self.process_message(topic, message)
        
        await self.consumer.consume(message_handler)
    
    async def stop(self):
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

