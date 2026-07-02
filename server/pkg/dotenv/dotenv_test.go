package dotenv

import (
	"log/slog"
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
			t.Fatalf("write .env: %v", err)
		}

		origDir, err := os.Getwd()
		if err != nil {
			t.Fatalf("get cwd: %v", err)
		}
		if err := os.Chdir(root); err != nil {
			t.Fatalf("chdir: %v", err)
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
			t.Fatalf("get cwd: %v", err)
		}
		if err := os.Chdir(root); err != nil {
			t.Fatalf("chdir: %v", err)
		}
		t.Cleanup(func() { _ = os.Chdir(origDir) })

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
			{name: "debug", value: "debug", want: slog.LevelDebug},
			{name: "info", value: "info", want: slog.LevelInfo},
			{name: "warn", value: "warn", want: slog.LevelWarn},
			{name: "error", value: "error", want: slog.LevelError},
			{name: "invalid level", value: "verbose", wantErr: true},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				content := "TEST_LOG_LEVEL=" + tc.value

				var cfg TestConfig
				err := decode([]byte(content), &cfg)

				t.Cleanup(func() { _ = os.Unsetenv("TEST_LOG_LEVEL") })

				if tc.wantErr {
					require.HasError(t, err)
					return
				}

				require.NoError(t, err)
				require.Equal(t, tc.want, cfg.LogLevel)
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
			{name: "seconds", value: "15s", want: 15 * time.Second},
			{name: "minutes and seconds", value: "1m30s", want: 90 * time.Second},
			{name: "missing unit", value: "1", wantErr: true},
			{name: "invalid duration", value: "not-a-duration", wantErr: true},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				content := "TEST_READ_TIMEOUT=" + tc.value

				var cfg TestConfig
				err := decode([]byte(content), &cfg)

				t.Cleanup(func() { _ = os.Unsetenv("TEST_READ_TIMEOUT") })

				if tc.wantErr {
					require.HasError(t, err)
					return
				}

				require.NoError(t, err)
				require.Equal(t, tc.want, cfg.ReadTimeout)
			})
		}
	})

	t.Run("process env takes precedence over dotenv data", func(t *testing.T) {
		type TestConfig struct {
			Environment string `dotenv:"GO_ENV"`
			Port        int    `dotenv:"PORT"`
		}

		tests := []struct {
			name   string
			env    map[string]string
			dotenv string
			want   TestConfig
		}{
			{
				name: "single field overridden by process env",
				env:  map[string]string{"PORT": "8080"},
				dotenv: strings.Join([]string{
					"GO_ENV=development",
					"PORT=3000",
				}, "\n"),
				want: TestConfig{Environment: "development", Port: 8080},
			},
			{
				name: "all fields overridden by process env",
				env:  map[string]string{"GO_ENV": "staging", "PORT": "8080"},
				dotenv: strings.Join([]string{
					"GO_ENV=development",
					"PORT=3000",
				}, "\n"),
				want: TestConfig{Environment: "staging", Port: 8080},
			},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				for k, v := range tc.env {
					t.Setenv(k, v)
				}

				var cfg TestConfig
				err := decode([]byte(tc.dotenv), &cfg)

				require.NoError(t, err)
				require.Equal(t, tc.want.Environment, cfg.Environment)
				require.Equal(t, tc.want.Port, cfg.Port)
			})
		}
	})
}
