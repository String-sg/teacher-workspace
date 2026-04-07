package pg

import (
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
)

// Handler handles all /api/web/2/staff/* routes.
type Handler struct {
	cfg *config.PGConfig
}

// New creates a new PG handler.
func New(cfg *config.PGConfig) *Handler {
	return &Handler{cfg: cfg}
}

// Register attaches PG routes to the provided ServeMux.
func (h *Handler) Register(mux *http.ServeMux) {
	if h.cfg.Mock {
		h.registerMock(mux)
		return
	}
	h.registerProxy(mux)
}
