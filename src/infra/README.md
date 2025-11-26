# Docker Infrastructure Setup

This directory contains Docker Compose configuration for all infrastructure services needed by the Kayak Travel Booking System.

## Services

- **MySQL 8.0** (Port 3306) - Relational database
- **MongoDB 7.0** (Port 27017) - Document database  
- **Redis 7** (Port 6379) - Caching layer
- **Zookeeper** (Port 2181) - Kafka coordination
- **Kafka** (Port 9092) - Event streaming

## Quick Start

### Start All Services
```bash
cd infra
docker-compose up -d
```

### Start Individual Service
```bash
docker-compose up -d mysql
docker-compose up -d mongodb
docker-compose up -d redis
docker-compose up -d zookeeper
docker-compose up -d kafka
```

### Stop All Services
```bash
docker-compose down
```

### View Logs

#### Using the log viewer script:
```bash
./view-logs.sh
```

#### Using Docker Compose:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f mysql
```

#### Using Docker directly:
```bash
# View logs
docker logs kayak-kafka
docker logs kayak-mysql
docker logs kayak-mongodb
docker logs kayak-redis
docker logs kayak-zookeeper

# Follow logs (live updates)
docker logs -f kayak-kafka
```

### Check Status
```bash
docker-compose ps
```

## Kafka Setup

If Kafka fails to start (port 9092 conflict), use the helper script:

```bash
./start-kafka.sh
```

This script will:
1. Check if port 9092 is in use
2. Stop conflicting containers
3. Ensure Zookeeper is running
4. Start Kafka with proper configuration

## Troubleshooting

### Port Already in Use

**MySQL (3306):**
```bash
# Check what's using the port
lsof -i :3306

# Stop conflicting container
docker stop <container-name>
```

**Kafka (9092):**
```bash
# Use the helper script
./start-kafka.sh

# Or manually
docker stop hostly-kafka  # if from another project
docker-compose up -d kafka
```

### View Container Logs

```bash
# Interactive log viewer
./view-logs.sh

# Or directly
docker logs kayak-kafka --tail 50
docker logs kayak-kafka -f  # follow logs
```

### Container Not Starting

1. Check logs:
   ```bash
   docker logs kayak-kafka
   ```

2. Check status:
   ```bash
   docker-compose ps
   ```

3. Restart service:
   ```bash
   docker-compose restart kafka
   ```

### Reset Everything

```bash
# Stop and remove all containers
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Connection Details

### MySQL
- Host: `localhost`
- Port: `3306`
- Database: `kayak`
- User: `kayak`
- Password: `password`
- Root Password: `password`

### MongoDB
- Host: `localhost`
- Port: `27017`
- Database: `kayak`

### Redis
- Host: `localhost`
- Port: `6379`
- No password (default)

### Kafka
- Bootstrap Servers: `localhost:9092`
- Zookeeper: `localhost:2181`

## Health Checks

All services have health checks configured. Check health status:

```bash
docker-compose ps
```

Look for `(healthy)` status next to container names.

## Helper Scripts

- `view-logs.sh` - Interactive log viewer for all containers
- `start-kafka.sh` - Start Kafka with conflict resolution

## Notes

- Data is persisted in Docker volumes
- Volumes are named: `mysql_data`, `mongo_data`, `redis_data`
- To remove all data: `docker-compose down -v`

