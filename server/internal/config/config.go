package config

import (
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/String-sg/teacher-workspace/server/pkg/dotenv"
)

type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvProduction  Environment = "production"
)

type Config struct {
	Env      Environment  `dotenv:"TW_ENV"`
	LogLevel slog.Level   `dotenv:"TW_LOG_LEVEL"`
	Server   ServerConfig `dotenv:",squash"`
}

type ServerConfig struct {
	Port              int           `dotenv:"TW_SERVER_PORT"`
	ReadHeaderTimeout time.Duration `dotenv:"TW_SERVER_READ_HEADER_TIMEOUT"`
	ReadTimeout       time.Duration `dotenv:"TW_SERVER_READ_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"TW_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"TW_SERVER_IDLE_TIMEOUT"`
}

func defaults() Config {
	return Config{
		Env:      EnvDevelopment,
		LogLevel: slog.LevelInfo,
		Server: ServerConfig{
			Port:              3000,
			ReadHeaderTimeout: 2 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},
	}
}

// Load resolves configuration from built-in defaults, an optional .env file,
// and real process environment variables (highest precedence). Returns an error
// if any value fails to parse or fails validation.
func Load() (Config, error) {
	cfg := defaults()
	if err := dotenv.Load(&cfg); err != nil {
		return Config{}, err
	}
	return cfg, cfg.Validate()
}

func (e Environment) Validate() error {
	if e != EnvDevelopment && e != EnvProduction {
		return fmt.Errorf("TW_ENV must be %q or %q; got %q", EnvDevelopment, EnvProduction, e)
	}
	return nil
}

func (c Config) Validate() error {
	return errors.Join(c.Env.Validate(), c.Server.validate())
}

func (c ServerConfig) validate() error {
	var errs []error

	if c.Port < 1 || c.Port > 65535 {
		errs = append(errs, fmt.Errorf("TW_SERVER_PORT must be 1-65535; got %d", c.Port))
	}
	if c.ReadHeaderTimeout < 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_HEADER_TIMEOUT must be >= 0; got %v", c.ReadHeaderTimeout))
	}
	if c.ReadTimeout < 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_TIMEOUT must be >= 0; got %v", c.ReadTimeout))
	}
	if c.WriteTimeout < 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_WRITE_TIMEOUT must be >= 0; got %v", c.WriteTimeout))
	}
	if c.IdleTimeout < 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_IDLE_TIMEOUT must be >= 0; got %v", c.IdleTimeout))
	}

	return errors.Join(errs...)
}
