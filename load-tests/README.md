# Load Testing Suite

Comprehensive load testing suite for the Kayak Travel Booking System, designed to test **100,000 concurrent users**.

## Overview

This suite includes JMeter test plans that progressively test the system with different optimization levels:

1. **Base Plan**: No optimizations (baseline)
2. **Base + SQL Cache**: With Redis caching
3. **Base + SQL Cache + Kafka**: With caching and async event processing
4. **Full Stack**: Complete end-to-end user journey

## Quick Start

### Prerequisites

1. **JMeter 5.6+** installed
   ```bash
   # macOS
   brew install jmeter
   
   # Or download from https://jmeter.apache.org/download_jmeter.cgi
   ```

2. **System Requirements**
   - Minimum 16GB RAM for JMeter
   - 8+ CPU cores recommended
   - Fast network connection
   - All application services running

3. **Application Running**
   ```bash
   # Start all services
   cd /path/to/kayak-system
   ./start-all.sh
   ```

### Running Tests

#### Option 1: Interactive Script (Recommended)
```bash
cd load-tests
./run-tests.sh
```

#### Option 2: Command Line
```bash
# Base test
jmeter -n -t jmeter/base_plan.jmx -l results/base.csv -e -o results/base_report

# With cache
jmeter -n -t jmeter/base_plus_sql_cache.jmx -l results/base_plus_sql_cache.csv -e -o results/cache_report

# With cache and Kafka
jmeter -n -t jmeter/base_sql_cache_kafka.jmx -l results/base_sql_cache_kafka.csv -e -o results/kafka_report

# Full stack
jmeter -n -t jmeter/full_stack.jmx -l results/full_stack.csv -e -o results/full_stack_report
```

#### Option 3: Custom Configuration
```bash
# Set environment variables
export THREADS=100000
export RAMP_UP=300
export JVM_ARGS="-Xms4g -Xmx8g"

# Run test
./run-tests.sh
```

## Test Plans

### 1. Base Plan (`base_plan.jmx`)
**Purpose**: Baseline performance without optimizations

**Tests**:
- Health check
- Search flights
- Search hotels
- User registration

**Configuration**:
- 100,000 threads
- 300s ramp-up
- 1 loop

**Expected Performance**:
- Response Time: 1-5 seconds
- Throughput: 5,000-10,000 RPS
- May have higher error rates under extreme load

### 2. Base + SQL Cache (`base_plus_sql_cache.jmx`)
**Purpose**: Measure cache performance improvements

**Tests**:
- Cache warm-up phase
- Cached search requests
- Cached GET requests
- Multiple loops to test cache hits

**Configuration**:
- 1,000 threads for warm-up
- 100,000 threads for main test
- 300s ramp-up
- 5 loops

**Expected Performance**:
- Response Time: 100-500ms (cached), 1-3s (uncached)
- Throughput: 15,000-25,000 RPS
- Cache Hit Rate: 70-90%
- Error Rate: < 0.1%

### 3. Base + SQL Cache + Kafka (`base_sql_cache_kafka.jmx`)
**Purpose**: Test async event processing

**Tests**:
- Cached searches
- Booking creation (publishes to Kafka)
- Payment processing (publishes to Kafka)
- Analytics queries (consumes from Kafka)

**Configuration**:
- 100,000 threads
- 300s ramp-up
- 5 loops

**Expected Performance**:
- Response Time: 100-500ms (cached), 500ms-1s (async)
- Throughput: 20,000-30,000 RPS
- Event Processing: Non-blocking, async
- Error Rate: < 0.1%

### 4. Full Stack (`full_stack.jmx`)
**Purpose**: Complete end-to-end user journey

**Tests**:
1. Health check
2. User registration
3. User login (extracts token)
4. Search flights (extracts flight ID)
5. Create booking (uses extracted IDs)
6. Process payment
7. View my trips
8. Get analytics

**Configuration**:
- 100,000 threads
- 300s ramp-up
- 10 loops

**Expected Performance**:
- End-to-end Response Time: 2-5 seconds
- Throughput: 10,000-15,000 complete journeys/sec
- Success Rate: > 99%

## Distributed Testing (Recommended for 100K Users)

For 100,000 concurrent users, distributed testing is highly recommended:

### Setup

1. **Start JMeter servers** on multiple machines:
   ```bash
   # On each server machine
   jmeter-server
   ```

2. **Run test from master**:
   ```bash
   jmeter -n -t jmeter/full_stack.jmx \
     -R server1,server2,server3,server4 \
     -l results/full_stack.csv \
     -e -o results/full_stack_report
   ```

### Recommended Distribution

For 100,000 users:
- **4-8 JMeter servers** (12,500-25,000 users each)
- Each server: 4-8 CPU cores, 8-16GB RAM
- Network: 1Gbps+ between servers and application

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Average Response Time | < 500ms | < 1s | > 2s |
| 95th Percentile | < 1s | < 2s | > 5s |
| 99th Percentile | < 2s | < 5s | > 10s |
| Error Rate | < 0.1% | < 1% | > 5% |
| Throughput | > 20,000 RPS | > 10,000 RPS | < 5,000 RPS |
| Cache Hit Rate | > 80% | > 70% | < 50% |

## Analyzing Results

### View HTML Reports
```bash
# Open generated HTML report
open results/base_report/index.html
```

### Analyze CSV Files
```bash
# Count total requests
wc -l results/base.csv

# Count successful requests
grep "true" results/base.csv | wc -l

# Average response time
awk -F',' '{sum+=$2; count++} END {print "Avg: " sum/count "ms"}' results/base.csv
```

### Key Metrics to Monitor

1. **Response Time Distribution**
   - Min, Max, Average, Median
   - 90th, 95th, 99th percentiles

2. **Throughput**
   - Requests per second
   - Transactions per second

3. **Error Rate**
   - Percentage of failed requests
   - Types of errors (4xx, 5xx)

4. **Resource Utilization**
   - CPU usage on application servers
   - Memory usage
   - Database connection pool usage
   - Network bandwidth

## Troubleshooting

### Out of Memory Errors
```bash
# Increase JMeter heap size
export JVM_ARGS="-Xms4g -Xmx8g -XX:MaxMetaspaceSize=512m"
jmeter -n -t jmeter/base_plan.jmx -l results/base.csv
```

### Connection Refused
- Verify all services are running: `./start-all.sh`
- Check API Gateway is on port 8000
- Verify firewall settings
- Check service logs in `logs/` directory

### High Error Rates
- Check database connection pools
- Verify Kafka is running and has sufficient partitions
- Check Redis cache is running
- Review service logs for errors
- Reduce load or increase ramp-up time

### Slow Response Times
- Check database query performance
- Verify cache is working (check Redis)
- Monitor database connection pool
- Check network latency
- Verify Kafka consumer lag

## Best Practices

1. **Start Small**: Test with 1,000 users first, then scale up
2. **Warm-up**: Always include warm-up phase for cache tests
3. **Monitor Resources**: Watch CPU, memory, network on all servers
4. **Clean Data**: Reset databases between test runs
5. **Multiple Runs**: Run each test 3+ times and average results
6. **Distributed Testing**: Use multiple JMeter instances for 100K+ users
7. **Gradual Ramp-up**: Use 300s+ ramp-up time to avoid overwhelming system
8. **Monitor Application**: Watch application logs during tests

## Configuration Files

- `jmeter/base_plan.jmx` - Base test plan
- `jmeter/base_plus_sql_cache.jmx` - Cache test plan
- `jmeter/base_sql_cache_kafka.jmx` - Kafka test plan
- `jmeter/full_stack.jmx` - Full stack test plan
- `run-tests.sh` - Test runner script

## Results Directory

Results are saved to `results/`:
- CSV files: Raw test data
- HTML reports: Generated reports (with `-e -o` flags)
- Log files: Test execution logs

## Notes

- For 100,000 concurrent users, distributed testing is **highly recommended**
- Consider using cloud instances for JMeter servers
- Monitor application servers closely during tests
- Database connection pools should be sized appropriately (100+ connections)
- Kafka should have sufficient partitions (10+ partitions per topic)
- Redis should have sufficient memory (4GB+ recommended)
- Network bandwidth should be sufficient (1Gbps+ recommended)

## Support

For issues or questions:
1. Check JMeter logs in `results/*.log`
2. Review application logs in `logs/`
3. Verify all services are running
4. Check system resources (CPU, memory, network)

