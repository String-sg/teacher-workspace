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
}

func TestRequestID_RequestIDFromContext(t *testing.T) {
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
}

func TestRequestID_LoggerFromContext(t *testing.T) {
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
}

func TestRequestID_LoggerFromContextFallback(t *testing.T) {
	logger := LoggerFromContext(context.Background())
	require.Equal(t, slog.Default(), logger)
}
