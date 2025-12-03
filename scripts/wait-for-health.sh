#!/bin/bash

##############################################################################
# wait-for-health.sh
# 
# Waits for Docker containers to become healthy before proceeding
# AWS-Ready: Works locally and in cloud environments
##############################################################################

set -e

SERVICE_NAME=$1
MAX_ATTEMPTS=${2:-30}  # Default: 30 attempts (60 seconds)
ATTEMPT=0

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$SERVICE_NAME" ]; then
  echo -e "${RED}❌ Error: Service name is required${NC}"
  echo "Usage: $0 <service-name> [max-attempts]"
  echo "Example: $0 kayak-mysql 30"
  exit 1
fi

echo -e "${YELLOW}⏳ Waiting for ${SERVICE_NAME} to be healthy...${NC}"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${SERVICE_NAME}$"; then
    echo -e "${RED}❌ Container ${SERVICE_NAME} not found${NC}"
    exit 1
  fi
  
  # Get health status
  HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$SERVICE_NAME" 2>/dev/null || echo "none")
  
  # Check if healthy
  if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ ${SERVICE_NAME} is healthy!${NC}"
    exit 0
  fi
  
  # Check if container is running (for containers without health checks)
  if [ "$HEALTH_STATUS" = "none" ]; then
    RUNNING=$(docker inspect --format='{{.State.Running}}' "$SERVICE_NAME" 2>/dev/null || echo "false")
    if [ "$RUNNING" = "true" ]; then
      echo -e "${GREEN}✅ ${SERVICE_NAME} is running (no health check defined)${NC}"
      exit 0
    fi
  fi
  
  # Check if unhealthy or starting
  if [ "$HEALTH_STATUS" = "unhealthy" ]; then
    echo -e "${RED}❌ ${SERVICE_NAME} is unhealthy${NC}"
    exit 1
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo -e "⏳ Attempt ${ATTEMPT}/${MAX_ATTEMPTS}: ${SERVICE_NAME} is ${HEALTH_STATUS}..."
  sleep 2
done

echo -e "${RED}❌ ${SERVICE_NAME} failed to become healthy after ${MAX_ATTEMPTS} attempts (${MAX_ATTEMPTS}s)${NC}"
exit 1

