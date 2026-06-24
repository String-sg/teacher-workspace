package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func newCtxWithLogger(buf *bytes.Buffer) context.Context {
	logger := slog.New(slog.NewJSONHandler(buf, nil))
	return context.WithValue(context.Background(), ctxKeyLogger{}, logger)
}

func TestRequestLog(t *testing.T) {
	type logEntry struct {
		Level      string `json:"level"`
		Msg        string `json:"msg"`
		Method     string `json:"method"`
		Path       string `json:"path"`
		Status     int    `json:"status"`
		DurationMS int64  `json:"duration_ms"`
	}

	t.Run("logs method, path, status, and duration", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
		})

		req := httptest.NewRequest(http.MethodPost, "/users", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)

		var entry logEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("failed to unmarshal log entry: %v", err)
		}

		require.Equal(t, "INFO", entry.Level)
		require.Equal(t, "request", entry.Msg)
		require.Equal(t, http.MethodPost, entry.Method)
		require.Equal(t, "/users", entry.Path)
		require.Equal(t, http.StatusCreated, entry.Status)
		if entry.DurationMS < 0 {
			t.Errorf("want: >= 0; got: %d", entry.DurationMS)
		}
	})

	t.Run("logs status 200 when handler never calls WriteHeader", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)

		var entry logEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("failed to unmarshal log entry: %v", err)
		}

		require.Equal(t, http.StatusOK, entry.Status)
	})

	t.Run("not-found responses are logged with status 404", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.NotFound(w, r)
		})

		req := httptest.NewRequest(http.MethodGet, "/unknown", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)

		var entry logEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("failed to unmarshal log entry: %v", err)
		}

		require.Equal(t, "/unknown", entry.Path)
		require.Equal(t, http.StatusNotFound, entry.Status)
	})

	t.Run("records status from first WriteHeader call only", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusTeapot)
			w.WriteHeader(http.StatusInternalServerError)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)

		var entry logEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("failed to unmarshal log entry: %v", err)
		}

		require.Equal(t, http.StatusTeapot, entry.Status)
	})

	t.Run("records implicit 200 when handler writes body without WriteHeader", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, err := w.Write([]byte("hello")); err != nil {
				t.Fatalf("failed to write: %v", err)
			}
		})

		req := httptest.NewRequest(http.MethodGet, "/hello", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)

		var entry logEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("failed to unmarshal log entry: %v", err)
		}

		require.Equal(t, http.StatusOK, entry.Status)
	})

	t.Run("unwraps responseRecorder for ResponseController", func(t *testing.T) {
		var buf bytes.Buffer
		ctx := newCtxWithLogger(&buf)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if err := http.NewResponseController(w).Flush(); err != nil {
				t.Errorf("want err: nil; got: %v", err)
			}
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		RequestLog(next).ServeHTTP(rec, req)
	})

	t.Run("falls back to default logger when no request logger in context", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		// must not panic
		RequestLog(next).ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("concurrent requests get independent loggers with no data race", func(t *testing.T) {
		const n = 50
		var wg sync.WaitGroup
		wg.Add(n)

		for i := 0; i < n; i++ {
			go func() {
				defer wg.Done()

				var buf bytes.Buffer
				ctx := newCtxWithLogger(&buf)

				next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				})

				req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
				rec := httptest.NewRecorder()

				RequestID(RequestLog(next)).ServeHTTP(rec, req)
			}()
		}

		wg.Wait()
	})
}
