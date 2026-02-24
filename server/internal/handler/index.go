package handler

import (
	"bytes"
	"encoding/json"
	"html/template"
	"io"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

type Frontend struct {
	cfg    *config.Config
	client *http.Client
	// production: built from FrontendBuildDir
	indexTmpl     *template.Template
	assetsHandler http.Handler
	// development: Vite dev server
	proxy   *httputil.ReverseProxy
	viteURL string
}

func NewFrontend(cfg *config.Config, client *http.Client) (*Frontend, error) {
	f := &Frontend{cfg: cfg, client: client}

	if cfg.Environment == config.EnvironmentDevelopment {
		u, err := url.Parse(cfg.Server.ViteDevServerURL)
		if err != nil {
			slog.Error("Failed to parse Vite dev server URL", "err", err)
			return nil, err
		}

		f.viteURL = cfg.Server.ViteDevServerURL
		f.proxy = httputil.NewSingleHostReverseProxy(u)

		return f, nil
	}

	buildDir := cfg.Server.FrontendBuildDir
	indexPath := filepath.Join(buildDir, "index.html")

	html, err := os.ReadFile(indexPath)
	if err != nil {
		slog.Error("Failed to read index.html", "err", err)
		return nil, err
	}

	tmpl, err := template.New("index").Parse(string(html))
	if err != nil {
		slog.Error("Failed to parse index.html", "err", err)
		return nil, err
	}

	f.indexTmpl = tmpl
	f.assetsHandler = http.StripPrefix("/assets/", http.FileServer(http.Dir(filepath.Join(buildDir, "assets"))))

	return f, nil
}

func (f *Frontend) Index(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	b, err := json.Marshal(struct{}{})
	if err != nil {
		logger.Error("Failed to marshal request body", "err", err)
		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	preloadedData := template.JS(b)

	if r.Method != http.MethodGet {
		writeClientErrorResponse(w, logger, http.StatusMethodNotAllowed, ErrorCodeMethodNotAllowed, "Method not allowed")
		return
	}

	var html string
	if f.cfg.Environment == config.EnvironmentDevelopment {
		req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, f.viteURL+"/", nil)
		if err != nil {
			logger.Error("Failed to build request for Vite", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		resp, err := f.client.Do(req)
		if err != nil {
			logger.Error("Failed to fetch index from Vite", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		defer func() {
			if err := resp.Body.Close(); err != nil {
				logger.Error("Failed to close response body", "err", err)
			}
		}()

		if resp.StatusCode != http.StatusOK {
			logger.Warn("Vite returned non-OK for index", "status", resp.StatusCode)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Error("Failed to read Vite index body", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		tmpl, err := template.New("index").Parse(string(body))
		if err != nil {
			logger.Error("Failed to parse Vite index as template", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		var buf bytes.Buffer
		if err := tmpl.Execute(&buf, preloadedData); err != nil {
			logger.Error("Failed to execute index template", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		html = buf.String()
	} else {
		var buf bytes.Buffer
		if err := f.indexTmpl.Execute(&buf, preloadedData); err != nil {
			logger.Error("Failed to execute index template", "err", err)
			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		html = buf.String()
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)

	if _, err := w.Write([]byte(html)); err != nil {
		logger.Warn("Failed to write index response", "err", err)
	}
}
