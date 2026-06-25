package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// responseRecorder wraps http.ResponseWriter to capture the response status
// code so RequestLog can include it in the access log. RequestLog seeds
// status as 200 OK before the handler runs; the first WriteHeader call
// overwrites it, matching typical net/http wire semantics when no status is set.
type responseRecorder struct {
	http.ResponseWriter

	status      int
	wroteHeader bool
}

// WriteHeader records the status code on the first call and forwards it to
// the underlying ResponseWriter. Subsequent calls are forwarded but not
// re-recorded, matching net/http's behavior.
func (rr *responseRecorder) WriteHeader(status int) {
	if !rr.wroteHeader {
		rr.status = status
		rr.wroteHeader = true
	}
	rr.ResponseWriter.WriteHeader(status)
}

// Write forwards to the underlying ResponseWriter.
func (rr *responseRecorder) Write(b []byte) (int, error) {
	return rr.ResponseWriter.Write(b)
}

// Unwrap returns the underlying ResponseWriter so http.ResponseController can
// reach optional interfaces (Flush, Hijack, SetWriteDeadline, etc.) on the real
// writer instead of stopping at this wrapper.
func (rr *responseRecorder) Unwrap() http.ResponseWriter {
	return rr.ResponseWriter
}

// RequestLog is an HTTP middleware that emits one structured access-log entry
// per request with the HTTP method, URL path, response status code, and total
// request duration in milliseconds. It logs through the request-scoped logger
// from the context (see LoggerFromContext), so RequestLog must be chained after
// RequestID to include the request ID in each log line.
func RequestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rec := &responseRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		logger := LoggerFromContext(r.Context())
		logger.LogAttrs(r.Context(), slog.LevelInfo, "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rec.status),
			slog.Int64("duration_ms", time.Since(start).Milliseconds()),
		)
	})
}
