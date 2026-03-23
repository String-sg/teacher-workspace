package handler

import (
	"net/http"
	"path"
	"strings"

	"github.com/String-sg/teacher-workspace/server/internal/config"
)

var allowedViteRequests = []func(r *http.Request) bool{
	hasPathPrefix("/@vite/"),
	hasPathPrefix("/@fs/"),
	hasPathPrefix("/@react-refresh"),
	hasPathExt(".ts"),
	hasPathExt(".tsx"),
	hasPathExt(".css"),
	isViteHMRWebSocket,
}

func (h *Handler) Index(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Path

	switch {
	case h.cfg.Environment == config.EnvironmentDevelopment && isViteRequest(r):
		h.proxy.ServeHTTP(w, r)
	case h.cfg.Environment == config.EnvironmentProduction && strings.HasPrefix(p, "/assets/"):
		h.assets.ServeHTTP(w, r)
	default:
		h.renderHTML(r, w, nil)
	}
}

// isViteRequest checks if the request is a Vite request.
func isViteRequest(r *http.Request) bool {
	for _, check := range allowedViteRequests {
		if check(r) {
			return true
		}
	}
	return false
}

// hasPathPrefix checks if the request path has the given prefix.
func hasPathPrefix(prefix string) func(r *http.Request) bool {
	return func(r *http.Request) bool {
		return strings.HasPrefix(r.URL.Path, prefix)
	}
}

// hasPathExt checks if the request path has the given extension.
func hasPathExt(ext string) func(r *http.Request) bool {
	return func(r *http.Request) bool {
		return path.Ext(r.URL.Path) == ext
	}
}

// isViteHMRWebSocket checks if the request is a Vite HMR WebSocket request.
func isViteHMRWebSocket(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Connection"), "upgrade") &&
		strings.EqualFold(r.Header.Get("Upgrade"), "websocket") &&
		strings.EqualFold(r.Header.Get("Sec-Websocket-Protocol"), "vite-hmr")
}
