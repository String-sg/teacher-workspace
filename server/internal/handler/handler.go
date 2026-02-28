package handler

import (
	"encoding/json"
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/otp"
)

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

type Handler struct {
	cfg *config.Config

	otpProvider otp.Provider
}

func New(cfg *config.Config, otpProvider otp.Provider) *Handler {
	return &Handler{cfg: cfg, otpProvider: otpProvider}
}

// Register attaches all application routes to the provided ServeMux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("/", h.Index)

	mux.HandleFunc("POST /otp/request", h.RequestOTP)
	// mux.HandleFunc("POST /otp/verify", h.VerifyOTP)
}

func (h *Handler) renderPlain(r *http.Request, w http.ResponseWriter, statusCode int) {
	logger := middleware.LoggerFromContext(r.Context())

	w.Header().Set(HeaderContentType, MIMETextPlainCharsetUTF8)
	w.Header().Set(HeaderXContentTypeOptions, "nosniff")

	w.WriteHeader(statusCode)

	if _, err := w.Write([]byte(http.StatusText(statusCode))); err != nil {
		logger.Warn("failed to write response body", "renderer", "plain", "err", err)
	}
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
