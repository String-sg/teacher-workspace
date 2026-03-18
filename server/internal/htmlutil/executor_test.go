package htmlutil

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestDevelopmentTemplateExecutor_Execute(t *testing.T) {
	t.Run("renders template with provided data", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			_, _ = w.Write([]byte(`<html>Hello {{.Name}}</html>`))
		}))
		defer srv.Close()

		executor := NewDevelopmentTemplateExecutor(srv.URL)

		var buf bytes.Buffer
		err := executor.Execute(context.Background(), &buf, struct{ Name string }{Name: "World"})

		require.NoError(t, err)
		require.Equal(t, "<html>Hello World</html>", buf.String())
	})

	t.Run("renders template with empty values when data is nil", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			_, _ = w.Write([]byte(`<html>Hello {{.Name}}</html>`))
		}))
		defer srv.Close()

		exec := NewDevelopmentTemplateExecutor(srv.URL)

		var buf bytes.Buffer
		err := exec.Execute(context.Background(), &buf, nil)
		require.NoError(t, err)
		require.Equal(t, "<html>Hello </html>", buf.String())
	})

	t.Run("fails when server URL is malformed", func(t *testing.T) {
		executor := NewDevelopmentTemplateExecutor("http://%zz")

		var buf bytes.Buffer
		err := executor.Execute(context.Background(), &buf, nil)
		require.HasError(t, err)
		require.True(t, strings.Contains(err.Error(), "create request"))
	})

	t.Run("fails when server returns invalid template syntax", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			_, _ = w.Write([]byte(`{{Name}}`))
		}))
		defer srv.Close()

		executor := NewDevelopmentTemplateExecutor(srv.URL)

		var buf bytes.Buffer
		err := executor.Execute(context.Background(), &buf, nil)
		require.HasError(t, err)
		require.True(t, strings.Contains(err.Error(), "parse template"))
	})

	t.Run("server is unreachable", func(t *testing.T) {
		executor := NewDevelopmentTemplateExecutor("http://127.0.0.1:1")

		var buf bytes.Buffer
		err := executor.Execute(context.Background(), &buf, nil)
		require.HasError(t, err)
		require.True(t, strings.Contains(err.Error(), "send request"))
	})

	t.Run("context cancelled", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`<html></html>`))
		}))
		defer srv.Close()

		executor := NewDevelopmentTemplateExecutor(srv.URL)

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		var buf bytes.Buffer
		err := executor.Execute(ctx, &buf, nil)
		require.HasError(t, err)
	})
}

func TestNewProductionTemplateExecutor(t *testing.T) {
	t.Run("parses a valid template file", func(t *testing.T) {
		dir := t.TempDir()
		err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(`<html>{{.Name}}</html>`), 0o644)
		require.NoError(t, err)

		executor, err := NewProductionTemplateExecutor(filepath.Join(dir, "index.html"))
		require.NoError(t, err)
		require.True(t, executor != nil)
	})

	t.Run("template file does not exist", func(t *testing.T) {
		dir := t.TempDir()

		_, err := NewProductionTemplateExecutor(filepath.Join(dir, "nonexistent/path/index.html"))
		require.HasError(t, err)
		require.True(t, strings.Contains(err.Error(), "parse template"))
	})

	t.Run("fails when template file has invalid syntax", func(t *testing.T) {
		dir := t.TempDir()
		err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(`{{Name}}`), 0o644)
		require.NoError(t, err)

		_, err = NewProductionTemplateExecutor(filepath.Join(dir, "index.html"))
		require.HasError(t, err)
		require.True(t, strings.Contains(err.Error(), "parse template"))
	})
}

func TestProductionTemplateExecutor_Execute(t *testing.T) {
	t.Run("renders template with provided data", func(t *testing.T) {
		dir := t.TempDir()
		err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(`<html>Hello {{.Name}}</html>`), 0o644)
		require.NoError(t, err)

		exec, err := NewProductionTemplateExecutor(filepath.Join(dir, "index.html"))
		require.NoError(t, err)

		var buf bytes.Buffer
		err = exec.Execute(context.Background(), &buf, struct{ Name string }{Name: "World"})
		require.NoError(t, err)
		require.Equal(t, "<html>Hello World</html>", buf.String())
	})

	t.Run("renders template with empty values when data is nil", func(t *testing.T) {
		dir := t.TempDir()
		err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(`<html>Hello {{.Name}}</html>`), 0o644)
		require.NoError(t, err)

		exec, err := NewProductionTemplateExecutor(filepath.Join(dir, "index.html"))
		require.NoError(t, err)

		var buf bytes.Buffer
		err = exec.Execute(context.Background(), &buf, nil)
		require.NoError(t, err)
		require.Equal(t, "<html>Hello </html>", buf.String())
	})
}
