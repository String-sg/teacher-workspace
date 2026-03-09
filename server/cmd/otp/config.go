package main

import (
	"errors"
	"fmt"
	"log/slog"
	"time"
)

type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvStaging     Environment = "staging"
	EnvProduction  Environment = "production"
)

type ServerConfig struct {
	Port int `dotenv:"TW_SERVER_PORT"`

	ReadTimeout       time.Duration `dotenv:"TW_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `dotenv:"TW_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"TW_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"TW_SERVER_IDLE_TIMEOUT"`
}

type OTPaaSConfig struct {
	Host      string        `dotenv:"TW_OTPAAS_HOST"`
	AppID     string        `dotenv:"TW_OTPAAS_ID"`
	Namespace string        `dotenv:"TW_OTPAAS_NAMESPACE"`
	Secret    string        `dotenv:"TW_OTPAAS_SECRET"`
	Timeout   time.Duration `dotenv:"TW_OTPAAS_TIMEOUT"`
}

type Config struct {
	Environment Environment `dotenv:"TW_ENV"`
	LogLevel    slog.Level  `dotenv:"TW_LOG_LEVEL"`

	Server ServerConfig `dotenv:",squash"`
	OTPaaS OTPaaSConfig `dotenv:",squash"`
}

func Default() *Config {
	return &Config{
		Environment: EnvDevelopment,
		LogLevel:    slog.LevelInfo,

		Server: ServerConfig{
			Port: 3001,

			ReadHeaderTimeout: 2 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},
		OTPaaS: OTPaaSConfig{
			Host:    "https://otp.techpass.suite.gov.sg",
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Config) Validate() error {
	var errs []error

	if c.Server.Port < 1 || c.Server.Port > 65535 {
		errs = append(errs, fmt.Errorf("TW_SERVER_PORT must be between 1 and 65535; got %d", c.Server.Port))
	}
	if c.Server.ReadHeaderTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_HEADER_TIMEOUT must be a positive duration; got %v", c.Server.ReadHeaderTimeout))
	}
	if c.Server.ReadTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_READ_TIMEOUT must be a positive duration; got %v", c.Server.ReadTimeout))
	}
	if c.Server.WriteTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_WRITE_TIMEOUT must be a positive duration; got %v", c.Server.WriteTimeout))
	}
	if c.Server.IdleTimeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_SERVER_IDLE_TIMEOUT must be a positive duration; got %v", c.Server.IdleTimeout))
	}
	if c.OTPaaS.Host == "" {
		errs = append(errs, errors.New("TW_OTPAAS_HOST is required"))
	}
	if c.OTPaaS.AppID == "" {
		errs = append(errs, errors.New("TW_OTPAAS_ID is required"))
	}
	if c.OTPaaS.Namespace == "" {
		errs = append(errs, errors.New("TW_OTPAAS_NAMESPACE is required"))
	}
	if c.OTPaaS.Secret == "" {
		errs = append(errs, errors.New("TW_OTPAAS_SECRET is required"))
	}
	if c.OTPaaS.Timeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_TIMEOUT must be positive; got %v", c.OTPaaS.Timeout))
	}

	return errors.Join(errs...)
}
