package routes

import (
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

func (handler *Handler) Index(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("Hello, World!")); err != nil {
		logger.Warn("failed to write response", "err", err)
	}
}
