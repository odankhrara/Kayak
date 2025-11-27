🚀 Kayak – Distributed Systems Project (Kafka Middleware + AI Ingestion)
Final Project – Tier-2 Middleware: Kafka-Based Event Pipeline

This README explains how to run the Kafka pipeline, how ingestion works, how booking/billing events flow, and how to run the CSV→Kafka AI ingestion using Python.

This document is meant for all team members so everyone can run the system without needing manual guidance.




📦 1. Prerequisites

Install the following:

Docker Desktop

Node.js 18+

Python 3.10+

pip

VSCode (recommended)




🐳 2. Start Kafka Using Docker

Navigate to:

Kayak/src/infra

Start Kafka + Zookeeper:

docker-compose up -d


Verify containers:

docker ps


Expected containers:

kayak-kafka

kayak-zookeeper


🧵 3. Create Required Kafka Topics

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic booking_created --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic booking_updated --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic payment_succeeded --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic payment_failed --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic user_tracking --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic click_event --partitions 3 --replication-factor 1

docker exec kayak-kafka \
  kafka-topics --bootstrap-server localhost:9092 \
  --create --if-not-exists --topic raw_supplier_feeds --partitions 3 --replication-factor 1




📡 4. How to Consume Kafka Messages

Example: listen to booking_created:

docker exec -it kayak-kafka \
  kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic booking_created --from-beginning


Example: listen to raw_supplier_feeds:

docker exec -it kayak-kafka \
  kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic raw_supplier_feeds --from-beginning



  🧩 5. Node.js Kafka Integration
Shared Kafka client is located at:
src/services/common/src/kafka/kafkaClient.ts

Sends messages using:
await sendKafkaMessage(KAFKA_TOPICS.PAYMENT_SUCCEEDED, payload)





💳 6. Billing Service → Kafka (Payment Events)

Billing controller automatically publishes:

payment_succeeded

payment_failed

To test billing producer:

npx ts-node src/services/common/src/kafka/manualPaymentTest.ts


Expected output:

Kafka producer connected
Sent message to topic payment_succeeded
Done.





📊 7. Analytics Service Kafka Consumer

Navigate:

src/services/analytics-service


Install deps:

npm install


Run analytics Kafka consumer:

npx ts-node src/kafka/bookingPaymentConsumer.ts


You should see:

Analytics consumer listening on booking/payment topics...
[Analytics] topic=booking_created ...
[Analytics] topic=payment_succeeded ...




🤖 8. AI Recommendation Service – CSV → Kafka Producer

Navigate to AI directory:

cd Kayak/ai-recommendation


Install Python dependencies:

pip install -r requirements.txt

Place your Kaggle dataset CSVs here:
ai-recommendation/data/raw/


Example:

ai-recommendation/data/raw/hotel_prices_sample.csv

Running the CSV → Kafka producer

Set Kafka servers:

set KAFKA_BOOTSTRAP_SERVERS=localhost:9092


Run the producer:

python -m app.deals_agent.csv_producer


Expected output:

[CSV->Kafka] Sent 100 messages to topic 'raw_supplier_feeds'

Confirm in Kafka:
docker exec -it kayak-kafka \
  kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic raw_supplier_feeds --from-beginning


You will see flight/hotel rows streaming in JSON.





🧠 9. AI Kafka Consumer (Optional – Team Member Work)

Your teammate will implement:

deals.normalized

deals.scored

deals.tagged

scoring rules

websocket notifications

You don’t need to do this part unless asked.

📁 10. Folder Structure (Important)
Kayak/
│
├── src/
│   ├── infra/ (Kafka Docker compose)
│   ├── services/
│   │   ├── booking-billing-service
│   │   ├── analytics-service
│   │   └── common (Kafka shared client)
│
├── ai-recommendation/
│   ├── app/
│   │   ├── kafka/ (Python producer & consumer)
│   │   ├── deals_agent/
│   │   ├── schemas/
│   ├── data/
│   │   └── raw/ (CSV files go here)



🧪 11. Manual Test: Produce + Consume
Produce
npx ts-node src/services/common/src/kafka/manualPaymentTest.ts

Consume
docker exec -it kayak-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic payment_succeeded --from-beginning

🟦 12. Troubleshooting
CSV not found?

Ensure data is here:

ai-recommendation/data/raw/hotel_prices_sample.csv

Kafka connection timeout?

Restart Kafka:

docker-compose down
docker-compose up -d