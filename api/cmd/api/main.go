package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	_ "github.com/lib/pq"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/grpc"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/kevinsnydercodes/go-todo/api/internal/cli"
	postgresdb "github.com/kevinsnydercodes/go-todo/api/internal/database/postgres"
	"github.com/kevinsnydercodes/go-todo/api/internal/proto"
	"github.com/kevinsnydercodes/go-todo/api/internal/server"
	"github.com/kevinsnydercodes/go-todo/api/internal/util"
)

var (
	fPort             = flag.String("port", cli.LookupEnvOrString("PORT", "8080"), "port")
	fPostgresHost     = flag.String("postgres-host", cli.LookupEnvOrString("POSTGRES_HOST", "db"), "postgres host")
	fPostgresUsername = flag.String("postgres-username", cli.LookupEnvOrString("POSTGRES_USERNAME", "postgres"), "postgres username")
	fPostgresPassword = flag.String("postgres-password", cli.LookupEnvOrString("POSTGRES_PASSWORD", "postgres"), "postgres password")
	fPostgresDB       = flag.String("postgres-db", cli.LookupEnvOrString("POSTGRES_DB", "postgres"), "postgres database")
	fPostgresSSLMode  = flag.String("postgres-sslmode", cli.LookupEnvOrString("POSTGRES_SSLMODE", "disable"), "postgres sslmode")
)

func grpcHandlerFunc(grpcServer *grpc.Server, otherHandler http.Handler) http.Handler {
	return h2c.NewHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if r.Method == "OPTIONS" {
			return
		}

		if r.ProtoMajor == 2 && strings.Contains(r.Header.Get("Content-Type"), "application/grpc") {
			grpcServer.ServeHTTP(w, r)
		} else {
			otherHandler.ServeHTTP(w, r)
		}
	}), &http2.Server{})
}

func run() error {
	ctx := context.Background()

	port, err := strconv.Atoi(*fPort)
	if err != nil {
		return fmt.Errorf("error converting port to integer: %w", err)
	}

	retryOptions := util.RetryOptions{
		Times: 10,
		Wait:  5 * time.Second,
	}

	var db *sql.DB
	var driver database.Driver

	if err := util.Retry(func() error {
		var err error

		db, err = sql.Open("postgres", fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=%s", *fPostgresHost, *fPostgresUsername, *fPostgresPassword, *fPostgresDB, *fPostgresSSLMode))
		if err != nil {
			return fmt.Errorf("error opening database: %w", err)
		}

		driver, err = postgres.WithInstance(db, &postgres.Config{})
		if err != nil {
			return fmt.Errorf("error creating driver with instance: %w", err)
		}

		return nil
	}, &retryOptions); err != nil {
		return fmt.Errorf("error retrying: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance("file:///etc/go-todo/sql/migrations", "postgres", driver)
	if err != nil {
		return fmt.Errorf("error creating migrate with database instance: %w", err)
	}

	if err := m.Up(); err != nil {
		if err != migrate.ErrNoChange {
			return fmt.Errorf("error running migrations: %w", err)
		}
	}

	queries := postgresdb.New(db)

	// mux := http.NewServeMux()
	gwmux := runtime.NewServeMux()

	dopts := []grpc.DialOption{grpc.WithInsecure()}

	grpcServer := grpc.NewServer()
	proto.RegisterTodosV1Server(grpcServer, server.NewTodosV1(queries))

	if err := proto.RegisterTodosV1HandlerFromEndpoint(ctx, gwmux, fmt.Sprintf("localhost:%d", port), dopts); err != nil {
		return fmt.Errorf("error registering todos v1 handler from endpoint: %w", err)
	}

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), grpcHandlerFunc(grpcServer, gwmux)); err != nil {
		return fmt.Errorf("error listening and serving: %w", err)
	}

	fmt.Printf("Listening on port %d\n", port)

	return nil
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
