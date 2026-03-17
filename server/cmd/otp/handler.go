package main

import (
	"encoding/json"
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

type Handler struct {
	cfg    *Config
	client *http.Client
}

const (
	HeaderContentType         = "Content-Type"
	HeaderXContentTypeOptions = "X-Content-Type-Options"
)

const (
	charsetUTF8                    = "charset=UTF-8"
	MIMEApplicationJSON            = "application/json"
	MIMEApplicationJSONCharsetUTF8 = MIMEApplicationJSON + "; " + charsetUTF8
	MIMETextHTML                   = "text/html"
	MIMETextHTMLCharsetUTF8        = MIMETextHTML + "; " + charsetUTF8
	MIMETextPlain                  = "text/plain"
	MIMETextPlainCharsetUTF8       = MIMETextPlain + "; " + charsetUTF8
)

func Register(mux *http.ServeMux, cfg *Config, client *http.Client) {
	routes := &Handler{cfg: cfg, client: client}

	mux.HandleFunc("POST /request", routes.Request)
	mux.HandleFunc("POST /verify/{flow_id}", routes.Verify)
}

func (h *Handler) renderJSON(r *http.Request, w http.ResponseWriter, statusCode int, data any) {
	logger := middleware.LoggerFromContext(r.Context())

	w.Header().Set(HeaderContentType, MIMEApplicationJSONCharsetUTF8)
	w.Header().Set(HeaderXContentTypeOptions, "nosniff")

	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		logger.Warn("failed to write response body", "renderer", "json", "err", err)
	}
}
