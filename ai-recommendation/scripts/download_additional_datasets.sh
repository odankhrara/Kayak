#!/bin/bash
# Script to download additional Kaggle datasets
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

echo "📥 Downloading additional Kaggle datasets..."
echo ""

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Dataset: Flight Prices (dilwong)
echo "1️⃣  Downloading Flight Prices dataset (dilwong/flightprices)..."
kaggle datasets download -d dilwong/flightprices -p "$DATA_DIR" --unzip || {
    echo "   ❌ Failed. Please download manually:"
    echo "      https://www.kaggle.com/datasets/dilwong/flightprices"
}
echo ""

# Dataset: Global Airports
echo "2️⃣  Downloading Global Airports dataset..."
kaggle datasets download -d samvelkoch/global-airports-iata-icao-timezone-geo -p "$DATA_DIR" --unzip || {
    echo "   ❌ Failed. Please download manually:"
    echo "      https://www.kaggle.com/datasets/samvelkoch/global-airports-iata-icao-timezone-geo"
}
echo ""

echo "✅ Download complete!"
echo "📁 Files are in: $DATA_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. Global Airports will be automatically loaded by AirportMapper"
echo "   2. Flight Prices will be processed by feed ingestion scheduler"
echo "   3. Or manually load: python scripts/load_flightprices.py data/raw/flightprices.csv --method kafka"

