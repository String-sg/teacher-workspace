package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestFrontend_Index_NonDev(t *testing.T) {
	dir := t.TempDir()
	indexHTML := `<!DOCTYPE html><html><body><script type="application/json" id="preloaded-data">{{.}}</script></body></html>`
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte(indexHTML), 0644))
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0755))

	cfg := config.Default()
	cfg.Environment = config.EnvironmentStaging
	cfg.Server.FrontendBuildDir = dir

	f, err := NewFrontend(cfg, &http.Client{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	f.Index(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "text/html; charset=utf-8", res.Header.Get("Content-Type"))
	body := rec.Body.String()
	require.True(t, strings.Contains(body, `id="preloaded-data"`))
	require.True(t, strings.Contains(body, "{}"))
}

func TestFrontend_Index_Dev(t *testing.T) {
	viteHTML := `<!DOCTYPE html><html><body><script type="application/json" id="preloaded-data">{{.}}</script></body></html>`
	vite := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(viteHTML))
	}))
	defer vite.Close()

	cfg := config.Default()
	cfg.Environment = config.EnvironmentDevelopment
	cfg.Server.ViteDevServerURL = vite.URL

	f, err := NewFrontend(cfg, vite.Client())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	f.Index(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "text/html; charset=utf-8", res.Header.Get("Content-Type"))
	body := rec.Body.String()
	require.True(t, strings.Contains(body, `id="preloaded-data"`))
	require.True(t, strings.Contains(body, "{}"))
}

func TestFrontend_Index_MethodNotAllowed(t *testing.T) {
	dir := t.TempDir()
	indexHTML := `<!DOCTYPE html><html><body>{{.}}</body></html>`
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte(indexHTML), 0644))
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0755))

	cfg := config.Default()
	cfg.Environment = config.EnvironmentStaging
	cfg.Server.FrontendBuildDir = dir

	f, err := NewFrontend(cfg, &http.Client{})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()

	f.Index(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusMethodNotAllowed, res.StatusCode)
	require.Equal(t, "application/json", res.Header.Get("Content-Type"))

	var errResp errorResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&errResp))
	require.Equal(t, ErrorCodeMethodNotAllowed, errResp.Code)
	require.Equal(t, "Method not allowed", errResp.Message)
}

func TestNewFrontend_Development_Success(t *testing.T) {
	cfg := config.Default()
	cfg.Environment = config.EnvironmentDevelopment
	cfg.Server.ViteDevServerURL = "http://localhost:5173"

	f, err := NewFrontend(cfg, &http.Client{})
	require.NoError(t, err)
	if f == nil {
		t.Fatal("expected non-nil Frontend")
	}
}

func TestNewFrontend_Development_InvalidURL(t *testing.T) {
	cfg := config.Default()
	cfg.Environment = config.EnvironmentDevelopment
	cfg.Server.ViteDevServerURL = "http://%zz" // invalid percent-encoding so url.Parse returns error

	_, err := NewFrontend(cfg, &http.Client{})
	require.HasError(t, err)
}

func TestNewFrontend_NonDev_Success(t *testing.T) {
	dir := t.TempDir()
	indexHTML := `<!DOCTYPE html><html><body>{{.}}</body></html>`
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte(indexHTML), 0644))
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0755))

	cfg := config.Default()
	cfg.Environment = config.EnvironmentStaging
	cfg.Server.FrontendBuildDir = dir

	f, err := NewFrontend(cfg, &http.Client{})
	require.NoError(t, err)
	if f == nil {
		t.Fatal("expected non-nil Frontend")
	}
}

func TestNewFrontend_NonDev_MissingIndex(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0755))

	cfg := config.Default()
	cfg.Environment = config.EnvironmentStaging
	cfg.Server.FrontendBuildDir = dir

	_, err := NewFrontend(cfg, &http.Client{})
	require.HasError(t, err)
}

func TestNewFrontend_NonDev_InvalidTemplate(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0755))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte("{{end}}"), 0644))

	cfg := config.Default()
	cfg.Environment = config.EnvironmentStaging
	cfg.Server.FrontendBuildDir = dir

	_, err := NewFrontend(cfg, &http.Client{})
	require.HasError(t, err)
}
