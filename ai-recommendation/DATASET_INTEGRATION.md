# Dataset Integration Guide

This document explains how to integrate Kaggle datasets into the AI Recommendation Service.

## Overview

The AI Recommendation Service now supports:
- CSV feed processing from Kaggle datasets
- Data normalization for different dataset types
- Price history tracking (30-day averages)
- Enhanced deal scoring based on historical data

## Supported Datasets

### 1. Inside Airbnb (NYC)
- **Source**: https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc
- **Type**: Hotel/Listing data
- **Fields**: name, price, neighbourhood, amenities, ratings, etc.

### 2. Hotel Booking Demand
- **Source**: https://www.kaggle.com/datasets/mojtaba142/hotel-booking
- **Type**: Hotel behavior data
- **Fields**: hotel, country, adr (average daily rate), availability, etc.

### 3. Flight Price Prediction
- **Source**: https://www.kaggle.com/datasets/shubhambathwal/flight-price-prediction
- **Type**: Flight pricing data
- **Fields**: airline, source_city, destination_city, price, duration, etc.

## Setup

### 1. Download Datasets

Download the datasets from Kaggle and place them in the `datasets/` directory:

```bash
mkdir -p ai-recommendation/datasets
# Download and place CSV files:
# - airbnb_nyc.csv (or similar name)
# - hotel_booking.csv
# - flight_prices.csv
```

### 2. Install Dependencies

```bash
cd ai-recommendation
pip install -r requirements.txt
# Or with Poetry:
poetry install
```

### 3. Configure Environment

Update `.env` file:

```env
DATABASE_URL=sqlite:///./ai_recommendations.db
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_FEEDS=raw_supplier_feeds
DATASETS_DIR=./datasets
```

## Usage

### Load Datasets into Kafka

Run the dataset loader:

```bash
cd ai-recommendation
python -m app.data.dataset_loader
```

This will:
1. Read CSV files from the `datasets/` directory
2. Normalize data according to dataset type
3. Publish normalized records to Kafka `raw_supplier_feeds` topic

### Process with Ingestion Worker

The ingestion worker (already running in the service) will:
1. Consume messages from Kafka
2. Calculate 30-day price averages
3. Detect deals using historical data
4. Score deals based on price drops vs. historical averages
5. Store deals in the database

## How It Works

### 1. CSV Processing

The `CSVProcessor` class:
- Reads CSV files using pandas
- Normalizes data to a common format
- Handles different dataset schemas
- Yields normalized records

### 2. Price History Tracking

The `PriceHistoryTracker` class:
- Calculates 30-day average prices
- Stores price points with timestamps
- Provides historical context for deal detection

### 3. Enhanced Deal Detection

The `DealDetector` now:
- Uses 30-day price averages for scoring
- Awards bonus points for prices ≥15% below average
- Considers historical trends in deal scoring

### 4. Deal Scoring Formula

Deal score (0-100) is calculated from:
- **Discount percentage** (0-50 points)
- **Price factor** (0-30 points) - lower prices score higher
- **Availability** (0-20 points)
- **Historical trend** (0-15 bonus points):
  - ≥15% below 30-day average: +15 points
  - ≥10% below average: +10 points
  - ≥5% below average: +5 points

## Example

### Loading a Dataset

```python
from app.data.dataset_loader import DatasetLoader
import asyncio

async def load_data():
    loader = DatasetLoader()
    await loader.load_airbnb_dataset("./datasets/airbnb_nyc.csv")

asyncio.run(load_data())
```

### Processing with Historical Context

The ingestion worker automatically:
1. Gets 30-day average for a listing
2. Compares current price to average
3. Scores the deal with historical bonus
4. Stores the price point for future calculations

## Data Flow

```
Kaggle CSV Files
    ↓
CSVProcessor (normalize)
    ↓
DatasetLoader (publish to Kafka)
    ↓
Kafka Topic: raw_supplier_feeds
    ↓
IngestionWorker (consume)
    ↓
PriceHistoryTracker (get 30-day avg)
    ↓
DealDetector (score with historical data)
    ↓
Database (store deals)
```

## Notes

- The first 30 days will have limited historical data
- Price averages improve as more data is collected
- Historical scoring only applies when 30-day average exists
- All datasets are normalized to a common format for processing

## Troubleshooting

### Dataset Not Found
- Check `DATASETS_DIR` environment variable
- Verify CSV files are in the correct directory
- Ensure file names match expected patterns

### Kafka Connection Issues
- Verify Kafka is running: `docker ps | grep kafka`
- Check `KAFKA_BOOTSTRAP_SERVERS` in `.env`
- Ensure topic `raw_supplier_feeds` exists

### Price History Not Working
- Ensure deals have been created (need data for 30-day window)
- Check database connection
- Verify `last_price_update` field exists in models

