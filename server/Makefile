.PHONY: build run test clean docker-up docker-down migrate

build:
	go build -o server .

run:
	go run .

test:
	go test ./...

clean:
	rm -f server

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f server

migrate:
	@echo "Migrations run automatically on server start"

dev:
	docker-compose up -d postgres redis
	sleep 2
	go run .
