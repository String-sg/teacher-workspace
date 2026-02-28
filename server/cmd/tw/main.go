package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/handler"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/otp"
	"github.com/String-sg/teacher-workspace/server/internal/session"
	"github.com/String-sg/teacher-workspace/server/pkg/dotenv"
	glide "github.com/valkey-io/valkey-glide/go/v2"
	glideconfig "github.com/valkey-io/valkey-glide/go/v2/config"
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

func run(ctx context.Context, cfg *config.Config) error {
	otpProvider := otp.NewOTPaaSProvider(
		cfg.OTP.OTPaaS.Host,
		cfg.OTP.OTPaaS.AppID,
		cfg.OTP.OTPaaS.AppNamespace,
		cfg.OTP.OTPaaS.Secret,
		cfg.OTP.OTPaaS.Timeout,
	)

	h := handler.New(cfg, otpProvider)

	mux := http.NewServeMux()

	h.Register(mux)

	valkeyClient, err := newValkeyClient(cfg.Valkey.ConnectionString)
	if err != nil {
		return fmt.Errorf("create valkey client: %w", err)
	}
	defer valkeyClient.Close()

	app := middleware.Chain(
		mux,
		middleware.RequestID(),
		middleware.Session(session.NewValkeyStore(valkeyClient), cfg),
	)

	server := &http.Server{
		Addr:              fmt.Sprintf("[::1]:%d", cfg.Server.Port),
		Handler:           app,
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

func newValkeyClient(connStr string) (*glide.Client, error) {
	u, err := url.Parse(connStr)
	if err != nil {
		return nil, fmt.Errorf("parse connection string: %w", err)
	}

	vcfg := glideconfig.NewClientConfiguration()

	username := u.User.Username()
	password, _ := u.User.Password()
	vcfg.WithCredentials(glideconfig.NewServerCredentials(username, password))

	host := u.Hostname()
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		return nil, fmt.Errorf("convert port to int: %w", err)
	}
	vcfg.WithAddress(&glideconfig.NodeAddress{Host: host, Port: port})

	if u.Path != "" {
		dbid, err := strconv.Atoi(strings.TrimPrefix(u.Path, "/"))
		if err != nil {
			return nil, fmt.Errorf("convert database ID to int: %w", err)
		}
		vcfg.WithDatabaseId(dbid)
	}

	if tls := u.Query().Get("tls"); tls == "true" {
		vcfg.WithUseTLS(true)
	}

	client, err := glide.NewClient(vcfg)
	if err != nil {
		return nil, fmt.Errorf("create valkey client: %w", err)
	}

	return client, nil
}
