"""Offer Tagger Worker - Deals Agent Stage 3: Tag scored deals"""
import asyncio
from typing import Dict, Any
from app.kafka.consumer import KafkaConsumerClient
from app.kafka.producer import create_async_producer
from app.deals_agent.offer_tagger import OfferTagger
import os


class OfferTaggerWorker:
    
    def __init__(self):
        self.consumer = None
        self.producer = None
        self.running = False
        self.input_topic = os.getenv("KAFKA_TOPIC_SCORED", "deals.scored")
        self.output_topic = os.getenv("KAFKA_TOPIC_TAGGED", "deals.tagged")
        self.group_id = "deals-agent-tagger"
        self.tagger = OfferTagger()
    
    async def tag_offer(self, scored_record: Dict[str, Any]) -> Dict[str, Any]:
        record_type = scored_record.get("type", "")
        
        if record_type == "flight":
            tags = self.tagger.tag_flight(scored_record)
        elif record_type == "hotel":
            tags = self.tagger.tag_hotel(scored_record)
        else:
            tags = []
        
        tagged_record = {
            **scored_record,
            "tags": tags,
            "tags_string": ",".join(tags),
        }
        return tagged_record
    
    async def process_message(self, topic: str, message: Dict[str, Any]):
        try:
            tagged = await self.tag_offer(message)
            key = tagged.get("raw_id", "unknown")
            await self.producer.send(self.output_topic, key=key, value=tagged)
            print(f"[OfferTagger] Tagged {tagged['type']} deal: {key} (tags: {', '.join(tagged['tags'])})")
        except Exception as e:
            print(f"[OfferTagger] Error processing message: {e}")
    
    async def start(self):
        self.producer = create_async_producer()
        await self.producer.start()
        
        self.consumer = KafkaConsumerClient(
            topics=[self.input_topic],
            group_id=self.group_id
        )
        
        self.running = True
        print(f"[OfferTagger] Started")
        
        async def message_handler(topic: str, message: Dict[str, Any]):
            await self.process_message(topic, message)
        
        await self.consumer.consume(message_handler)
    
    async def stop(self):
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

