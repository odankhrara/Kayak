# Kafka Issues and Fixes

## 🔍 Issues Identified

Based on the error logs and codebase analysis, here are the main Kafka-related issues:

### 1. **Connection Refused Errors**
- **Symptom**: `KafkaConnectionError: Unable to bootstrap from [('localhost', 9092, <AddressFamily.AF_UNSPEC: 0>)]`
- **Cause**: 
  - Kafka container might not be fully ready when the AI service tries to connect
  - No retry logic for connection attempts
  - Race condition during service startup

### 2. **Unclosed AIOKafkaProducer Warnings**
- **Symptom**: `Unclosed AIOKafkaProducer` warnings in logs
- **Cause**: 
  - Producers not being properly closed in error paths
  - Missing `finally` blocks with proper cleanup

### 3. **No Connection Health Checks**
- **Symptom**: Service attempts to connect to Kafka without checking if it's available
- **Cause**: 
  - No pre-connection validation
  - Service fails hard when Kafka is unavailable (even though it's optional)

## ✅ Fixes Applied

### 1. **Added Connection Retry Logic**
- Created `check_kafka_connection()` function in `producer.py`
- Implements retry logic with configurable attempts and delays
- Tests connection before creating producers

### 2. **Improved Error Handling**
- Added graceful handling when Kafka is unavailable
- Service continues to work even if Kafka connection fails
- Clear error messages indicating Kafka is optional

### 3. **Better Resource Cleanup**
- Ensured all producers are properly closed in `finally` blocks
- Added exception handling around `producer.stop()` calls
- Prevents "Unclosed AIOKafkaProducer" warnings

### 4. **Enhanced Producer Configuration**
- Added connection timeout settings:
  - `request_timeout_ms=30000` (30 seconds)
  - `retry_backoff_ms=100` (100ms between retries)
  - `max_block_ms=60000` (60 seconds max block time)

## 📋 Files Modified

1. **`ai-recommendation/app/kafka/producer.py`**
   - Added `check_kafka_connection()` function
   - Enhanced `create_async_producer()` with timeout settings
   - Added proper imports for error handling

2. **`ai-recommendation/app/deals_agent/csv_producer.py`**
   - Added Kafka connection check before processing
   - Improved error handling and cleanup
   - Better error messages

3. **`ai-recommendation/app/deals_agent/feed_ingestion_scheduler.py`**
   - Added Kafka connection check for mock feeds
   - Improved error handling and cleanup
   - Graceful degradation when Kafka is unavailable

## 🚀 How to Use

### Starting Kafka

Kafka is configured in Docker Compose. To start it:

```bash
# Start Kafka and Zookeeper
cd src/infra
docker-compose up -d kafka zookeeper

# Or start all infrastructure
docker-compose up -d
```

### Verifying Kafka is Running

```bash
# Check if Kafka container is running
docker ps | grep kafka

# Check Kafka logs
docker logs kayak-kafka

# Test connection
nc -zv localhost 9092
```

### Configuration

Kafka connection is configured via environment variables:

```env
# In ai-recommendation/.env
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RAW_FEEDS=raw_supplier_feeds
KAFKA_TOPIC_EVENTS=deal.events
```

**Note**: If running inside Docker, use `kafka:29092` instead of `localhost:9092`.

## 💡 Important Notes

1. **Kafka is Optional**: The AI service will continue to work even if Kafka is unavailable. The service gracefully handles connection failures.

2. **Connection Retries**: The service now retries Kafka connections up to 3 times with a 2-second delay between attempts.

3. **Error Messages**: When Kafka is unavailable, you'll see clear messages indicating:
   - Kafka is not available
   - The service will continue without it
   - This is non-critical

4. **Resource Cleanup**: All Kafka producers are now properly closed, preventing resource leaks and "Unclosed AIOKafkaProducer" warnings.

## 🔧 Troubleshooting

### Issue: Connection Refused
**Solution**: 
1. Ensure Kafka container is running: `docker ps | grep kafka`
2. Check Kafka logs: `docker logs kayak-kafka`
3. Verify port 9092 is accessible: `nc -zv localhost 9092`
4. Wait a few seconds after starting Kafka before running the AI service

### Issue: Unclosed Producer Warnings
**Solution**: 
- This should be fixed with the new cleanup logic
- If you still see warnings, check that all error paths properly close producers

### Issue: Service Fails to Start
**Solution**: 
- The service should now continue even if Kafka is unavailable
- Check logs for specific error messages
- Verify environment variables are set correctly

## 📊 Expected Behavior

### When Kafka is Available:
- ✅ CSV files are ingested and published to Kafka
- ✅ Mock feeds are generated and sent to Kafka
- ✅ Deal detection pipeline processes messages
- ✅ Events are emitted to WebSocket clients

### When Kafka is Unavailable:
- ⚠️  Connection attempts are made with retries
- ⚠️  Clear error messages are logged
- ✅ Service continues to work (Kafka features disabled)
- ✅ No crashes or hard failures

## 🎯 Next Steps

1. **Test the fixes**: Restart the AI service and verify Kafka connections work properly
2. **Monitor logs**: Check for any remaining connection issues
3. **Verify cleanup**: Ensure no "Unclosed AIOKafkaProducer" warnings appear
4. **Test graceful degradation**: Stop Kafka and verify the service continues to work

