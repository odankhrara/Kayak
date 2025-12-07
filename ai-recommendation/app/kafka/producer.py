"""Kafka producers for AI recommendation service"""
try:
    from kafka import KafkaProducer
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaProducer = None

from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError
import json
import os
import asyncio
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


async def check_kafka_connection(bootstrap_servers: List[str], max_retries: int = 3, retry_delay: float = 2.0) -> bool:
    """
    Check if Kafka is accessible before creating a producer.
    
    Args:
        bootstrap_servers: List of Kafka bootstrap server addresses
        max_retries: Maximum number of connection attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        True if Kafka is accessible, False otherwise
    """
    for attempt in range(max_retries):
        try:
            # Try to create a temporary producer to test connection
            test_producer = AIOKafkaProducer(
                bootstrap_servers=",".join(bootstrap_servers),
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await test_producer.start()
            await test_producer.stop()
            return True
        except (KafkaError, ConnectionError, OSError) as e:
            if attempt < max_retries - 1:
                print(f"⚠️  Kafka connection attempt {attempt + 1} failed: {e}. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            else:
                print(f"❌ Kafka connection failed after {max_retries} attempts: {e}")
                return False
        except Exception as e:
            print(f"❌ Unexpected error checking Kafka connection: {e}")
            return False
    return False


def create_async_producer() -> AIOKafkaProducer:
    """
    Factory for an aiokafka producer using shared bootstrap configuration.
    
    Note: This creates the producer but doesn't start it. Call await producer.start() 
    before using it, and ensure to call await producer.stop() when done.
    """
    bootstrap_servers = get_bootstrap_servers()
    return AIOKafkaProducer(
        bootstrap_servers=",".join(bootstrap_servers),
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None,
        # Connection and retry settings for aiokafka
        request_timeout_ms=30000,  # 30 seconds - max time to wait for response
        retry_backoff_ms=100,  # 100ms between retries
        # Note: max_block_ms is not available in aiokafka (it's for kafka-python)
    )

