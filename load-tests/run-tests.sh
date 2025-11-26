#!/bin/bash

# Kayak Load Test Runner
# This script runs JMeter load tests with proper configuration for 100K users

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JMETER_DIR="$SCRIPT_DIR/jmeter"
RESULTS_DIR="$SCRIPT_DIR/results"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
JMETER_HOME="${JMETER_HOME:-/usr/local/bin}"
JVM_ARGS="${JVM_ARGS:--Xms4g -Xmx8g -XX:MaxMetaspaceSize=512m}"
THREADS="${THREADS:-100000}"
RAMP_UP="${RAMP_UP:-300}"

echo -e "${GREEN}Kayak Load Test Runner${NC}"
echo "================================"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}Error: JMeter is not installed or not in PATH${NC}"
    echo "Install JMeter: brew install jmeter (macOS) or download from https://jmeter.apache.org"
    exit 1
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run a test
run_test() {
    local test_name=$1
    local jmx_file=$2
    local result_file=$3
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "JMX File: $jmx_file"
    echo "Results: $result_file"
    echo "Threads: $THREADS"
    echo "Ramp-up: ${RAMP_UP}s"
    echo ""
    
    # Set JVM args and run JMeter
    export JVM_ARGS
    
    jmeter -n \
        -t "$JMETER_DIR/$jmx_file" \
        -l "$RESULTS_DIR/$result_file" \
        -JTHREADS=$THREADS \
        -JRAMP_UP=$RAMP_UP \
        -e -o "$RESULTS_DIR/${result_file%.csv}_report" \
        2>&1 | tee "$RESULTS_DIR/${result_file%.csv}.log"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓ Test completed: $test_name${NC}"
        echo "Results: $RESULTS_DIR/$result_file"
        echo "Report: $RESULTS_DIR/${result_file%.csv}_report/index.html"
        echo ""
    else
        echo -e "${RED}✗ Test failed: $test_name${NC}"
        echo ""
        return 1
    fi
}

# Menu
echo "Select test to run:"
echo "1) Base Plan (no optimizations)"
echo "2) Base + SQL Cache"
echo "3) Base + SQL Cache + Kafka"
echo "4) Full Stack (end-to-end)"
echo "5) Run All Tests"
echo "6) Custom Configuration"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        run_test "Base Plan" "base_plan.jmx" "base.csv"
        ;;
    2)
        run_test "Base + SQL Cache" "base_plus_sql_cache.jmx" "base_plus_sql_cache.csv"
        ;;
    3)
        run_test "Base + SQL Cache + Kafka" "base_sql_cache_kafka.jmx" "base_sql_cache_kafka.csv"
        ;;
    4)
        run_test "Full Stack" "full_stack.jmx" "full_stack.csv"
        ;;
    5)
        echo -e "${YELLOW}Running all tests...${NC}"
        echo ""
        run_test "Base Plan" "base_plan.jmx" "base.csv"
        sleep 10
        run_test "Base + SQL Cache" "base_plus_sql_cache.jmx" "base_plus_sql_cache.csv"
        sleep 10
        run_test "Base + SQL Cache + Kafka" "base_sql_cache_kafka.jmx" "base_sql_cache_kafka.csv"
        sleep 10
        run_test "Full Stack" "full_stack.jmx" "full_stack.csv"
        echo -e "${GREEN}All tests completed!${NC}"
        ;;
    6)
        read -p "Enter number of threads [default: 100000]: " THREADS
        THREADS=${THREADS:-100000}
        read -p "Enter ramp-up time in seconds [default: 300]: " RAMP_UP
        RAMP_UP=${RAMP_UP:-300}
        read -p "Select test [1-4]: " test_choice
        case $test_choice in
            1) run_test "Base Plan" "base_plan.jmx" "base.csv" ;;
            2) run_test "Base + SQL Cache" "base_plus_sql_cache.jmx" "base_plus_sql_cache.csv" ;;
            3) run_test "Base + SQL Cache + Kafka" "base_sql_cache_kafka.jmx" "base_sql_cache_kafka.csv" ;;
            4) run_test "Full Stack" "full_stack.jmx" "full_stack.csv" ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Test execution complete!${NC}"
echo "View results in: $RESULTS_DIR"

