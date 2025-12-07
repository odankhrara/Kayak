"""CSV -> Kafka producer for hotel pricing feeds."""
import asyncio
import csv
import os
from pathlib import Path
from typing import Dict, Any

from app.kafka.producer import create_async_producer


CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "raw" / "hotel_prices_sample.csv"
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_RAW_FEEDS", "raw_supplier_feeds")
ROW_LIMIT = 100


def build_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map CSV row to the normalized payload expected downstream."""
    return {
        "source": "hotel_csv",
        "hotel_id": row.get("hotel_id") or row.get("listing_id"),
        "listing_id": row.get("listing_id") or row.get("hotel_id"),
        "city": row.get("city"),
        "price": row.get("price") or row.get("price_per_night"),
        "currency": row.get("currency") or "USD",
        "check_in": row.get("check_in") or row.get("checkin") or row.get("date"),
        "check_out": row.get("check_out") or row.get("checkout"),
        "raw": row,  # keep original fields for debugging
    }


async def produce_from_csv(csv_path: Path = CSV_PATH, row_limit: int = ROW_LIMIT):
    producer = None
    sent = 0

    try:
        # Check if Kafka is available before proceeding
        from app.kafka.producer import check_kafka_connection, get_bootstrap_servers
        bootstrap_servers = get_bootstrap_servers()
        
        if not await check_kafka_connection(bootstrap_servers):
            print(f"[CSV->Kafka] ⚠️  Kafka is not available. Skipping CSV ingestion for {csv_path.name}")
            print(f"[CSV->Kafka] 💡 Kafka is optional - the service will continue without it")
            return
        
        producer = create_async_producer()
        await producer.start()
        
        with csv_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                payload = build_payload(row)
                await producer.send(KAFKA_TOPIC, value=payload)
                sent += 1
                if sent >= row_limit:
                    break
        print(f"[CSV->Kafka] ✅ Sent {sent} messages to topic '{KAFKA_TOPIC}' from {csv_path.name}")
    except FileNotFoundError:
        print(f"[CSV->Kafka] CSV not found at {csv_path}; nothing sent.")
    except Exception as exc:
        print(f"[CSV->Kafka] ❌ Error producing messages: {exc}")
        print(f"[CSV->Kafka] 💡 This is non-critical - the service will continue without Kafka")
    finally:
        if producer:
            try:
                await producer.stop()
            except Exception as e:
                print(f"[CSV->Kafka] ⚠️  Error closing producer: {e}")


if __name__ == "__main__":
    asyncio.run(produce_from_csv())
