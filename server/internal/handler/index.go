package handler

import (
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

func (h *Handler) Index(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	sess, ok := middleware.SessionFromContext(r.Context())
	if !ok {
		logger.Error("session not found in context")
		h.renderPlain(r, w, http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     config.SessionCookieName,
		Value:    sess.ID,
		Path:     "/",
		Secure:   h.cfg.HTTPS,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("Hello, World!")); err != nil {
		logger.Warn("failed to write response", "err", err)
	}
}
