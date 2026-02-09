package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/routes"
	"github.com/String-sg/teacher-workspace/server/pkg/dotenv"
	"golang.org/x/sync/errgroup"
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

	cfg := config.Default()
	if err := dotenv.Load(cfg); err != nil {
		slog.Error("failed to load environment config", "err", err)
		os.Exit(1)
	}

	level.Set(cfg.LogLevel)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	if err := run(ctx, cfg); err != nil {
		slog.Error("server exited with error", "err", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, cfg *config.Config) error {
	mux := http.NewServeMux()

	routes.Register(mux)

	handler := middleware.Chain(mux, middleware.RequestID)

	server := &http.Server{
		Addr:              fmt.Sprintf("[::1]:%d", cfg.Server.Port),
		Handler:           handler,
		ReadTimeout:       cfg.Server.ReadTimeout,
		ReadHeaderTimeout: cfg.Server.ReadHeaderTimeout,
		WriteTimeout:      cfg.Server.WriteTimeout,
		IdleTimeout:       cfg.Server.IdleTimeout,
	}

	g, ctx := errgroup.WithContext(ctx)
	started := make(chan struct{})

	g.Go(func() error {
		listener, err := net.Listen("tcp", server.Addr)
		if err != nil {
			return err
		}
		close(started)

		slog.Info(
			"server listening",
			slog.String("address", server.Addr),
		)

		if err := server.Serve(listener); !errors.Is(err, http.ErrServerClosed) {
			return err
		}

		return nil
	})

	g.Go(func() error {
		<-ctx.Done()

		select {
		case <-started:
		default:
			return nil
		}

		slog.Info("server shutting down")

		defer func() {
			if err := server.Close(); err != nil {
				slog.Error("failed to close server", "err", err)
			}
		}()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}

		return nil
	})

	if err := g.Wait(); err != nil {
		return err
	}

	return nil
}
