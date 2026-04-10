package pg

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

func (h *Handler) registerProxy(mux *http.ServeMux) {
	target, err := url.Parse(h.cfg.BaseURL)
	if err != nil {
		slog.Error("pg proxy: invalid base URL", "url", h.cfg.BaseURL, "err", err)
		return
	}

	proxy := &httputil.ReverseProxy{
		Director:     h.director(target),
		ErrorHandler: h.proxyErrorHandler,
		Transport: &http.Transport{
			ResponseHeaderTimeout: time.Duration(h.cfg.TimeoutMS) * time.Millisecond,
		},
	}

	// Forward all /api/ requests to the upstream PG server.
	// pgw-web handles its own routing, so we don't need to enumerate routes here.
	mux.Handle("GET /api/{path...}", proxy)
	mux.Handle("POST /api/{path...}", proxy)
	mux.Handle("PUT /api/{path...}", proxy)
	mux.Handle("DELETE /api/{path...}", proxy)
}

func (h *Handler) director(target *url.URL) func(*http.Request) {
	return func(r *http.Request) {
		r.URL.Scheme = target.Scheme
		r.URL.Host = target.Host
		r.Host = target.Host

		// Strip any forwarded headers that could leak internal topology.
		r.Header.Del("X-Forwarded-For")
		r.Header.Del("X-Real-IP")

		// Attach staff identity for pgw-web to resolve the authenticated user.
		// pgw-web must whitelist TW's server IP and trust this header.
		r.Header.Del("X-TW-Staff-ID") // prevent spoofing from browser
		if staffID, ok := StaffIDFromContext(r.Context()); ok {
			r.Header.Set("X-TW-Staff-ID", fmt.Sprintf("%d", staffID))
		}
	}
}

func (h *Handler) proxyErrorHandler(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("pg proxy upstream error",
		"path", r.URL.Path,
		"method", r.Method,
		"err", err,
	)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusBadGateway)
	_, _ = w.Write([]byte(`{"error":"pg_unavailable","message":"Parents Gateway is temporarily unavailable"}`))
}
