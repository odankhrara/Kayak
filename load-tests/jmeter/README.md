# JMeter Load Test Plans

This directory contains JMeter test plans for load testing the Kayak Travel Booking System with **100,000 concurrent users**.

## Test Plans

### 1. `base_plan.jmx`
**Base load test without optimizations**
- Tests: Health check, search flights, search hotels, user registration
- Configuration: 100,000 threads, 300s ramp-up, 1 loop
- Purpose: Baseline performance metrics without caching or Kafka

### 2. `base_plus_sql_cache.jmx`
**Load test with SQL caching enabled**
- Tests: Cache warm-up, cached searches, cached GET requests
- Configuration: 100,000 threads, 300s ramp-up, 5 loops
- Purpose: Measure cache hit rates and performance improvements
- Expected: Lower response times due to cache hits

### 3. `base_sql_cache_kafka.jmx`
**Load test with SQL cache and Kafka event streaming**
- Tests: Cached searches, booking creation (Kafka events), payment processing (Kafka events), analytics (Kafka consumer)
- Configuration: 100,000 threads, 300s ramp-up, 5 loops
- Purpose: Test async processing and event-driven architecture
- Expected: Better throughput with async event processing

### 4. `full_stack.jmx`
**Complete end-to-end user journey test**
- Tests: Full user flow - register → login → search → book → pay → view trips → analytics
- Configuration: 100,000 threads, 300s ramp-up, 10 loops
- Purpose: Real-world scenario testing
- Features: Variable extraction, token-based auth, sequential flow

## Prerequisites

1. **JMeter 5.6+** installed
   ```bash
   # macOS
   brew install jmeter
   
   # Or download from: https://jmeter.apache.org/download_jmeter.cgi
   ```

2. **System Requirements for 100K Users**
   - Minimum 16GB RAM
   - 8+ CPU cores
   - Fast network connection
   - Consider distributed testing for very high loads

3. **Application Running**
   - All services must be running
   - API Gateway on port 8000
   - Databases and Kafka running

## Running Tests

### Command Line (Recommended for 100K users)

```bash
# Base test
jmeter -n -t base_plan.jmx -l ../results/base.csv -e -o ../results/base_report

# With cache
jmeter -n -t base_plus_sql_cache.jmx -l ../results/base_plus_sql_cache.csv -e -o ../results/cache_report

# With cache and Kafka
jmeter -n -t base_sql_cache_kafka.jmx -l ../results/base_sql_cache_kafka.csv -e -o ../results/kafka_report

# Full stack
jmeter -n -t full_stack.jmx -l ../results/full_stack.csv -e -o ../results/full_stack_report
```

### GUI Mode (For smaller tests)

```bash
jmeter -t base_plan.jmx
```

### Distributed Testing (For 100K+ users)

For 100,000 concurrent users, consider distributed testing:

1. **Start JMeter servers** on multiple machines:
   ```bash
   jmeter-server
   ```

2. **Run test from master**:
   ```bash
   jmeter -n -t full_stack.jmx -R server1,server2,server3 -l results.csv
   ```

## Configuration

### Adjusting Load

Edit the test plan variables:
- `THREADS`: Number of concurrent users (default: 100000)
- `RAMP_UP`: Time to ramp up all threads in seconds (default: 300)
- `LOOPS`: Number of iterations per thread (default: 1-10)

### API Gateway URL

Change `API_GATEWAY_URL` variable if your API Gateway is not on `localhost:8000`.

## Results

Results are saved to `../results/` directory:
- CSV files: Raw test data
- HTML reports: Generated with `-e -o` flags

### Key Metrics to Monitor

1. **Response Time**
   - Average, Median, 90th percentile, 95th percentile, 99th percentile
   - Target: < 500ms for cached requests, < 2s for uncached

2. **Throughput**
   - Requests per second
   - Target: > 10,000 RPS for 100K users

3. **Error Rate**
   - Percentage of failed requests
   - Target: < 0.1%

4. **Concurrent Users**
   - Active threads over time
   - Verify all 100K users are active

## Performance Expectations

### Base Plan (No Optimizations)
- Response Time: 1-5 seconds
- Throughput: 5,000-10,000 RPS
- Error Rate: May be higher under load

### Base + SQL Cache
- Response Time: 100-500ms (cached), 1-3s (uncached)
- Throughput: 15,000-25,000 RPS
- Error Rate: < 0.1%
- Cache Hit Rate: 70-90%

### Base + SQL Cache + Kafka
- Response Time: 100-500ms (cached), 500ms-1s (async)
- Throughput: 20,000-30,000 RPS
- Error Rate: < 0.1%
- Event Processing: Async, non-blocking

### Full Stack
- End-to-end Response Time: 2-5 seconds
- Throughput: 10,000-15,000 complete journeys/sec
- Success Rate: > 99%

## Troubleshooting

### Out of Memory Errors
- Increase JMeter heap size: `JVM_ARGS="-Xms4g -Xmx8g" jmeter`
- Use distributed testing

### Connection Refused
- Verify all services are running
- Check firewall settings
- Verify port availability

### High Error Rates
- Check database connection pools
- Verify Kafka is running
- Check service logs
- Reduce load or increase ramp-up time

## Best Practices

1. **Start Small**: Test with 1,000 users first, then scale up
2. **Monitor Resources**: Watch CPU, memory, network on all servers
3. **Warm-up**: Always include warm-up phase for cache tests
4. **Clean Data**: Reset databases between test runs
5. **Multiple Runs**: Run each test 3+ times and average results
6. **Distributed Testing**: Use multiple JMeter instances for 100K+ users

## Notes

- For 100,000 concurrent users, distributed testing is highly recommended
- Consider using cloud instances for JMeter servers
- Monitor application servers closely during tests
- Database connection pools should be sized appropriately
- Kafka should have sufficient partitions for high throughput

