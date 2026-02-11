package config

import (
	"log/slog"
	"time"
)

// Config is the main configuration for the application.
type Config struct {
	LogLevel slog.Level `dotenv:"TW_LOG_LEVEL"`

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
	ID        string `dotenv:"TW_APP_ID"`
	Namespace string `dotenv:"TW_APP_NAMESPACE"`
	Secret    string `dotenv:"TW_APP_SECRET"`
	Host      string `dotenv:"TW_TECHPASS_OTP_HOST"`
}

// Default returns the default configuration for the application.
func Default() *Config {
	return &Config{
		LogLevel: slog.LevelInfo,

		Server: ServerConfig{
			Port: 8080,

			ReadTimeout:       60 * time.Second,
			ReadHeaderTimeout: 10 * time.Second,
			WriteTimeout:      60 * time.Second,
			IdleTimeout:       120 * time.Second,
		},

		OTPaas: OTPaasConfig{
			ID:        "",
			Namespace: "",
			Secret:    "",
			Host:      "https://otp.techpass.suite.gov.sg",
		},
	}
}
