package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/pkg/dotenv"
)

func main() {
	level := new(slog.LevelVar)
	level.Set(slog.LevelInfo)

	h := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: level,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey {
				return slog.String(slog.TimeKey, a.Value.Time().Format(time.RFC3339))
			}

			return a
		},
	})

	slog.SetDefault(slog.New(h))

	cfg := Default()
	if err := dotenv.Load(cfg); err != nil {
		slog.Error("failed to load environment config", "err", err)
		os.Exit(1)
	}
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "err", err)
		os.Exit(1)
	}

	level.Set(cfg.LogLevel)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	if err := run(ctx, cfg); err != nil {
		slog.Error("server exited unexpectedly", "err", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, cfg *Config) error {
	client := &http.Client{Timeout: cfg.OTPaaS.Timeout}
	mux := http.NewServeMux()
	Register(mux, cfg, client)

	app := middleware.Chain(mux, middleware.RequestID)
	addr := fmt.Sprintf(":%d", cfg.Server.Port)

	server := &http.Server{
		Addr:              addr,
		Handler:           app,
		ReadTimeout:       cfg.Server.ReadTimeout,
		ReadHeaderTimeout: cfg.Server.ReadHeaderTimeout,
		WriteTimeout:      cfg.Server.WriteTimeout,
		IdleTimeout:       cfg.Server.IdleTimeout,
	}

	errCh := make(chan error, 1)

	go func() {
		slog.Info("server listening", slog.String("address", server.Addr))
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		slog.Info("server shutting down")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}

		return nil

	case err := <-errCh:
		if err != nil && err != http.ErrServerClosed {
			return err
		}
		return nil
	}
}
