#!/bin/bash
# Script to download Inside Airbnb NYC dataset from Kaggle
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

echo "📥 Downloading Inside Airbnb NYC dataset..."

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Download from primary source
echo "Downloading from primary source (dominoweir/inside-airbnb-nyc)..."
kaggle datasets download -d dominoweir/inside-airbnb-nyc -p "$DATA_DIR" --unzip || {
    echo "⚠️  Primary source failed, trying alternative..."
    # Try alternative source
    kaggle datasets download -d ahmedmagdee/inside-airbnb -p "$DATA_DIR" --unzip || {
        echo "❌ Both sources failed. Please download manually:"
        echo "   1. https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc"
        echo "   2. https://www.kaggle.com/datasets/ahmedmagdee/inside-airbnb"
        echo "   Place the CSV file(s) in: $DATA_DIR"
        exit 1
    }
}

echo "✅ Dataset downloaded successfully!"
echo "📁 Files are in: $DATA_DIR"
echo ""
echo "📋 Next steps:"
echo "   1. The feed ingestion scheduler will automatically process CSV files"
echo "   2. Or manually load: python -m app.data.dataset_loader"

