"""Kafka producer for AI recommendation service"""
from kafka import KafkaProducer
import json
import os
from typing import Dict, Any


class KafkaProducerClient:
    """Kafka producer client"""
    
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
        )
    
    def send_message(self, topic: str, message: Dict[Any, Any], key: str = None):
        """Send message to Kafka topic"""
        try:
            future = self.producer.send(topic, value=message, key=key)
            future.get(timeout=10)
            return True
        except Exception as e:
            print(f"Error sending message to Kafka: {e}")
            return False
    
    def close(self):
        """Close producer"""
        self.producer.close()


# Global producer instance
kafka_producer = KafkaProducerClient()

