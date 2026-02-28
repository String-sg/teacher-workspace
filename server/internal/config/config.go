package config

import (
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"time"
)

type Environment string

const (
	EnvironmentDevelopment Environment = "development"
	EnvironmentStaging     Environment = "staging"
	EnvironmentProduction  Environment = "production"

	OTPProviderOTPaaS = "otpaas"

	SessionCookieName = "tw.session"
	CSRFCookieName    = "tw.csrf"
)

// Config is the main configuration for the application.
type Config struct {
	Environment Environment `dotenv:"TW_ENV"`
	HTTPS       bool        `dotenv:"TW_HTTPS"`
	LogLevel    slog.Level  `dotenv:"TW_LOG_LEVEL"`

	DefaultSessionTTL       time.Duration `dotenv:"TW_DEFAULT_SESSION_TTL"`
	AuthenticatedSessionTTL time.Duration `dotenv:"TW_AUTHENTICATED_SESSION_TTL"`

	Server ServerConfig `dotenv:",squash"`
	OTP    OTPConfig    `dotenv:",squash"`
	Valkey ValkeyConfig `dotenv:",squash"`
}

// ServerConfig represents the configuration for the HTTP server.
type ServerConfig struct {
	Port int `dotenv:"TW_SERVER_PORT"`

	ReadTimeout       time.Duration `dotenv:"TW_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `dotenv:"TW_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `dotenv:"TW_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `dotenv:"TW_SERVER_IDLE_TIMEOUT"`
}

type OTPConfig struct {
	Provider            string   `dotenv:"TW_OTP_PROVIDER"`
	AllowedEmailDomains []string `dotenv:"TW_OTP_ALLOWED_EMAIL_DOMAINS"`

	OTPaaS OTPaaSConfig `dotenv:",squash"`
}

type OTPaaSConfig struct {
	Host         string `dotenv:"TW_OTP_OTPAAS_HOST"`
	AppID        string `dotenv:"TW_OTP_OTPAAS_APP_ID"`
	AppNamespace string `dotenv:"TW_OTP_OTPAAS_APP_NAMESPACE"`
	Secret       string `dotenv:"TW_OTP_OTPAAS_SECRET"`

	Timeout time.Duration `dotenv:"TW_OTP_OTPAAS_TIMEOUT"`
}

type ValkeyConfig struct {
	ConnectionString string `dotenv:"TW_VALKEY_CONNECTION_STRING"`
}

// Default returns the default configuration for the application.
func Default() *Config {
	return &Config{
		Environment: EnvironmentDevelopment,
		HTTPS:       false,
		LogLevel:    slog.LevelInfo,

		DefaultSessionTTL:       3 * time.Hour,
		AuthenticatedSessionTTL: 30 * time.Minute,

		Server: ServerConfig{
			Port: 3000,

			ReadHeaderTimeout: 2 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},

		OTP: OTPConfig{
			Provider: "otpaas",
			AllowedEmailDomains: []string{
				"@schools.gov.sg",
				"@tech.gov.sg",
			},

			OTPaaS: OTPaaSConfig{
				Host:         "https://otp.techpass.suite.gov.sg",
				AppID:        "",
				AppNamespace: "",
				Secret:       "",
				Timeout:      10 * time.Second,
			},
		},

		Valkey: ValkeyConfig{
			ConnectionString: "valkey://default:secret@localhost:6379/0",
		},
	}
}

// Validate validates the configuration and returns an error if any of the
// configuration values are invalid.
func (c *Config) Validate() error {
	var errs []error

	if c.Environment != EnvironmentDevelopment && c.Environment != EnvironmentStaging && c.Environment != EnvironmentProduction {
		errs = append(errs, fmt.Errorf("TW_ENV must be one of %q, %q or %q; got %q", EnvironmentDevelopment, EnvironmentStaging, EnvironmentProduction, c.Environment))
	}

	if c.DefaultSessionTTL <= 0 {
		errs = append(errs, fmt.Errorf("TW_DEFAULT_SESSION_TTL must be a positive duration; got %v", c.DefaultSessionTTL))
	}
	if c.AuthenticatedSessionTTL <= 0 {
		errs = append(errs, fmt.Errorf("TW_AUTHENTICATED_SESSION_TTL must be a positive duration; got %v", c.AuthenticatedSessionTTL))
	}

	return errors.Join(append(
		errs,
		c.Server.validate(),
		c.OTP.validate(),
		c.Valkey.validate(),
	)...)
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

func (c OTPConfig) validate() error {
	var errs []error

	if c.Provider != OTPProviderOTPaaS {
		errs = append(errs, fmt.Errorf("TW_OTP_PROVIDER must be one of %q; got %q", OTPProviderOTPaaS, c.Provider))
	}
	if len(c.AllowedEmailDomains) == 0 {
		errs = append(errs, errors.New("TW_OTP_ALLOWED_EMAIL_DOMAINS is required"))
	}
	for _, domain := range c.AllowedEmailDomains {
		if domain == "" {
			errs = append(errs, errors.New("TW_OTP_ALLOWED_EMAIL_DOMAINS must not contain empty domains"))
		}
	}

	return errors.Join(append(errs, c.OTPaaS.validate())...)
}

func (c OTPaaSConfig) validate() error {
	var errs []error

	if c.Host == "" {
		errs = append(errs, errors.New("TW_OTPAAS_HOST is required"))
	}
	if c.AppID == "" {
		errs = append(errs, errors.New("TW_OTPAAS_APP_ID is required"))
	}
	if c.AppNamespace == "" {
		errs = append(errs, errors.New("TW_OTPAAS_APP_NAMESPACE is required"))
	}
	if c.Secret == "" {
		errs = append(errs, errors.New("TW_OTPAAS_SECRET is required"))
	}
	if c.Timeout <= 0 {
		errs = append(errs, fmt.Errorf("TW_OTPAAS_TIMEOUT must be a positive duration; got %v", c.Timeout))
	}

	return errors.Join(errs...)
}

func (c ValkeyConfig) validate() error {
	var errs []error

	if c.ConnectionString == "" {
		errs = append(errs, errors.New("TW_VALKEY_CONNECTION_STRING is required (e.g. valkey://username:password@host:port/database)"))
	} else {
		u, err := url.Parse(c.ConnectionString)
		if err != nil {
			errs = append(errs, fmt.Errorf("TW_VALKEY_CONNECTION_STRING must be a valid URL (e.g. valkey://username:password@host:port/database): %w", err))
		} else {
			if u.Scheme != "valkey" {
				errs = append(errs, fmt.Errorf("TW_VALKEY_CONNECTION_STRING must use scheme valkey://; got %q", u.Scheme))
			}
			if u.Host == "" {
				errs = append(errs, fmt.Errorf("TW_VALKEY_CONNECTION_STRING must include host[:port]; got %q", u.Host))
			}
		}
	}

	return errors.Join(errs...)
}
