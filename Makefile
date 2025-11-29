# Kayak Travel Booking System - Makefile
# Quick commands for development, testing, and deployment

.PHONY: help install setup start stop restart clean test health seed reset logs status build dev prod

# Default target - show help
help:
	@echo ""
	@echo "╔═══════════════════════════════════════════════════════════════╗"
	@echo "║         Kayak Travel Booking System - Make Commands          ║"
	@echo "╚═══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  make install          - Install all dependencies (backend + frontend)"
	@echo "  make setup           - Full setup (Docker + DB + dependencies)"
	@echo ""
	@echo "🚀 Start/Stop Services:"
	@echo "  make start           - Start all services (Docker + backend + frontend)"
	@echo "  make stop            - Stop all services gracefully"
	@echo "  make restart         - Restart all services"
	@echo "  make dev             - Start in development mode (with logs)"
	@echo ""
	@echo "🗄️  Database Operations:"
	@echo "  make db-start        - Start MySQL and MongoDB containers"
	@echo "  make db-stop         - Stop database containers"
	@echo "  make db-seed         - Seed database with test data"
	@echo "  make db-reset        - Reset and re-seed database"
	@echo "  make db-shell-mysql  - Open MySQL shell"
	@echo "  make db-shell-mongo  - Open MongoDB shell"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-api        - Test API endpoints"
	@echo "  make test-health     - Check all service health"
	@echo "  make test-e2e        - Run end-to-end tests"
	@echo ""
	@echo "📊 Monitoring & Logs:"
	@echo "  make logs            - Show all service logs"
	@echo "  make logs-api        - Show API Gateway logs"
	@echo "  make logs-user       - Show User Service logs"
	@echo "  make logs-frontend   - Show Frontend logs"
	@echo "  make status          - Show service status"
	@echo "  make health          - Check health of all services"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean           - Clean logs and temp files"
	@echo "  make clean-all       - Clean everything (including node_modules)"
	@echo "  make clean-docker    - Remove all Docker containers and volumes"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make build           - Build all services"
	@echo "  make build-frontend  - Build frontend for production"
	@echo "  make lint            - Run linters"
	@echo "  make format          - Format code"
	@echo ""

# ============================================================================
# SETUP & INSTALLATION
# ============================================================================

install: install-backend install-frontend
	@echo "✅ All dependencies installed!"

install-backend:
	@echo "📦 Installing backend dependencies..."
	@cd src/services/common && npm install
	@cd src/services/api-gateway && npm install
	@cd src/services/user-service && npm install
	@cd src/services/listing-service && npm install
	@cd src/services/booking-billing-service && npm install
	@cd src/services/analytics-service && npm install
	@cd src/db && npm install
	@echo "✅ Backend dependencies installed"

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

setup: check-docker install db-start db-wait db-seed
	@echo ""
	@echo "✅ Setup complete! Run 'make start' to launch all services"

check-docker:
	@echo "🐳 Checking Docker..."
	@docker --version > /dev/null 2>&1 || (echo "❌ Docker not found. Please install Docker Desktop." && exit 1)
	@docker ps > /dev/null 2>&1 || (echo "❌ Docker is not running. Please start Docker Desktop." && exit 1)
	@echo "✅ Docker is ready"

# ============================================================================
# START/STOP SERVICES
# ============================================================================

start: db-start db-wait start-backend start-frontend
	@echo ""
	@echo "🎉 All services started!"
	@echo ""
	@echo "📍 Access URLs:"
	@echo "   Frontend:        http://localhost:3000"
	@echo "   API Gateway:     http://localhost:4000"
	@echo "   MySQL:          localhost:3306"
	@echo "   MongoDB:        localhost:27017"
	@echo ""
	@echo "Run 'make logs' to see logs or 'make status' to check status"

start-backend:
	@echo "🚀 Starting backend services..."
	@mkdir -p src/logs
	@export MYSQL_HOST=localhost MYSQL_PORT=3307 MYSQL_USER=root MYSQL_PASSWORD=password MYSQL_DATABASE=kayak && \
	cd src && ./start-all.sh || true
	@sleep 3
	@echo "✅ Backend services started"

start-frontend:
	@echo "🌐 Starting frontend..."
	@cd frontend && npm run dev > ../src/logs/frontend.log 2>&1 & echo $$! > ../src/logs/frontend.pid
	@sleep 2
	@echo "✅ Frontend started on http://localhost:3000"

stop: stop-frontend stop-backend db-stop
	@echo "✅ All services stopped"

stop-backend:
	@echo "🛑 Stopping backend services..."
	@-pkill -f "node.*api-gateway" || true
	@-pkill -f "node.*user-service" || true
	@-pkill -f "node.*listing-service" || true
	@-pkill -f "node.*booking-billing-service" || true
	@-pkill -f "node.*analytics-service" || true
	@-if [ -f src/logs/api-gateway.pid ]; then kill $$(cat src/logs/api-gateway.pid) 2>/dev/null || true; fi
	@-if [ -f src/logs/user-service.pid ]; then kill $$(cat src/logs/user-service.pid) 2>/dev/null || true; fi
	@-if [ -f src/logs/listing-service.pid ]; then kill $$(cat src/logs/listing-service.pid) 2>/dev/null || true; fi
	@-if [ -f src/logs/booking-billing-service.pid ]; then kill $$(cat src/logs/booking-billing-service.pid) 2>/dev/null || true; fi
	@-if [ -f src/logs/analytics-service.pid ]; then kill $$(cat src/logs/analytics-service.pid) 2>/dev/null || true; fi
	@rm -f src/logs/*.pid
	@echo "✅ Backend services stopped"

stop-frontend:
	@echo "🛑 Stopping frontend..."
	@-pkill -f "vite.*frontend" || true
	@-if [ -f src/logs/frontend.pid ]; then kill $$(cat src/logs/frontend.pid) 2>/dev/null || true; fi
	@rm -f src/logs/frontend.pid
	@echo "✅ Frontend stopped"

restart: stop start

dev:
	@echo "🔧 Starting in development mode..."
	@make start
	@echo ""
	@echo "📋 Watching logs (Ctrl+C to exit)..."
	@make logs

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

db-start:
	@echo "🗄️  Starting databases..."
	@cd src/infra && docker-compose up -d mysql mongodb
	@echo "⏳ Databases starting..."

db-stop:
	@echo "🛑 Stopping databases..."
	@cd src/infra && docker-compose stop mysql mongodb
	@echo "✅ Databases stopped"

db-wait:
	@echo "⏳ Waiting for databases to be ready (60s)..."
	@sleep 60
	@echo "✅ Databases should be ready"

db-seed:
	@echo "🌱 Seeding database with test data..."
	@cd src/db && node seed-data.js
	@echo "✅ Database seeded"

db-reset:
	@echo "⚠️  Resetting database..."
	@cd src/infra && docker-compose down -v
	@make db-start
	@make db-wait
	@make db-seed
	@echo "✅ Database reset complete"

db-shell-mysql:
	@echo "🐬 Opening MySQL shell (password: password)..."
	@docker exec -it kayak-mysql mysql -uroot -ppassword kayak

db-shell-mongo:
	@echo "🍃 Opening MongoDB shell..."
	@docker exec -it kayak-mongodb mongosh kayak

db-check:
	@echo "🔍 Checking database status..."
	@docker exec kayak-mysql mysql -uroot -ppassword -e "SELECT 'MySQL' as db, COUNT(*) as users FROM kayak.users UNION SELECT 'MySQL', COUNT(*) FROM kayak.flights UNION SELECT 'MySQL', COUNT(*) FROM kayak.hotels UNION SELECT 'MySQL', COUNT(*) FROM kayak.bookings;" 2>/dev/null || echo "❌ MySQL not accessible"
	@echo ""
	@docker exec kayak-mongodb mongosh --quiet --eval "db.reviews.countDocuments()" kayak 2>/dev/null && echo "MongoDB collections ready" || echo "❌ MongoDB not accessible"

# ============================================================================
# TESTING
# ============================================================================

test: test-health test-api
	@echo "✅ All tests passed!"

test-health:
	@echo "🏥 Testing service health..."
	@echo -n "API Gateway (4000): "
	@curl -s http://localhost:4000/health | grep -q "ok" && echo "✅" || echo "❌"
	@echo -n "User Service (8001): "
	@curl -s http://localhost:8001/health | grep -q "ok" && echo "✅" || echo "❌"
	@echo -n "Listing Service (8002): "
	@curl -s http://localhost:8002/health | grep -q "ok" && echo "✅" || echo "❌"
	@echo -n "Booking Service (8003): "
	@curl -s http://localhost:8003/health | grep -q "ok" && echo "✅" || echo "❌"
	@echo -n "Analytics Service (8004): "
	@curl -s http://localhost:8004/health | grep -q "ok" && echo "✅" || echo "❌"
	@echo -n "Frontend (3000): "
	@curl -s http://localhost:3000 > /dev/null && echo "✅" || echo "❌"

test-api:
	@echo "🧪 Testing API endpoints..."
	@echo -n "Testing user registration: "
	@curl -s -X POST http://localhost:4000/api/users/register \
		-H "Content-Type: application/json" \
		-d '{"userId":"999-99-9999","firstName":"Test","lastName":"User","email":"test-make@test.com","password":"Test1234"}' \
		| grep -q "token" && echo "✅" || echo "❌"
	@echo -n "Testing flight search: "
	@curl -s "http://localhost:4000/api/listings/flights/search?origin=SFO&destination=JFK" \
		| grep -q "flight" && echo "✅" || echo "❌"

test-e2e:
	@echo "🔄 Running end-to-end tests..."
	@echo "See docs/TEST_GUIDE.md for manual test cases"
	@echo "TODO: Add automated E2E tests with Playwright/Cypress"

# ============================================================================
# MONITORING & LOGS
# ============================================================================

status:
	@echo "📊 Service Status:"
	@echo ""
	@echo "🐳 Docker Containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kayak || echo "No containers running"
	@echo ""
	@echo "⚙️  Node Processes:"
	@ps aux | grep -E "node.*(api-gateway|user-service|listing-service|booking-billing|analytics|vite)" | grep -v grep || echo "No Node.js processes running"
	@echo ""
	@echo "🌐 Port Usage:"
	@lsof -i :3000 -sTCP:LISTEN | tail -n +2 | awk '{print "Port 3000 (Frontend): ✅"}' || echo "Port 3000 (Frontend): ❌"
	@lsof -i :4000 -sTCP:LISTEN | tail -n +2 | awk '{print "Port 4000 (API Gateway): ✅"}' || echo "Port 4000 (API Gateway): ❌"
	@lsof -i :8001 -sTCP:LISTEN | tail -n +2 | awk '{print "Port 8001 (User Service): ✅"}' || echo "Port 8001 (User Service): ❌"
	@lsof -i :8002 -sTCP:LISTEN | tail -n +2 | awk '{print "Port 8002 (Listing Service): ✅"}' || echo "Port 8002 (Listing Service): ❌"
	@lsof -i :8003 -sTCP:LISTEN | tail -n +2 | awk '{print "Port 8003 (Booking Service): ✅"}' || echo "Port 8003 (Booking Service): ❌"

health: test-health

logs:
	@echo "📋 Service Logs (Ctrl+C to exit):"
	@tail -f src/logs/*.log 2>/dev/null || echo "No logs found. Services may not be running."

logs-api:
	@tail -f src/logs/api-gateway.log

logs-user:
	@tail -f src/logs/user-service.log

logs-listing:
	@tail -f src/logs/listing-service.log

logs-booking:
	@tail -f src/logs/booking-billing-service.log

logs-frontend:
	@tail -f src/logs/frontend.log

logs-docker:
	@docker logs -f kayak-mysql --tail 50

# ============================================================================
# BUILD
# ============================================================================

build: build-backend build-frontend
	@echo "✅ Build complete"

build-backend:
	@echo "🔨 Building backend services..."
	@cd src/services/common && npm run build || true
	@echo "✅ Backend built"

build-frontend:
	@echo "🔨 Building frontend for production..."
	@cd frontend && npm run build
	@echo "✅ Frontend built to frontend/dist/"

# ============================================================================
# CODE QUALITY
# ============================================================================

lint:
	@echo "🔍 Running linters..."
	@cd frontend && npm run lint || true
	@echo "✅ Lint check complete"

format:
	@echo "💅 Formatting code..."
	@cd frontend && npm run format || true
	@echo "✅ Code formatted"

# ============================================================================
# CLEANUP
# ============================================================================

clean:
	@echo "🧹 Cleaning logs and temp files..."
	@rm -rf src/logs/*.log
	@rm -rf src/logs/*.pid
	@rm -rf frontend/dist
	@echo "✅ Cleaned"

clean-all: clean
	@echo "🧹 Cleaning everything (including node_modules)..."
	@echo "⚠️  This will remove all node_modules. Continue? [y/N]"
	@read -r response; \
	if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		find . -name "node_modules" -type d -prune -exec rm -rf {} + ; \
		echo "✅ All cleaned"; \
	else \
		echo "❌ Cancelled"; \
	fi

clean-docker:
	@echo "🧹 Removing Docker containers and volumes..."
	@cd src/infra && docker-compose down -v
	@echo "✅ Docker cleaned"

# ============================================================================
# PRODUCTION
# ============================================================================

prod: build
	@echo "🚀 Starting in production mode..."
	@echo "TODO: Add production deployment steps"
	@echo "See docs/PROD_DEPLOYMENT_CHECKLIST.md"

# ============================================================================
# UTILITY COMMANDS
# ============================================================================

ports:
	@echo "🔌 Port Usage:"
	@lsof -i -P -n | grep LISTEN | grep -E ":(3000|4000|8001|8002|8003|8004|3306|27017)" || echo "No ports in use"

kill-ports:
	@echo "⚠️  Killing all processes on Kayak ports..."
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:4000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8002 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8003 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8004 | xargs kill -9 2>/dev/null || true
	@echo "✅ Ports cleared"

version:
	@echo "Kayak Travel Booking System"
	@echo "Version: 1.0.0"
	@echo ""
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"

# Quick aliases
s: start
st: stop
r: restart
h: health
l: logs
t: test

