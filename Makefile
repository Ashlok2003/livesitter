DOCKER_BUILDKIT=0 docker compose build --no-cache

.PHONY: help dev build up down clean logs test migrate

# Default target
help:
	@echo "LiveStream App Management Commands:"
	@echo ""
	@echo "  dev       - Start development environment"
	@echo "  build     - Build Docker images"
	@echo "  up        - Start production environment"
	@echo "  down      - Stop and remove containers"
	@echo "  clean     - Stop and remove containers, volumes, and images"
	@echo "  logs      - View container logs"
	@echo "  test      - Run tests"
	@echo "  migrate   - Run database migrations"
	@echo "  shell     - Open shell in backend container"
	@echo ""

# Development
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

# Build
build:
	@echo "Building Docker images..."
	docker-compose build --no-cache

# Production
up:
	@echo "Starting production environment..."
	docker-compose up -d

# Stop
down:
	@echo "Stopping containers..."
	docker-compose down

# Clean
clean: down
	@echo "Cleaning up..."
	docker system prune -f
	docker volume prune -f

# Logs
logs:
	@echo "Showing logs..."
	docker-compose logs -f

# Backend logs
logs-backend:
	docker-compose logs -f backend

# Frontend logs
logs-frontend:
	docker-compose logs -f client

# Database logs
logs-db:
	docker-compose logs -f mongodb

# Tests
test:
	@echo "Running tests..."
	docker-compose exec backend python -m pytest tests/ -v

# Database shell
db-shell:
	docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin livestream_app

# Backend shell
shell:
	docker-compose exec backend /bin/bash

# Status
status:
	@echo "Container status:"
	docker-compose ps

# Health check
health:
	@echo "Health check:"
	curl -f http://localhost:5000/api/settings/health || echo "Backend is down"
	curl -f http://localhost:80/health || echo "Frontend is down"

# Backup database
backup:
	@echo "Backing up database..."
	mkdir -p backups
	docker-compose exec mongodb mongodump -u admin -p password --authenticationDatabase admin --db livestream_app --out /backup
	docker cp livestream_mongo:/backup ./backups/$(shell date +%Y%m%d_%H%M%S)
	@echo "Backup completed"

# Restore database
restore:
	@echo "Restoring database from latest backup..."
	$(eval LATEST_BACKUP := $(shell ls -td backups/*/ | head -1))
	docker cp $(LATEST_BACKUP) livestream_mongo:/restore
	docker-compose exec mongodb mongorestore -u admin -p password --authenticationDatabase admin --db livestream_app /restore/livestream_app
	@echo "Restore completed"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd client && npm install

# Lint code
lint:
	@echo "Linting backend code..."
	flake8 app/ --max-line-length=100
	@echo "Linting frontend code..."
	cd client && npm run lint

# Format code
format:
	@echo "Formatting backend code..."
	black app/
	@echo "Formatting frontend code..."
	cd client && npm run format
