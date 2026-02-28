package middleware

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"log/slog"
	"net/http"
)

type ctxKeyRequestID struct{}
type ctxKeyLogger struct{}

const requestIDHeader = "X-Request-ID"

// RequestID is an HTTP middleware that generates a unique request identifier
// for each incoming request. The request ID and a request-scoped logger
// containing it are stored in the request context. The ID is also written to
// the response headers to support log correlation and request tracing.
func RequestID() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := newRequestID()
			ctx := context.WithValue(r.Context(), ctxKeyRequestID{}, id)

			logger := slog.Default().With("request_id", id)
			ctx = context.WithValue(ctx, ctxKeyLogger{}, logger)

			w.Header().Set(requestIDHeader, id)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequestIDFromContext retrieves the request ID from the provided context.
// The returned boolean indicates whether a request ID was present.
func RequestIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(ctxKeyRequestID{}).(string)
	return id, ok
}

// WithRequestID attaches the request ID to the context.
// Intended for use in [RequestID] middleware and tests only.
func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyRequestID{}, id)
}

// LoggerFromContext retrieves the request-scoped logger from the provided
// context. If no logger is present, it falls back to the default logger.
func LoggerFromContext(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(ctxKeyLogger{}).(*slog.Logger); ok {
		return logger
	}
	return slog.Default()
}

// WithLogger attaches the logger to the context.
// Intended for use in [RequestID] middleware and tests only.
func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
	return context.WithValue(ctx, ctxKeyLogger{}, logger)
}

func newRequestID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return base64.RawStdEncoding.EncodeToString(b[:])
}
