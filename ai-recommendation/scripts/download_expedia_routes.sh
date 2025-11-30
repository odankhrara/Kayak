#!/bin/bash
# Script to download Expedia Hotel Recommendations and Airlines/Routes datasets
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

echo "📥 Downloading Expedia and Airlines/Routes datasets..."
echo ""

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Dataset: Expedia Hotel Recommendations (Competition)
echo "1️⃣  Downloading Expedia Hotel Recommendations dataset..."
echo "   Note: This is a Kaggle competition dataset."
echo "   You may need to accept competition rules first:"
echo "   https://www.kaggle.com/competitions/expedia-hotel-recommendations/rules"
echo ""
kaggle competitions download -c expedia-hotel-recommendations -p "$DATA_DIR" --unzip || {
    echo "   ⚠️  Competition download failed. This may require:"
    echo "      1. Accepting competition rules on Kaggle"
    echo "      2. Using kaggle datasets download if data is available as dataset"
    echo "      https://www.kaggle.com/competitions/expedia-hotel-recommendations"
}
echo ""

# Dataset: Airlines, Airport and Routes
echo "2️⃣  Downloading Airlines, Airport and Routes dataset..."
kaggle datasets download -d elmoallistair/airlines-airport-and-routes -p "$DATA_DIR" --unzip || {
    echo "   ❌ Failed. Please download manually:"
    echo "      https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes"
}
echo ""

echo "✅ Download complete!"
echo "📁 Files are in: $DATA_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. Airlines/Routes will be processed by feed ingestion scheduler"
echo "   2. Expedia Hotel data will be processed by feed ingestion scheduler"
echo "   3. Or manually load:"
echo "      python scripts/load_expedia_hotel.py data/raw/train.csv --method kafka"
echo "      python scripts/load_airlines_routes.py data/raw/routes.csv --method kafka"

