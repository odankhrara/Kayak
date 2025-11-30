#!/usr/bin/env python3
"""
Load Inside Airbnb NYC dataset into the system

This script:
1. Reads the Inside Airbnb NYC CSV file
2. Normalizes the data
3. Publishes to Kafka for processing
4. Or directly creates hotel deals in the database
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.data.csv_processor import CSVProcessor
from app.data.dataset_loader import DatasetLoader
from app.db.session import get_session, create_db_and_tables
from app.models import HotelDeal
from app.deals_agent.deal_detector import DealDetector
from app.deals_agent.offer_tagger import OfferTagger
from sqlmodel import Session, select
import os


async def load_to_kafka(csv_path: str):
    """Load dataset to Kafka (recommended - uses ingestion worker)"""
    print(f"📤 Loading {csv_path} to Kafka...")
    loader = DatasetLoader()
    await loader.load_airbnb_dataset(csv_path)
    print("✅ Data published to Kafka. Ingestion worker will process it.")


def load_directly_to_db(csv_path: str, limit: int = 100):
    """Load dataset directly to database (for testing)"""
    print(f"📥 Loading {csv_path} directly to database (first {limit} records)...")
    
    # Initialize database
    create_db_and_tables()
    
    # Process CSV
    records = CSVProcessor.process_dataset(csv_path, "airbnb")
    
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
            price = record.get("price_per_night", 0)
            if price <= 0:
                continue
            
            # Check if deal already exists
            listing_id = record.get("listing_id", "")
            statement = select(HotelDeal).where(
                HotelDeal.name == record.get("name", "")
            )
            existing = session.exec(statement).first()
            
            if existing:
                continue  # Skip duplicates
            
            # Detect deal
            deal_info = deal_detector.detect_hotel_deal(record)
            
            # Only create if it's a good deal (or for testing, create all)
            if deal_info.get("is_good_deal") or True:  # Create all for testing
                # Tag the offer
                tags = offer_tagger.tag_hotel(record)
                
                # Create hotel deal
                hotel_deal = HotelDeal(
                    name=record.get("name", "Unknown")[:100],  # Limit length
                    city=record.get("city", "NYC"),
                    state=record.get("state", "NY"),
                    country=record.get("country", "USA"),
                    address=record.get("address", "")[:200] if record.get("address") else "",
                    original_price_per_night=deal_info.get("original_price_per_night", price),
                    discounted_price_per_night=deal_info.get("discounted_price_per_night", price),
                    discount_percentage=deal_info.get("discount_percentage", 0),
                    deal_score=deal_info.get("deal_score", 50),
                    tags=",".join(tags),
                    available_rooms=record.get("available_rooms", 1),
                    rating=record.get("rating", 0) / 20 if record.get("rating", 0) > 0 else None  # Convert 0-100 to 0-5
                )
                
                session.add(hotel_deal)
                deals_created += 1
            
            count += 1
            
            if count % 10 == 0:
                print(f"  Processed {count} records, created {deals_created} deals...")
        
        session.commit()
        print(f"\n✅ Successfully loaded {deals_created} hotel deals from {count} records")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Load Inside Airbnb NYC dataset")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="data/raw/listings.csv",
        help="Path to Inside Airbnb NYC CSV file (default: data/raw/listings.csv)"
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
        print("   3. Run: ./scripts/download_airbnb_nyc.sh")
        print("\n   Or download manually from:")
        print("   - https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc")
        print("   - https://www.kaggle.com/datasets/ahmedmagdee/inside-airbnb")
        sys.exit(1)
    
    if args.method == "kafka":
        asyncio.run(load_to_kafka(str(csv_path)))
    else:
        load_directly_to_db(str(csv_path), args.limit)


if __name__ == "__main__":
    main()

