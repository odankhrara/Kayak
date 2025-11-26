"""Kafka consumer for AI recommendation service"""
from aiokafka import AIOKafkaConsumer
import json
import asyncio
import os
from typing import Callable, Dict, Any


class KafkaConsumerClient:
    """Kafka consumer client"""
    
    def __init__(self, topics: list[str], group_id: str = "ai-recommendation-group"):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.topics = topics
        self.group_id = group_id
        self.consumer = None
        self.running = False
    
    async def start(self):
        """Start consumer"""
        self.consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
        )
        await self.consumer.start()
        self.running = True
    
    async def consume(self, message_handler: Callable[[str, Dict[Any, Any]], None]):
        """Consume messages"""
        if not self.consumer:
            await self.start()
        
        try:
            async for message in self.consumer:
                if not self.running:
                    break
                topic = message.topic
                value = message.value
                await message_handler(topic, value)
        except Exception as e:
            print(f"Error consuming messages: {e}")
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop consumer"""
        self.running = False
        if self.consumer:
            await self.consumer.stop()
    
    async def close(self):
        """Close consumer"""
        await self.stop()

