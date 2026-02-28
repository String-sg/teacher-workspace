package handler

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/session"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func cookieByName(cookies []*http.Cookie, name string) (*http.Cookie, bool) {
	for _, c := range cookies {
		if c.Name == name {
			return c, true
		}
	}
	return nil, false
}

func TestHandler_Index(t *testing.T) {
	t.Run("returns 200 and sets session cookie with configured secure attribute", func(t *testing.T) {
		tests := []struct {
			name       string
			cfg        *config.Config
			wantSecure bool
		}{
			{
				name:       "secure attribute disabled",
				cfg:        &config.Config{HTTPS: false},
				wantSecure: false,
			},
			{
				name:       "secure attribute enabled",
				cfg:        &config.Config{HTTPS: true},
				wantSecure: true,
			},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				h := New(tt.cfg, nil)

				req := httptest.NewRequest(http.MethodGet, "/", nil)
				req = req.WithContext(middleware.WithLogger(req.Context(), slog.New(slog.NewTextHandler(io.Discard, nil))))
				req = req.WithContext(middleware.WithSession(req.Context(), &session.Session{ID: "123"}))
				rec := httptest.NewRecorder()

				h.Index(rec, req)

				res := rec.Result()
				require.Equal(t, http.StatusOK, res.StatusCode)
				require.Equal(t, "Hello, World!", rec.Body.String())

				sessionCookie, ok := cookieByName(res.Cookies(), config.SessionCookieName)
				require.True(t, ok)
				require.Equal(t, "123", sessionCookie.Value)
				require.Equal(t, "/", sessionCookie.Path)
				require.Equal(t, tt.wantSecure, sessionCookie.Secure)
				require.True(t, sessionCookie.HttpOnly)
				require.True(t, sessionCookie.SameSite == http.SameSiteLaxMode)
			})
		}
	})

	t.Run("returns 500 when session is unavailable", func(t *testing.T) {
		h := New(&config.Config{}, nil)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req = req.WithContext(middleware.WithLogger(req.Context(), slog.New(slog.NewTextHandler(io.Discard, nil))))
		rec := httptest.NewRecorder()

		h.Index(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusInternalServerError, res.StatusCode)
		require.Equal(t, http.StatusText(http.StatusInternalServerError), rec.Body.String())

		_, ok := cookieByName(res.Cookies(), config.SessionCookieName)
		require.False(t, ok)
	})
}
