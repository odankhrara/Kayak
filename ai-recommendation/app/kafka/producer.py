"""Kafka producers for AI recommendation service"""
from kafka import KafkaProducer
from aiokafka import AIOKafkaProducer
import json
import os
from typing import Dict, Any, List


class KafkaProducerClient:
    """Kafka producer client"""
    
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092,localhost:9092")
        self.producer = KafkaProducer(
            bootstrap_servers=self._format_bootstrap(self.bootstrap_servers),
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
        )

    @staticmethod
    def _format_bootstrap(bootstrap: str) -> List[str]:
        return [b.strip() for b in bootstrap.split(',') if b.strip()]
    
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


def get_bootstrap_servers() -> List[str]:
    """Return bootstrap servers as a list, with sensible defaults."""
    return KafkaProducerClient._format_bootstrap(
        os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092,localhost:9092")
    )


def create_async_producer() -> AIOKafkaProducer:
    """Factory for an aiokafka producer using shared bootstrap configuration."""
    return AIOKafkaProducer(
        bootstrap_servers=",".join(get_bootstrap_servers()),
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None,
    )

