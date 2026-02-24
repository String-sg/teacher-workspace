package handler

import (
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
)

type Handler struct {
	cfg    *config.Config
	client *http.Client
}

// Register attaches all application routes to the provided ServeMux.
func Register(mux *http.ServeMux, cfg *config.Config, client *http.Client, frontend *Frontend) {
	routes := &Handler{cfg: cfg, client: client}

	mux.HandleFunc("POST /otp/request", routes.RequestOTP)
	mux.HandleFunc("POST /otp/verify", routes.VerifyOTP)

	if cfg.Environment == config.EnvironmentDevelopment {
		mux.HandleFunc("GET /{$}", frontend.Index) // note: only necessary for injected preloaded data, can consider to remove for now
		mux.Handle("/", frontend.proxy)
	} else {
		mux.HandleFunc("GET /", frontend.Index)
		mux.Handle("GET /assets/", frontend.assetsHandler)
	}
}
