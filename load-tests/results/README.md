# Load Test Results

This directory contains JMeter test results in CSV format.

## Expected Files

After running tests, you should see:
- `base.csv` - Base test results
- `base_plus_sql_cache.csv` - Cache test results
- `base_sql_cache_kafka.csv` - Kafka test results
- `full_stack.csv` - Full stack test results

## CSV Format

Each CSV file contains the following columns:
- `timeStamp` - Request timestamp
- `elapsed` - Response time in milliseconds
- `label` - Request label/name
- `responseCode` - HTTP response code
- `responseMessage` - Response message
- `threadName` - Thread name
- `dataType` - Data type
- `success` - Success (true/false)
- `failureMessage` - Failure message if any
- `bytes` - Response size in bytes
- `sentBytes` - Request size in bytes
- `grpThreads` - Group threads
- `allThreads` - All threads
- `URL` - Request URL
- `Latency` - Latency in milliseconds
- `IdleTime` - Idle time
- `Connect` - Connection time

## Analyzing Results

### Using JMeter GUI
1. Open JMeter
2. File → Load → Select CSV file
3. View results in listeners

### Using Command Line Tools
```bash
# Count total requests
wc -l base.csv

# Count successful requests
grep "true" base.csv | wc -l

# Count failed requests
grep "false" base.csv | wc -l

# Average response time
awk -F',' '{sum+=$2; count++} END {print sum/count}' base.csv
```

### Generating HTML Reports
```bash
jmeter -g base.csv -o base_report/
```

## Performance Targets

For 100,000 concurrent users:

| Metric | Target | Acceptable |
|--------|--------|------------|
| Average Response Time | < 500ms | < 1s |
| 95th Percentile | < 1s | < 2s |
| 99th Percentile | < 2s | < 5s |
| Error Rate | < 0.1% | < 1% |
| Throughput | > 20,000 RPS | > 10,000 RPS |

