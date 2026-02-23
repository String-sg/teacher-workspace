package config

import (
	"errors"
	"fmt"
	"log/slog"
	"time"
)

type Environment string

const (
	EnvironmentDevelopment Environment = "development"
	EnvironmentStaging     Environment = "staging"
	EnvironmentProduction  Environment = "production"
)

// Config is the main configuration for the application.
type Config struct {
	Environment Environment `dotenv:"TW_ENV"`
	LogLevel    slog.Level  `dotenv:"TW_LOG_LEVEL"`

	Server ServerConfig `dotenv:",squash"`
	OTPaas OTPaasConfig `dotenv:",squash"`
}

// ServerConfig represents the configuration for the HTTP server.
type ServerConfig struct {
	Port int `dotenv:"TW_SERVER_PORT"`

	ReadTimeout       time.Duration `dotenv:"TW_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `dotenv:"TW_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"TW_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"TW_SERVER_IDLE_TIMEOUT"`
}

type OTPaasConfig struct {
	ID        string `dotenv:"TW_OTPAAS_APP_ID"`
	Namespace string `dotenv:"TW_OTPAAS_APP_NAMESPACE"`
	Secret    string `dotenv:"TW_OTPAAS_APP_SECRET"`
	Host      string `dotenv:"TW_OTPAAS_OTP_HOST"`

	ClientTimeout time.Duration `dotenv:"TW_OTPAAS_CLIENT_TIMEOUT"`
}

// Default returns the default configuration for the application.
func Default() *Config {
	return &Config{
		Environment: EnvironmentDevelopment,
		LogLevel:    slog.LevelInfo,

		Server: ServerConfig{
			Port: 3000,

			ReadHeaderTimeout: 2 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},

		OTPaas: OTPaasConfig{
			ID:            "",
			Namespace:     "",
			Secret:        "",
			Host:          "https://otp.techpass.suite.gov.sg",
			ClientTimeout: 10 * time.Second,
		},
	}
}

func (c *Config) Validate() error {
	var errs []error

	if c.Environment != EnvironmentDevelopment && c.Environment != EnvironmentStaging && c.Environment != EnvironmentProduction {
		errs = append(errs, fmt.Errorf("TW_ENV must be one of %q, %q or %q; got %q", EnvironmentDevelopment, EnvironmentStaging, EnvironmentProduction, c.Environment))
	}

	return errors.Join(append(errs, c.Server.Validate(), c.OTPaas.Validate())...)
}

func (c ServerConfig) Validate() error {
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

func (c OTPaasConfig) Validate() error {
	var errs []error

	if c.ID == "" {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_APP_ID is required"))
	}
	if c.Namespace == "" {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_APP_NAMESPACE is required"))
	}
	if c.Secret == "" {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_APP_SECRET is required"))
	}
	if c.Host == "" {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_OTP_HOST is required"))
	}
	if c.ClientTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_CLIENT_TIMEOUT must be a positive duration; got %v", c.ClientTimeout))
	}

	return errors.Join(errs...)
}
