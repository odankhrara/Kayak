#!/usr/bin/env python3
"""
Load Airlines, Airport and Routes dataset into the system

Dataset: https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes

This script:
1. Reads the Airlines/Routes CSV file
2. Normalizes the route data
3. Can be used to validate flight routes and find available connections
4. Note: This is route data, not pricing data, so it's used for route validation
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.data.csv_processor import CSVProcessor
from app.data.dataset_loader import DatasetLoader
import os


async def load_to_kafka(csv_path: str):
    """Load dataset to Kafka"""
    print(f"📤 Loading {csv_path} to Kafka...")
    print("   Note: This is route data, not pricing data.")
    print("   It will be used for route validation and finding available connections.")
    loader = DatasetLoader()
    await loader.load_airlines_routes_dataset(csv_path)
    print("✅ Route data published to Kafka.")


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Load Airlines, Airport and Routes dataset")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="data/raw/routes.csv",
        help="Path to Routes CSV file (default: data/raw/routes.csv)"
    )
    
    args = parser.parse_args()
    
    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        print("\n📥 To download the dataset:")
        print("   1. Install Kaggle CLI: pip install kaggle")
        print("   2. Set up API credentials: https://www.kaggle.com/settings")
        print("   3. Run: ./scripts/download_expedia_routes.sh")
        print("\n   Or download manually from:")
        print("   https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes")
        sys.exit(1)
    
    asyncio.run(load_to_kafka(str(csv_path)))


if __name__ == "__main__":
    main()

