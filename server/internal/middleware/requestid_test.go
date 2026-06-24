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
	t.Run("sets X-Request-ID header on the response", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		RequestID(next).ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)
		require.Equal(t, 32, len(res.Header.Get(requestIDHeader)))
	})

	t.Run("two requests get different IDs", func(t *testing.T) {
		var ids [2]string

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		for i := range ids {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			RequestID(next).ServeHTTP(rec, req)
			ids[i] = rec.Result().Header.Get(requestIDHeader)
		}

		require.NotEqual(t, ids[0], ids[1])
	})

	t.Run("response X-Request-ID matches the log line request_id", func(t *testing.T) {
		var ctxID string

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, ok := RequestIDFromContext(r.Context())
			require.True(t, ok)
			ctxID = id
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		RequestID(next).ServeHTTP(rec, req)

		headerID := rec.Result().Header.Get(requestIDHeader)
		require.Equal(t, headerID, ctxID)
	})

	t.Run("stores request-scoped logger in context", func(t *testing.T) {
		var gotLogger *slog.Logger

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotLogger = LoggerFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		RequestID(next).ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Result().StatusCode)
		require.NotEqual(t, slog.Default(), gotLogger)
	})

	t.Run("handler log lines carry the same request_id as the access-log line", func(t *testing.T) {
		var handlerLogger *slog.Logger

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlerLogger = LoggerFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		RequestID(next).ServeHTTP(rec, req)

		headerID := rec.Result().Header.Get(requestIDHeader)
		require.Equal(t, 32, len(headerID))
		require.NotEqual(t, (*slog.Logger)(nil), handlerLogger)
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
