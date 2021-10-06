.PHONY: sql
sql:
	cd api && sqlc generate

.PHONY: proto
proto:
	cd api && buf generate

.PHONY: up
up:
	docker compose up --build

.PHONY: down
down:
	docker compose down
