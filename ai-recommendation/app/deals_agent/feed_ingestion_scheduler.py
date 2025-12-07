"""Scheduled CSV/Mock Feed Ingestion - Deals Agent Backend Worker"""
import asyncio
import os
from pathlib import Path
from typing import Dict, Any
from app.deals_agent.csv_producer import produce_from_csv
from app.data.dataset_loader import DatasetLoader


class FeedIngestionScheduler:
    """
    Scheduled feed ingestion worker for the Deals Agent.
    
    Periodically ingests CSV/mock feeds and publishes to Kafka,
    which triggers deal detection and tagging.
    """
    
    def __init__(self, ingestion_interval_minutes: int = 30):
        """
        Initialize feed ingestion scheduler
        
        Args:
            ingestion_interval_minutes: How often to ingest feeds (default: 30 minutes)
        """
        self.ingestion_interval = ingestion_interval_minutes * 60  # Convert to seconds
        self.running = False
        self.csv_paths = self._discover_csv_files()
    
    def _discover_csv_files(self) -> list[Path]:
        """Discover CSV files in the data/raw directory"""
        data_dir = Path(__file__).resolve().parents[2] / "data" / "raw"
        csv_files = []
        
        if data_dir.exists():
            # Look for common Inside Airbnb NYC filenames
            airbnb_patterns = ["listings.csv", "airbnb_nyc.csv", "*airbnb*.csv", "*listings*.csv"]
            for pattern in airbnb_patterns:
                csv_files.extend(list(data_dir.glob(pattern)))
            
            # Also get any other CSV files
            csv_files.extend([f for f in data_dir.glob("*.csv") if f not in csv_files])
            
            # Remove duplicates
            csv_files = list(set(csv_files))
            
            print(f"[FeedIngestion] Discovered {len(csv_files)} CSV files: {[f.name for f in csv_files]}")
        else:
            print(f"[FeedIngestion] Data directory not found: {data_dir}")
        
        return csv_files
    
    async def ingest_csv_feeds(self) -> Dict[str, Any]:
        """
        Ingest all discovered CSV files and publish to Kafka
        
        Returns:
            Statistics about ingestion
        """
        stats = {
            "files_processed": 0,
            "messages_sent": 0,
            "errors": []
        }
        
        if not self.csv_paths:
            print("[FeedIngestion] No CSV files found to ingest")
            return stats
        
        for csv_path in self.csv_paths:
            try:
                print(f"[FeedIngestion] Processing {csv_path.name}...")
                
                # Detect dataset type based on filename
                filename_lower = csv_path.name.lower()
                from app.data.dataset_loader import DatasetLoader
                loader = DatasetLoader()
                
                if "airbnb" in filename_lower or "listings" in filename_lower:
                    # Inside Airbnb dataset
                    await loader.load_airbnb_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Inside Airbnb format)")
                elif "hotel" in filename_lower and "booking" in filename_lower:
                    # Hotel Booking Demand dataset
                    await loader.load_hotel_booking_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Hotel Booking format)")
                elif "flight" in filename_lower or "flight_price" in filename_lower:
                    # Flight Price Prediction dataset (shubhambathwal)
                    await loader.load_flight_price_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Flight Price Prediction format)")
                elif "flightprices" in filename_lower and "dilwong" not in filename_lower:
                    # Flight Prices dataset (dilwong/flightprices)
                    await loader.load_flightprices_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Flight Prices format)")
                elif "expedia" in filename_lower or "train.csv" in filename_lower:
                    # Expedia Hotel Recommendations dataset
                    await loader.load_expedia_hotel_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Expedia Hotel format)")
                elif "routes" in filename_lower or "airlines" in filename_lower:
                    # Airlines, Airport and Routes dataset
                    await loader.load_airlines_routes_dataset(str(csv_path))
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Airlines/Routes format)")
                else:
                    # Generic CSV - use CSV producer (for hotel_prices_sample.csv, etc.)
                    await produce_from_csv(csv_path=csv_path, row_limit=100)
                    stats["files_processed"] += 1
                    stats["messages_sent"] += 100  # Approximate
                    print(f"[FeedIngestion] ✅ Processed {csv_path.name} (Generic CSV format)")
            except Exception as e:
                error_msg = f"Error processing {csv_path.name}: {str(e)}"
                print(f"[FeedIngestion] ❌ {error_msg}")
                stats["errors"].append(error_msg)
        
        return stats
    
    async def ingest_mock_feeds(self) -> Dict[str, Any]:
        """
        Generate and ingest mock feed data (for testing when CSV files aren't available)
        
        Returns:
            Statistics about mock ingestion
        """
        stats = {
            "mock_feeds_generated": 0,
            "messages_sent": 0
        }
        
        # Generate some mock flight data
        from app.kafka.producer import create_async_producer, check_kafka_connection, get_bootstrap_servers
        import json
        from datetime import datetime, timedelta
        
        # Check if Kafka is available
        bootstrap_servers = get_bootstrap_servers()
        if not await check_kafka_connection(bootstrap_servers):
            print(f"[FeedIngestion] ⚠️  Kafka is not available. Skipping mock feed generation.")
            print(f"[FeedIngestion] 💡 Kafka is optional - the service will continue without it")
            return stats
        
        producer = create_async_producer()
        kafka_topic = os.getenv("KAFKA_TOPIC_RAW_FEEDS", "raw_supplier_feeds")
        
        try:
            await producer.start()
            
            # Generate mock flight feeds
            mock_flights = [
                {
                    "type": "flight",
                    "airline": "Delta",
                    "flight_number": f"DL{1000 + i}",
                    "origin": "SFO",
                    "destination": "JFK",
                    "departure_time": (datetime.now() + timedelta(days=i)).isoformat(),
                    "arrival_time": (datetime.now() + timedelta(days=i, hours=6)).isoformat(),
                    "price": 300 - (i * 10),  # Decreasing prices
                    "original_price": 400,
                    "available_seats": 10 - i
                }
                for i in range(5)
            ]
            
            # Generate mock hotel feeds
            mock_hotels = [
                {
                    "type": "hotel",
                    "name": f"Hotel {chr(65 + i)}",
                    "city": "New York",
                    "state": "NY",
                    "price_per_night": 150 - (i * 5),
                    "original_price_per_night": 200,
                    "available_rooms": 5 - i,
                    "rating": 4.0 + (i * 0.1)
                }
                for i in range(5)
            ]
            
            # Send mock data to Kafka
            for flight in mock_flights:
                await producer.send(kafka_topic, value=flight)
                stats["messages_sent"] += 1
            
            for hotel in mock_hotels:
                await producer.send(kafka_topic, value=hotel)
                stats["messages_sent"] += 1
            
            stats["mock_feeds_generated"] = len(mock_flights) + len(mock_hotels)
            print(f"[FeedIngestion] Generated and sent {stats['mock_feeds_generated']} mock feeds")
            
        except Exception as e:
            print(f"[FeedIngestion] ❌ Error generating mock feeds: {e}")
            print(f"[FeedIngestion] 💡 This is non-critical - the service will continue without Kafka")
        finally:
            if producer:
                try:
                    await producer.stop()
                except Exception as e:
                    print(f"[FeedIngestion] ⚠️  Error closing producer: {e}")
        
        return stats
    
    async def start_periodic_ingestion(self):
        """
        Start periodic feed ingestion in the background
        
        This runs continuously, ingesting feeds at regular intervals
        """
        self.running = True
        print(f"[FeedIngestion] Starting periodic ingestion (every {self.ingestion_interval // 60} minutes)")
        
        # Do an initial ingestion
        if self.csv_paths:
            await self.ingest_csv_feeds()
        else:
            print("[FeedIngestion] No CSV files found, using mock feeds")
            await self.ingest_mock_feeds()
        
        # Then ingest periodically
        while self.running:
            try:
                await asyncio.sleep(self.ingestion_interval)
                if self.running:
                    if self.csv_paths:
                        await self.ingest_csv_feeds()
                    else:
                        await self.ingest_mock_feeds()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[FeedIngestion] Error in periodic ingestion: {e}")
                # Continue running even if one ingestion fails
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop(self):
        """Stop the periodic ingestion"""
        self.running = False
        print("[FeedIngestion] Stopped periodic feed ingestion")
    
    async def ingest_now(self) -> Dict[str, Any]:
        """
        Manually trigger ingestion (useful for testing or API endpoints)
        
        Returns:
            Statistics about ingestion
        """
        if self.csv_paths:
            return await self.ingest_csv_feeds()
        else:
            return await self.ingest_mock_feeds()

