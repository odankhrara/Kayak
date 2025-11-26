"""Ingestion worker - Kafka consumer for raw_supplier_feeds"""
import asyncio
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import FlightDeal, HotelDeal
from app.deals_agent.deal_detector import DealDetector
from app.deals_agent.offer_tagger import OfferTagger
from app.kafka.consumer import KafkaConsumerClient
from typing import Dict, Any
import os


class IngestionWorker:
    """Worker that ingests supplier feeds from Kafka and processes them"""
    
    def __init__(self):
        self.consumer = None
        self.running = False
        self.deal_detector = DealDetector()
        self.offer_tagger = OfferTagger()
    
    async def process_supplier_feed(self, topic: str, message: Dict[str, Any]):
        """Process a supplier feed message"""
        try:
            listing_type = message.get("type", "").lower()
            
            if listing_type == "flight":
                await self._process_flight_feed(message)
            elif listing_type == "hotel":
                await self._process_hotel_feed(message)
            elif listing_type == "car":
                await self._process_car_feed(message)
            else:
                print(f"Unknown listing type: {listing_type}")
        
        except Exception as e:
            print(f"Error processing supplier feed: {e}")
    
    async def _process_flight_feed(self, flight_data: Dict[str, Any]):
        """Process flight feed and create/update deal"""
        # Detect deal
        deal_info = DealDetector.detect_flight_deal(flight_data)
        
        # Only process if it's a good deal
        if not deal_info.get("is_good_deal"):
            return
        
        # Tag the offer
        tags = OfferTagger.tag_flight(flight_data)
        
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            # Check if deal already exists
            statement = select(FlightDeal).where(
                FlightDeal.airline == flight_data.get("airline"),
                FlightDeal.flight_number == flight_data.get("flight_number")
            )
            existing = session.exec(statement).first()
            
            if existing:
                # Update existing deal
                existing.discounted_price = deal_info["discounted_price"]
                existing.discount_percentage = deal_info["discount_percentage"]
                existing.deal_score = deal_info["deal_score"]
                existing.tags = ",".join(tags)
                existing.available_seats = flight_data.get("available_seats", 0)
            else:
                # Create new deal
                deal = FlightDeal(
                    airline=flight_data.get("airline", ""),
                    flight_number=flight_data.get("flight_number", ""),
                    origin=flight_data.get("origin", ""),
                    destination=flight_data.get("destination", ""),
                    departure_time=flight_data.get("departure_time"),
                    arrival_time=flight_data.get("arrival_time"),
                    original_price=deal_info["original_price"],
                    discounted_price=deal_info["discounted_price"],
                    discount_percentage=deal_info["discount_percentage"],
                    deal_score=deal_info["deal_score"],
                    tags=",".join(tags),
                    available_seats=flight_data.get("available_seats", 0)
                )
                session.add(deal)
            
            session.commit()
            print(f"Processed flight deal: {flight_data.get('airline')} {flight_data.get('flight_number')}")
        
        except Exception as e:
            session.rollback()
            print(f"Error saving flight deal: {e}")
        finally:
            session.close()
    
    async def _process_hotel_feed(self, hotel_data: Dict[str, Any]):
        """Process hotel feed and create/update deal"""
        # Detect deal
        deal_info = DealDetector.detect_hotel_deal(hotel_data)
        
        # Only process if it's a good deal
        if not deal_info.get("is_good_deal"):
            return
        
        # Tag the offer
        tags = OfferTagger.tag_hotel(hotel_data)
        
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            # Check if deal already exists
            statement = select(HotelDeal).where(
                HotelDeal.name == hotel_data.get("name"),
                HotelDeal.city == hotel_data.get("city")
            )
            existing = session.exec(statement).first()
            
            if existing:
                # Update existing deal
                existing.discounted_price_per_night = deal_info["discounted_price_per_night"]
                existing.discount_percentage = deal_info["discount_percentage"]
                existing.deal_score = deal_info["deal_score"]
                existing.tags = ",".join(tags)
                existing.available_rooms = hotel_data.get("available_rooms", 0)
            else:
                # Create new deal
                deal = HotelDeal(
                    name=hotel_data.get("name", ""),
                    city=hotel_data.get("city", ""),
                    state=hotel_data.get("state"),
                    country=hotel_data.get("country", ""),
                    address=hotel_data.get("address", ""),
                    original_price_per_night=deal_info["original_price_per_night"],
                    discounted_price_per_night=deal_info["discounted_price_per_night"],
                    discount_percentage=deal_info["discount_percentage"],
                    deal_score=deal_info["deal_score"],
                    tags=",".join(tags),
                    available_rooms=hotel_data.get("available_rooms", 0),
                    rating=hotel_data.get("rating")
                )
                session.add(deal)
            
            session.commit()
            print(f"Processed hotel deal: {hotel_data.get('name')}")
        
        except Exception as e:
            session.rollback()
            print(f"Error saving hotel deal: {e}")
        finally:
            session.close()
    
    async def _process_car_feed(self, car_data: Dict[str, Any]):
        """Process car feed (placeholder)"""
        # Similar implementation for cars
        print(f"Car feed processing not yet implemented: {car_data.get('make')} {car_data.get('model')}")
    
    async def start(self):
        """Start the ingestion worker"""
        topics = [os.getenv("KAFKA_TOPIC_RAW_FEEDS", "raw_supplier_feeds")]
        self.consumer = KafkaConsumerClient(topics=topics, group_id="ai-recommendation-ingestion")
        
        async def message_handler(topic: str, message: Dict[str, Any]):
            await self.process_supplier_feed(topic, message)
        
        self.running = True
        print("Starting ingestion worker...")
        await self.consumer.consume(message_handler)
    
    async def stop(self):
        """Stop the ingestion worker"""
        self.running = False
        if self.consumer:
            await self.consumer.stop()

