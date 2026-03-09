package main

import (
	"net/http"
)

type Handler struct {
	cfg    *Config
	client *http.Client
}

func Register(mux *http.ServeMux, cfg *Config, client *http.Client) {
	routes := &Handler{cfg: cfg, client: client}

	mux.HandleFunc("POST /request", routes.Request)
	mux.HandleFunc("POST /verify/{flow_id}", routes.Verify)
}
