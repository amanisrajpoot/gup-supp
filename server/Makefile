.PHONY: help build run test clean docker-build docker-up docker-down logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Go server
	@echo "Building server..."
	go build -o teleclone-server .

run: ## Run the server locally (requires Postgres/Redis running)
	@echo "Running server..."
	go run main.go database.go

test: ## Run tests
	@echo "Running tests..."
	go test -v ./...

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -f teleclone-server
	go clean

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t teleclone-server:latest .

docker-up: ## Start services with Docker Compose
	@echo "Starting services..."
	docker-compose up -d

docker-down: ## Stop services
	@echo "Stopping services..."
	docker-compose down

logs: ## View server logs
	docker-compose logs -f server

dev: ## Run in development mode (with hot reload - requires air or similar)
	@echo "Development mode..."
	@which air > /dev/null || (echo "Install air: go install github.com/cosmtrek/air@latest" && exit 1)
	air

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

migrate: ## Run database migrations (requires running server)
	@echo "Running migrations..."
	@curl -X POST http://localhost:8080/migrate || echo "Server not running or endpoint not implemented"
