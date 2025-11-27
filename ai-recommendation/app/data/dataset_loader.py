"""Dataset loader - loads Kaggle datasets and publishes to Kafka"""
import asyncio
import os
from pathlib import Path
from app.data.csv_processor import CSVProcessor
from app.kafka.producer import KafkaProducerClient
from typing import Dict, Any
import json


class DatasetLoader:
    """Loads Kaggle datasets and publishes normalized data to Kafka"""
    
    def __init__(self):
        self.producer = None
        self.kafka_topic = os.getenv("KAFKA_TOPIC_RAW_FEEDS", "raw_supplier_feeds")
    
    async def load_and_publish_dataset(
        self,
        dataset_path: str,
        dataset_type: str,
        batch_size: int = 100
    ):
        """Load dataset and publish to Kafka"""
        if not self.producer:
            self.producer = KafkaProducerClient()
            await self.producer.start()
        
        try:
            records = CSVProcessor.process_dataset(dataset_path, dataset_type)
            batch = []
            
            for record in records:
                batch.append(record)
                
                if len(batch) >= batch_size:
                    await self._publish_batch(batch)
                    batch = []
                    print(f"Published batch of {batch_size} records...")
            
            # Publish remaining records
            if batch:
                await self._publish_batch(batch)
            
            print(f"Finished publishing dataset: {dataset_path}")
        
        except Exception as e:
            print(f"Error loading dataset: {e}")
            raise
        finally:
            if self.producer:
                await self.producer.close()
    
    async def _publish_batch(self, batch: list[Dict[str, Any]]):
        """Publish a batch of records to Kafka"""
        for record in batch:
            try:
                await self.producer.send(
                    topic=self.kafka_topic,
                    key=record.get("listing_id") or record.get("flight_number") or "unknown",
                    value=json.dumps(record)
                )
            except Exception as e:
                print(f"Error publishing record: {e}")
    
    async def load_airbnb_dataset(self, file_path: str):
        """Load Inside Airbnb dataset"""
        await self.load_and_publish_dataset(file_path, "airbnb")
    
    async def load_hotel_booking_dataset(self, file_path: str):
        """Load Hotel Booking Demand dataset"""
        await self.load_and_publish_dataset(file_path, "hotel_booking")
    
    async def load_flight_price_dataset(self, file_path: str):
        """Load Flight Price Prediction dataset"""
        await self.load_and_publish_dataset(file_path, "flight_price")


async def main():
    """Main function to load datasets"""
    loader = DatasetLoader()
    
    # Example usage - update paths to your Kaggle dataset files
    datasets_dir = Path(os.getenv("DATASETS_DIR", "./datasets"))
    
    # Load datasets if they exist
    airbnb_file = datasets_dir / "airbnb_nyc.csv"
    if airbnb_file.exists():
        print("Loading Inside Airbnb dataset...")
        await loader.load_airbnb_dataset(str(airbnb_file))
    
    hotel_file = datasets_dir / "hotel_booking.csv"
    if hotel_file.exists():
        print("Loading Hotel Booking dataset...")
        await loader.load_hotel_booking_dataset(str(hotel_file))
    
    flight_file = datasets_dir / "flight_prices.csv"
    if flight_file.exists():
        print("Loading Flight Price dataset...")
        await loader.load_flight_price_dataset(str(flight_file))


if __name__ == "__main__":
    asyncio.run(main())

