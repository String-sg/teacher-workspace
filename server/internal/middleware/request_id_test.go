package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestRequestID(t *testing.T) {
	t.Run("sets request ID header on the response", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		h := RequestID(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)
		require.Equal(t, 22, len(res.Header.Get(requestIDHeader)))
	})

	t.Run("stores request ID in context", func(t *testing.T) {
		var gotID string
		var gotOK bool

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotID, gotOK = RequestIDFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		h := RequestID(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)
		require.Equal(t, 22, len(res.Header.Get(requestIDHeader)))
		require.Equal(t, gotID, res.Header.Get(requestIDHeader))
		require.True(t, gotOK)
	})

	t.Run("stores request-scoped logger in context", func(t *testing.T) {
		var gotLogger *slog.Logger

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotLogger = LoggerFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		h := RequestID(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)
		require.NotEqual(t, slog.Default(), gotLogger)
	})
}

func TestRequestIDFromContext(t *testing.T) {
	t.Run("returns empty string and false when not set", func(t *testing.T) {
		id, ok := RequestIDFromContext(context.Background())

		require.Equal(t, "", id)
		require.False(t, ok)
	})
}

func TestLoggerFromContext(t *testing.T) {
	t.Run("returns default logger when not set", func(t *testing.T) {
		logger := LoggerFromContext(context.Background())

		require.Equal(t, slog.Default(), logger)
	})
}
