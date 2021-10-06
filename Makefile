.PHONY: sql
sql:
	cd api && sqlc generate

.PHONY: proto
proto:
	cd api && buf generate

.PHONY: run
run:
	docker compose up --build & (cd web && yarn start)

.PHONY: stop
stop:
	docker compose down
