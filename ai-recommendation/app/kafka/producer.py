"""Kafka producers for AI recommendation service"""
try:
    from kafka import KafkaProducer
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaProducer = None

from aiokafka import AIOKafkaProducer
import json
import os
from typing import Dict, Any, List


class KafkaProducerClient:
    """Kafka producer client"""
    
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092,localhost:9092")
        if KAFKA_AVAILABLE and KafkaProducer:
            self.producer = KafkaProducer(
                bootstrap_servers=self._format_bootstrap(self.bootstrap_servers),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
            )
        else:
            self.producer = None
            print("⚠️  kafka-python not available, using aiokafka only")

    @staticmethod
    def _format_bootstrap(bootstrap: str) -> List[str]:
        return [b.strip() for b in bootstrap.split(',') if b.strip()]
    
    def send_message(self, topic: str, message: Dict[Any, Any], key: str = None):
        """Send message to Kafka topic"""
        if not self.producer:
            print("⚠️  Kafka producer not available")
            return False
        try:
            future = self.producer.send(topic, value=message, key=key)
            future.get(timeout=10)
            return True
        except Exception as e:
            print(f"Error sending message to Kafka: {e}")
            return False
    
    def close(self):
        """Close producer"""
        if self.producer:
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

