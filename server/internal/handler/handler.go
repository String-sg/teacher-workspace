package handler

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"path/filepath"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/htmlutil"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/pg"
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
	cfg      *config.Config
	executor htmlutil.TemplateExecutor

	client *http.Client

	proxy  *httputil.ReverseProxy
	assets http.Handler
}

func New(cfg *config.Config) (*Handler, error) {
	h := &Handler{
		cfg:    cfg,
		client: &http.Client{Timeout: cfg.OTPaaS.Timeout},
	}

	switch cfg.Environment {
	case config.EnvironmentDevelopment:
		h.executor = htmlutil.NewDevelopmentTemplateExecutor(cfg.ViteDevServerURL.String())
		h.proxy = httputil.NewSingleHostReverseProxy(cfg.ViteDevServerURL)
	case config.EnvironmentProduction:
		executor, err := htmlutil.NewProductionTemplateExecutor(filepath.Join(cfg.BundleDirectory, "index.html"))
		if err != nil {
			return nil, fmt.Errorf("create production template executor: %w", err)
		}

		h.executor = executor
		h.assets = http.StripPrefix("/assets/", http.FileServer(http.Dir(filepath.Join(cfg.BundleDirectory, "assets"))))
	}

	return h, nil
}

// Register attaches all application routes to the provided ServeMux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /otp/request", h.RequestOTP)
	mux.HandleFunc("POST /otp/verify", h.VerifyOTP)

	pg.New(&h.cfg.PG).Register(mux)

	mux.HandleFunc("GET /", h.Index)
}

func (h *Handler) renderHTML(r *http.Request, w http.ResponseWriter, data any) {
	logger := middleware.LoggerFromContext(r.Context())

	w.Header().Set(HeaderContentType, MIMETextHTMLCharsetUTF8)
	w.Header().Set(HeaderXContentTypeOptions, "nosniff")

	w.WriteHeader(http.StatusOK)

	if err := h.executor.Execute(r.Context(), w, data); err != nil {
		logger.Warn("failed to execute template", "renderer", "html", "err", err)
	}
}
