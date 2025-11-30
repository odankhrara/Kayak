#!/usr/bin/env python3
"""
Load Flight Prices dataset (dilwong/flightprices) into the system

Dataset: https://www.kaggle.com/datasets/dilwong/flightprices

This script:
1. Reads the Flight Prices CSV file
2. Normalizes the data
3. Publishes to Kafka for processing
4. Or directly creates flight deals in the database
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.data.csv_processor import CSVProcessor
from app.data.dataset_loader import DatasetLoader
from app.db.session import get_session, create_db_and_tables
from app.models import FlightDeal
from app.deals_agent.deal_detector import DealDetector
from app.deals_agent.offer_tagger import OfferTagger
from sqlmodel import Session, select
from datetime import datetime
import os


async def load_to_kafka(csv_path: str):
    """Load dataset to Kafka (recommended - uses ingestion worker)"""
    print(f"📤 Loading {csv_path} to Kafka...")
    loader = DatasetLoader()
    await loader.load_flightprices_dataset(csv_path)
    print("✅ Data published to Kafka. Ingestion worker will process it.")


def load_directly_to_db(csv_path: str, limit: int = 100):
    """Load dataset directly to database (for testing)"""
    print(f"📥 Loading {csv_path} directly to database (first {limit} records)...")
    
    # Initialize database
    create_db_and_tables()
    
    # Process CSV
    records = CSVProcessor.process_dataset(csv_path, "flightprices")
    
    # Get session
    session_gen = get_session()
    session = next(session_gen)
    
    deal_detector = DealDetector()
    offer_tagger = OfferTagger()
    
    count = 0
    deals_created = 0
    
    try:
        for record in records:
            if count >= limit:
                break
            
            # Skip if price is 0 or invalid
            price = record.get("price", 0)
            if price <= 0:
                continue
            
            # Check if deal already exists
            airline = record.get("airline", "")
            flight_number = record.get("flight_number", "")
            statement = select(FlightDeal).where(
                FlightDeal.airline == airline,
                FlightDeal.flight_number == flight_number
            )
            existing = session.exec(statement).first()
            
            if existing:
                continue  # Skip duplicates
            
            # Detect deal
            deal_info = deal_detector.detect_flight_deal(record)
            
            # Only create if it's a good deal (or for testing, create all)
            if deal_info.get("is_good_deal") or True:  # Create all for testing
                # Tag the offer
                tags = offer_tagger.tag_flight(record)
                
                # Parse dates
                dep_time_str = record.get("departure_time", "")
                arr_time_str = record.get("arrival_time", "")
                
                try:
                    dep_time = datetime.fromisoformat(dep_time_str) if dep_time_str else datetime.now()
                except:
                    dep_time = datetime.now()
                
                try:
                    arr_time = datetime.fromisoformat(arr_time_str) if arr_time_str else datetime.now()
                except:
                    arr_time = datetime.now()
                
                # Create flight deal
                flight_deal = FlightDeal(
                    airline=airline,
                    flight_number=flight_number,
                    origin=record.get("origin", ""),
                    destination=record.get("destination", ""),
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    original_price=deal_info.get("original_price", price),
                    discounted_price=deal_info.get("discounted_price", price),
                    discount_percentage=deal_info.get("discount_percentage", 0),
                    deal_score=deal_info.get("deal_score", 50),
                    tags=",".join(tags),
                    available_seats=record.get("available_seats", 10)
                )
                
                session.add(flight_deal)
                deals_created += 1
            
            count += 1
            
            if count % 10 == 0:
                print(f"  Processed {count} records, created {deals_created} deals...")
        
        session.commit()
        print(f"\n✅ Successfully loaded {deals_created} flight deals from {count} records")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Load Flight Prices dataset (dilwong/flightprices)")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="data/raw/flightprices.csv",
        help="Path to Flight Prices CSV file (default: data/raw/flightprices.csv)"
    )
    parser.add_argument(
        "--method",
        choices=["kafka", "direct"],
        default="kafka",
        help="Load method: kafka (uses ingestion worker) or direct (to database)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Limit number of records (for direct method only)"
    )
    
    args = parser.parse_args()
    
    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        print("\n📥 To download the dataset:")
        print("   1. Install Kaggle CLI: pip install kaggle")
        print("   2. Set up API credentials: https://www.kaggle.com/settings")
        print("   3. Run: ./scripts/download_additional_datasets.sh")
        print("\n   Or download manually from:")
        print("   https://www.kaggle.com/datasets/dilwong/flightprices")
        sys.exit(1)
    
    if args.method == "kafka":
        asyncio.run(load_to_kafka(str(csv_path)))
    else:
        load_directly_to_db(str(csv_path), args.limit)


if __name__ == "__main__":
    main()

