FROM golang:1.17 as builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

# TODO: Consider optimizing COPY operation
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /out/api /src/cmd/api

FROM alpine:latest

RUN apk --no-cache add ca-certificates

COPY --from=builder /out/api /usr/local/bin/
COPY --from=builder /src/sql /etc/go-todo/sql

CMD ["/usr/local/bin/api"]