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
	Port int `dotenv:"OTP_SERVER_PORT"`

	ReadTimeout       time.Duration `dotenv:"OTP_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `dotenv:"OTP_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"OTP_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"OTP_SERVER_IDLE_TIMEOUT"`
}

type OTPaaSConfig struct {
	Host         string        `dotenv:"OTP_OTPAAS_HOST"`
	AppID        string        `dotenv:"OTP_OTPAAS_ID"`
	AppNamespace string        `dotenv:"OTP_OTPAAS_APP_NAMESPACE"`
	Secret       string        `dotenv:"OTP_OTPAAS_SECRET"`
	Timeout      time.Duration `dotenv:"OTP_OTPAAS_TIMEOUT"`
}

type Config struct {
	Environment Environment `dotenv:"OTP_ENV"`
	LogLevel    slog.Level  `dotenv:"OTP_LOG_LEVEL"`

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

	if c.Environment != EnvDevelopment && c.Environment != EnvStaging && c.Environment != EnvProduction {
		errs = append(errs, fmt.Errorf("OTP_ENV must be one of %q, %q or %q; got %q", EnvDevelopment, EnvStaging, EnvProduction, c.Environment))
	}

	return errors.Join(append(errs, c.Server.validate(), c.OTPaaS.validate())...)
}

func (c ServerConfig) validate() error {
	var errs []error

	if c.Port < 1 || c.Port > 65535 {
		errs = append(errs, fmt.Errorf("OTP_SERVER_PORT must be between 1 and 65535; got %d", c.Port))
	}
	if c.ReadHeaderTimeout <= 0 {
		errs = append(errs, fmt.Errorf("OTP_SERVER_READ_HEADER_TIMEOUT must be a positive duration; got %v", c.ReadHeaderTimeout))
	}
	if c.ReadTimeout <= 0 {
		errs = append(errs, fmt.Errorf("OTP_SERVER_READ_TIMEOUT must be a positive duration; got %v", c.ReadTimeout))
	}
	if c.WriteTimeout <= 0 {
		errs = append(errs, fmt.Errorf("OTP_SERVER_WRITE_TIMEOUT must be a positive duration; got %v", c.WriteTimeout))
	}
	if c.IdleTimeout <= 0 {
		errs = append(errs, fmt.Errorf("OTP_SERVER_IDLE_TIMEOUT must be a positive duration; got %v", c.IdleTimeout))
	}

	return errors.Join(errs...)
}

func (c OTPaaSConfig) validate() error {
	var errs []error

	if c.Host == "" {
		errs = append(errs, errors.New("OTP_OTPAAS_HOST is required"))
	}
	if c.AppID == "" {
		errs = append(errs, errors.New("OTP_OTPAAS_APP_ID is required"))
	}
	if c.AppNamespace == "" {
		errs = append(errs, errors.New("OTP_OTPAAS_APP_NAMESPACE is required"))
	}
	if c.Secret == "" {
		errs = append(errs, errors.New("OTP_OTPAAS_SECRET is required"))
	}
	if c.Timeout <= 0 {
		errs = append(errs, fmt.Errorf("OTP_OTPAAS_TIMEOUT must be a positive duration; got %v", c.Timeout))
	}

	return errors.Join(errs...)
}
