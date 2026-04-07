package config

import (
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"time"
)

type Environment string

const (
	EnvironmentDevelopment Environment = "development"
	EnvironmentProduction  Environment = "production"
)

// Config is the main configuration for the application.
type Config struct {
	Environment Environment `dotenv:"TW_ENV"`
	LogLevel    slog.Level  `dotenv:"TW_LOG_LEVEL"`

	ViteDevServerURL *url.URL `dotenv:"TW_VITE_DEV_SERVER_URL"`
	BundleDirectory  string   `dotenv:"TW_BUNDLE_DIRECTORY"`

	Server ServerConfig `dotenv:",squash"`
	OTPaaS OTPaaSConfig `dotenv:",squash"`
	PG     PGConfig     `dotenv:",squash"`
}

// ServerConfig represents the configuration for the HTTP server.
type ServerConfig struct {
	Port int `dotenv:"TW_SERVER_PORT"`

	ReadTimeout       time.Duration `dotenv:"TW_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `dotenv:"TW_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"TW_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"TW_SERVER_IDLE_TIMEOUT"`
}

// PGConfig holds configuration for the Parents Gateway integration.
type PGConfig struct {
	Mock      bool   `dotenv:"TW_PG_MOCK"`
	BaseURL   string `dotenv:"TW_PG_BASE_URL"`
	TimeoutMS int    `dotenv:"TW_PG_TIMEOUT_MS"`
}

type OTPaaSConfig struct {
	Host      string `dotenv:"TW_OTPAAS_HOST"`
	ID        string `dotenv:"TW_OTPAAS_ID"`
	Namespace string `dotenv:"TW_OTPAAS_NAMESPACE"`
	Secret    string `dotenv:"TW_OTPAAS_SECRET"`

	Timeout time.Duration `dotenv:"TW_OTPAAS_TIMEOUT"`
}

// Default returns the default configuration for the application.
func Default() *Config {
	return &Config{
		Environment: EnvironmentDevelopment,
		LogLevel:    slog.LevelInfo,

		ViteDevServerURL: must(url.Parse("http://localhost:5173")),
		BundleDirectory:  "dist",

		Server: ServerConfig{
			Port: 3000,

			ReadHeaderTimeout: 2 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},

		OTPaaS: OTPaaSConfig{
			Host:      "https://otp.techpass.suite.gov.sg",
			ID:        "",
			Namespace: "",
			Secret:    "",
			Timeout:   10 * time.Second,
		},

		PG: PGConfig{
			Mock:      true,
			BaseURL:   "https://pg.moe.edu.sg",
			TimeoutMS: 10000,
		},
	}
}

func (cfg *Config) Validate() error {
	var errs []error

	if cfg.Environment != EnvironmentDevelopment && cfg.Environment != EnvironmentProduction {
		errs = append(errs, fmt.Errorf("TW_ENV must be one of %q or %q; got %q", EnvironmentDevelopment, EnvironmentProduction, cfg.Environment))
	}

	switch cfg.Environment {
	case EnvironmentDevelopment:
		if cfg.ViteDevServerURL.Scheme != "http" && cfg.ViteDevServerURL.Scheme != "https" {
			errs = append(errs, fmt.Errorf("TW_VITE_DEV_SERVER_URL must use scheme http or https; got %q", cfg.ViteDevServerURL.Scheme))
		}
		if cfg.ViteDevServerURL.Host == "" {
			errs = append(errs, fmt.Errorf("TW_VITE_DEV_SERVER_URL must include host[:port]; got %q", cfg.ViteDevServerURL.Host))
		}
	case EnvironmentProduction:
		if cfg.BundleDirectory == "" {
			errs = append(errs, errors.New("TW_BUNDLE_DIRECTORY is required"))
		} else {
			if _, err := os.Stat(cfg.BundleDirectory); os.IsNotExist(err) {
				errs = append(errs, fmt.Errorf("TW_BUNDLE_DIRECTORY does not exist: %w", err))
			}
		}
	}

	return errors.Join(append(errs, cfg.Server.validate(), cfg.OTPaaS.validate())...)
}

func (c ServerConfig) validate() error {
	var errs []error

	if c.Port < 1 || c.Port > 65535 {
		errs = append(errs, fmt.Errorf("TW_SERVER_PORT must be between 1 and 65535; got %d", c.Port))
	}
	if c.ReadHeaderTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_HEADER_TIMEOUT must be a positive duration; got %v", c.ReadHeaderTimeout))
	}
	if c.ReadTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_TIMEOUT must be a positive duration; got %v", c.ReadTimeout))
	}
	if c.WriteTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_WRITE_TIMEOUT must be a positive duration; got %v", c.WriteTimeout))
	}
	if c.IdleTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_IDLE_TIMEOUT must be a positive duration; got %v", c.IdleTimeout))
	}

	return errors.Join(errs...)
}

func (c OTPaaSConfig) validate() error {
	var errs []error

	if c.Host == "" {
		errs = append(errs, errors.New("TW_OTPAAS_HOST is required"))
	}
	if c.ID == "" {
		errs = append(errs, errors.New("TW_OTPAAS_ID is required"))
	}
	if c.Namespace == "" {
		errs = append(errs, errors.New("TW_OTPAAS_NAMESPACE is required"))
	}
	if c.Secret == "" {
		errs = append(errs, errors.New("TW_OTPAAS_SECRET is required"))
	}
	if c.Timeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_TIMEOUT must be a positive duration; got %v", c.Timeout))
	}

	return errors.Join(errs...)
}

func must[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}
