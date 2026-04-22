package dotenv

import (
	"log/slog"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestLoad(t *testing.T) {
	type TestConfig struct {
		Environment string `dotenv:"GO_ENV"`
	}

	t.Run("reads dotenv file from working directory", func(t *testing.T) {
		root := t.TempDir()
		content := strings.Join([]string{
			"GO_ENV=development",
		}, "\n")

		if err := os.WriteFile(filepath.Join(root, ".env"), []byte(content), 0o644); err != nil {
			t.Fatalf("failed to write dotenv file: %v", err)
		}

		origDir, err := os.Getwd()
		if err != nil {
			t.Fatalf("failed to get cwd: %v", err)
		}

		if err := os.Chdir(root); err != nil {
			t.Fatalf("failed to change dir: %v", err)
		}
		t.Cleanup(func() {
			_ = os.Chdir(origDir)
			_ = os.Unsetenv("GO_ENV")
		})

		var cfg TestConfig
		err = Load(&cfg)

		require.NoError(t, err)
		require.Equal(t, "development", cfg.Environment)
	})

	t.Run("succeeds without a dotenv file", func(t *testing.T) {
		root := t.TempDir()

		origDir, err := os.Getwd()
		if err != nil {
			t.Fatalf("failed to get cwd: %v", err)
		}

		if err := os.Chdir(root); err != nil {
			t.Fatalf("failed to change dir: %v", err)
		}
		t.Cleanup(func() {
			_ = os.Chdir(origDir)
			_ = os.Unsetenv("GO_ENV")
		})

		var cfg TestConfig
		err = Load(&cfg)

		require.NoError(t, err)
		require.Equal(t, "", cfg.Environment)
	})
}

func TestDecode(t *testing.T) {
	t.Run("log level", func(t *testing.T) {
		type TestConfig struct {
			LogLevel slog.Level `dotenv:"TEST_LOG_LEVEL"`
		}

		tests := []struct {
			name    string
			value   string
			want    slog.Level
			wantErr bool
		}{
			{
				name:  "debug",
				value: "debug",
				want:  slog.LevelDebug,
			},
			{
				name:  "info",
				value: "info",
				want:  slog.LevelInfo,
			},
			{
				name:  "warn",
				value: "warn",
				want:  slog.LevelWarn,
			},
			{
				name:  "error",
				value: "error",
				want:  slog.LevelError,
			},
			{
				name:    "invalid level",
				value:   "verbose",
				wantErr: true,
			},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				content := strings.Join([]string{
					"TEST_LOG_LEVEL=" + test.value,
				}, "\n")

				var cfg TestConfig
				err := decode([]byte(content), &cfg)

				t.Cleanup(func() {
					if err := os.Unsetenv("TEST_LOG_LEVEL"); err != nil {
						t.Fatalf("failed to unset env: %v", err)
					}
				})

				if test.wantErr {
					require.HasError(t, err)
					return
				}

				require.NoError(t, err)
				require.Equal(t, test.want, cfg.LogLevel)
			})
		}
	})

	t.Run("duration", func(t *testing.T) {
		type TestConfig struct {
			ReadTimeout time.Duration `dotenv:"TEST_READ_TIMEOUT"`
		}

		tests := []struct {
			name    string
			value   string
			want    time.Duration
			wantErr bool
		}{
			{
				name:  "seconds",
				value: "15s",
				want:  15 * time.Second,
			},
			{
				name:  "minutes and seconds",
				value: "1m30s",
				want:  90 * time.Second,
			},
			{
				name:    "missing unit",
				value:   "1",
				wantErr: true,
			},
			{
				name:    "invalid duration",
				value:   "not-a-duration",
				wantErr: true,
			},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				content := strings.Join([]string{
					"TEST_READ_TIMEOUT=" + test.value,
				}, "\n")

				var cfg TestConfig
				err := decode([]byte(content), &cfg)

				t.Cleanup(func() {
					if err := os.Unsetenv("TEST_READ_TIMEOUT"); err != nil {
						t.Fatalf("failed to unset env: %v", err)
					}
				})

				if test.wantErr {
					require.HasError(t, err)
					return
				}

				require.NoError(t, err)
				require.Equal(t, test.want, cfg.ReadTimeout)
			})
		}
	})

	t.Run("url", func(t *testing.T) {
		type TestConfig struct {
			BaseURL *url.URL `dotenv:"TEST_BASE_URL"`
		}

		tests := []struct {
			name    string
			initial *url.URL
			value   string
			want    string
		}{
			{
				name:  "http",
				value: "http://localhost:8080",
				want:  "http://localhost:8080",
			},
			{
				name:  "postgres",
				value: "postgres://user:pass@host:5432/db",
				want:  "postgres://user:pass@host:5432/db",
			},
			{
				name:  "empty string",
				value: "",
				want:  "",
			},
			{
				name: "overrides prepopulated pointer",
				initial: func() *url.URL {
					u, _ := url.Parse("http://default:1234")
					return u
				}(),
				value: "http://override:5678",
				want:  "http://override:5678",
			},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				content := strings.Join([]string{
					"TEST_BASE_URL=" + test.value,
				}, "\n")

				cfg := TestConfig{BaseURL: test.initial}
				err := decode([]byte(content), &cfg)

				t.Cleanup(func() {
					if err := os.Unsetenv("TEST_BASE_URL"); err != nil {
						t.Fatalf("failed to unset env: %v", err)
					}
				})

				require.NoError(t, err)
				require.Equal(t, test.want, cfg.BaseURL.String())
			})
		}
	})

	t.Run("overrides environment variables", func(t *testing.T) {
		type TestConfig struct {
			Environment string `dotenv:"GO_ENV"`
			Port        int    `dotenv:"PORT"`
			DatabaseURL string `dotenv:"DATABASE_URL"`
		}

		tests := []struct {
			name   string
			env    map[string]string
			want   TestConfig
			dotenv string
		}{
			{
				name: "single field",
				env: map[string]string{
					"PORT": "8080",
				},
				want: TestConfig{
					Environment: "development",
					Port:        8080,
					DatabaseURL: "postgres://user:pass@host:5432/db",
				},
				dotenv: strings.Join([]string{
					"GO_ENV=development",
					"PORT=3000",
					"DATABASE_URL=postgres://user:pass@host:5432/db",
				}, "\n"),
			},
			{
				name: "all fields",
				env: map[string]string{
					"GO_ENV":       "staging",
					"PORT":         "8080",
					"DATABASE_URL": "postgres://user:pass@host:5432/db",
				},
				want: TestConfig{
					Environment: "staging",
					Port:        8080,
					DatabaseURL: "postgres://user:pass@host:5432/db",
				},
				dotenv: strings.Join([]string{
					"GO_ENV=development",
					"PORT=3000",
					"DATABASE_URL=mysql://user:pass@host:3306/db",
				}, "\n"),
			},
			{
				name: "empty value",
				env: map[string]string{
					"DATABASE_URL": "",
				},
				want: TestConfig{
					Environment: "development",
					Port:        3000,
					DatabaseURL: "",
				},
				dotenv: strings.Join([]string{
					"GO_ENV=development",
					"PORT=3000",
					"DATABASE_URL=postgres://user:pass@host:5432/db",
				}, "\n"),
			},
		}

		for _, test := range tests {
			t.Run(test.name, func(t *testing.T) {
				for key, value := range test.env {
					t.Setenv(key, value)
				}

				var cfg TestConfig
				err := decode([]byte(test.dotenv), &cfg)

				require.NoError(t, err)
				require.Equal(t, test.want.Environment, cfg.Environment)
				require.Equal(t, test.want.Port, cfg.Port)
				require.Equal(t, test.want.DatabaseURL, cfg.DatabaseURL)
			})
		}
	})
}
