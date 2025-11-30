#!/bin/bash
# Script to download all Kaggle datasets for the AI Recommendation Service
# 
# Prerequisites:
# 1. Install Kaggle CLI: pip install kaggle
# 2. Set up Kaggle API credentials:
#    - Go to https://www.kaggle.com/settings -> API -> Create New Token
#    - Place kaggle.json in ~/.kaggle/kaggle.json
#    - chmod 600 ~/.kaggle/kaggle.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data/raw"

echo "📥 Downloading all Kaggle datasets for AI Recommendation Service..."
echo ""

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Dataset 1: Inside Airbnb NYC
echo "1️⃣  Downloading Inside Airbnb NYC dataset..."
kaggle datasets download -d dominoweir/inside-airbnb-nyc -p "$DATA_DIR" --unzip || {
    echo "   ⚠️  Primary source failed, trying alternative..."
    kaggle datasets download -d ahmedmagdee/inside-airbnb -p "$DATA_DIR" --unzip || {
        echo "   ❌ Failed. Please download manually:"
        echo "      https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc"
    }
}
echo ""

# Dataset 2: Hotel Booking Demand
echo "2️⃣  Downloading Hotel Booking Demand dataset..."
kaggle datasets download -d mojtaba142/hotel-booking -p "$DATA_DIR" --unzip || {
    echo "   ❌ Failed. Please download manually:"
    echo "      https://www.kaggle.com/datasets/mojtaba142/hotel-booking"
}
echo ""

# Dataset 3: Flight Price Prediction
echo "3️⃣  Downloading Flight Price Prediction dataset..."
kaggle datasets download -d shubhambathwal/flight-price-prediction -p "$DATA_DIR" --unzip || {
    echo "   ❌ Failed. Please download manually:"
    echo "      https://www.kaggle.com/datasets/shubhambathwal/flight-price-prediction"
}
echo ""

echo "✅ Download complete!"
echo "📁 Files are in: $DATA_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. The feed ingestion scheduler will automatically process CSV files every 30 minutes"
echo "   2. Or manually load datasets:"
echo "      python scripts/load_airbnb_nyc.py data/raw/listings.csv --method kafka"
echo "      python scripts/load_hotel_booking.py data/raw/hotel_booking.csv --method kafka"
echo "      python scripts/load_flight_prices.py data/raw/flight_prices.csv --method kafka"

