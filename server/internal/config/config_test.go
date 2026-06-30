package config_test

import (
	"log/slog"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

// chdir switches to dir for the duration of the test, restoring the original
// working directory in t.Cleanup. Required for tests that write a .env file,
// since config.Load reads .env from the working directory.
func chdir(t *testing.T, dir string) {
	t.Helper()
	orig, err := os.Getwd()
	if err != nil {
		t.Fatalf("get cwd: %v", err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir %s: %v", dir, err)
	}
	t.Cleanup(func() { _ = os.Chdir(orig) })
}

// writeDotEnv writes content to a .env file in dir.
func writeDotEnv(t *testing.T, dir, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte(content), 0o644); err != nil {
		t.Fatalf("write .env: %v", err)
	}
}

func TestLoad_Defaults(t *testing.T) {
	t.Run("returns built-in defaults when nothing is configured", func(t *testing.T) {
		chdir(t, t.TempDir())

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, config.EnvDevelopment, cfg.Env)
		require.Equal(t, slog.LevelInfo, cfg.LogLevel)
		require.Equal(t, 3000, cfg.Server.Port)
		require.Equal(t, 2*time.Second, cfg.Server.ReadHeaderTimeout)
		require.Equal(t, 15*time.Second, cfg.Server.ReadTimeout)
		require.Equal(t, 30*time.Second, cfg.Server.WriteTimeout)
		require.Equal(t, 60*time.Second, cfg.Server.IdleTimeout)
	})
}

func TestLoad_ProcessEnvPrecedence(t *testing.T) {
	t.Run("real env var takes precedence over .env file", func(t *testing.T) {
		dir := t.TempDir()
		writeDotEnv(t, dir, "TW_SERVER_PORT=8080")
		chdir(t, dir)
		t.Setenv("TW_SERVER_PORT", "9090")

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, 9090, cfg.Server.Port)
	})
}

func TestLoad_DotEnvApplied(t *testing.T) {
	t.Run("value from .env file is applied when variable is unset", func(t *testing.T) {
		dir := t.TempDir()
		writeDotEnv(t, dir, "TW_LOG_LEVEL=debug")
		chdir(t, dir)
		t.Cleanup(func() { _ = os.Unsetenv("TW_LOG_LEVEL") })

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, slog.LevelDebug, cfg.LogLevel)
	})
}

func TestLoad_MissingDotEnv(t *testing.T) {
	t.Run("missing .env file is tolerated", func(t *testing.T) {
		chdir(t, t.TempDir())

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, 3000, cfg.Server.Port)
	})
}

func TestLoad_InvalidConfig(t *testing.T) {
	tests := []struct {
		name string
		key  string
		val  string
	}{
		{name: "unparseable port", key: "TW_SERVER_PORT", val: "abc"},
		{name: "invalid env value", key: "TW_ENV", val: "staging"},
		{name: "out-of-range port", key: "TW_SERVER_PORT", val: "70000"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			chdir(t, t.TempDir())
			t.Setenv(tc.key, tc.val)

			_, err := config.Load()

			require.HasError(t, err)
		})
	}
}

func TestLoad_AdditionalScenarios(t *testing.T) {
	t.Run(".env populates only unset keys", func(t *testing.T) {
		dir := t.TempDir()
		writeDotEnv(t, dir, "TW_SERVER_PORT=8080\nTW_LOG_LEVEL=debug")
		chdir(t, dir)
		t.Setenv("TW_SERVER_PORT", "9090")
		t.Cleanup(func() { _ = os.Unsetenv("TW_LOG_LEVEL") })

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, 9090, cfg.Server.Port)
		require.Equal(t, slog.LevelDebug, cfg.LogLevel)
	})

	t.Run("duration and case-insensitive log level parsing", func(t *testing.T) {
		chdir(t, t.TempDir())
		t.Setenv("TW_SERVER_IDLE_TIMEOUT", "90s")
		t.Setenv("TW_LOG_LEVEL", "DEBUG")

		cfg, err := config.Load()

		require.NoError(t, err)
		require.Equal(t, 90*time.Second, cfg.Server.IdleTimeout)
		require.Equal(t, slog.LevelDebug, cfg.LogLevel)
	})
}
