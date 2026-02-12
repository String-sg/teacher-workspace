package routes

import (
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
)

type Handler struct {
	cfg    *config.Config
	client *http.Client
}

// Register attaches all application routes to the provided ServeMux.
func Register(mux *http.ServeMux, cfg *config.Config) {
	routes := &Handler{cfg: cfg, client: &http.Client{Timeout: cfg.Client.Timeout}}

	mux.HandleFunc("/", routes.Index)
	mux.HandleFunc("POST /api/otp/request", routes.RequestOTP)
	mux.HandleFunc("POST /api/otp/verify", routes.VerifyOTP)
}
