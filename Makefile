.PHONY: sql
sql:
	sqlc generate

.PHONY: proto
proto:
	buf generate

.PHONY: up
up:
	docker compose up --build

.PHONY: down
down:
	docker compose down
