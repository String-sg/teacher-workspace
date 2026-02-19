package config

import (
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
	LogLevel    slog.Level  `dotenv:"TW_LOG_LEVEL"`
	Environment Environment `dotenv:"TW_ENV"`

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
	ID            string        `dotenv:"TW_OTPAAS_APP_ID"`
	Namespace     string        `dotenv:"TW_OTPAAS_APP_NAMESPACE"`
	Secret        string        `dotenv:"TW_OTPAAS_APP_SECRET"`
	Host          string        `dotenv:"TW_OTPAAS_OTP_HOST"`
	ClientTimeout time.Duration `dotenv:"TW_OTPAAS_CLIENT_TIMEOUT"`
}

// Default returns the default configuration for the application.
func Default() *Config {
	return &Config{
		LogLevel:    slog.LevelInfo,
		Environment: EnvironmentDevelopment,

		Server: ServerConfig{
			Port: 8080,

			ReadTimeout:       60 * time.Second,
			ReadHeaderTimeout: 10 * time.Second,
			WriteTimeout:      60 * time.Second,
			IdleTimeout:       120 * time.Second,
		},

		OTPaas: OTPaasConfig{
			ID:            "",
			Namespace:     "",
			Secret:        "",
			Host:          "https://otp.techpass.suite.gov.sg",
			ClientTimeout: 100 * time.Second,
		},
	}
}
