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

	"golang.org/x/sync/errgroup"
)

func main() {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:     slog.LevelInfo,
		AddSource: false,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey {
				return slog.String(slog.TimeKey, a.Value.Time().Format(time.RFC3339))
			}
			return a
		},
	})

	logger := slog.New(h)
	slog.SetDefault(logger)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	if err := run(ctx); err != nil {
		cancel()
		slog.Error("Server exited with error", slog.Any("err", err))
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Hello, World!"))
	})

	server := &http.Server{
		Addr:              "[::1]:8080",
		Handler:           mux,
		ReadTimeout:       60 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
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
			fmt.Sprintf("Server is listening on %v", server.Addr),
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

		slog.Info("Gracefully shutting down...")

		defer server.Close()

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
