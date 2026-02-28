package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/session"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestSession(t *testing.T) {
	t.Run("creates a new session when no cookie is sent", func(t *testing.T) {
		store := session.NewInMemoryStore()
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		var gotSess *session.Session
		var gotOK bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotSess, gotOK = SessionFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()

		require.Equal(t, http.StatusOK, res.StatusCode)
		require.True(t, gotOK)
		require.True(t, gotSess != nil)
		require.NotEqual(t, "", gotSess.ID)
	})

	t.Run("restores session when ID from cookie is in store", func(t *testing.T) {
		store := session.NewInMemoryStore()
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		sess := &session.Session{
			ID: "123",
		}
		err := store.Commit(t.Context(), sess, 30*time.Minute)

		require.NoError(t, err)

		var gotSess *session.Session
		var gotOK bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotSess, gotOK = SessionFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.AddCookie(&http.Cookie{Name: "tw.session", Value: "123"})
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()

		require.Equal(t, http.StatusOK, res.StatusCode)
		require.True(t, gotOK)
		require.True(t, gotSess != nil)
		require.Equal(t, "123", gotSess.ID)
	})

	t.Run("creates a new session when ID from cookie is not in store", func(t *testing.T) {
		store := session.NewInMemoryStore()
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		var gotSess *session.Session
		var gotOK bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotSess, gotOK = SessionFromContext(r.Context())
			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.AddCookie(&http.Cookie{Name: "tw.session", Value: "nonexistent"})
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()

		require.Equal(t, http.StatusOK, res.StatusCode)
		require.True(t, gotOK)
		require.True(t, gotSess != nil)
		require.NotEqual(t, "", gotSess.ID)
		require.NotEqual(t, "nonexistent", gotSess.ID)
	})

	t.Run("commits with default TTL when current user is not set", func(t *testing.T) {
		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := session.NewInMemoryStoreWithNow(func() time.Time { return now })
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		var gotID string
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess, _ := SessionFromContext(r.Context())
			gotID = sess.ID

			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)

		now = now.Add(cfg.DefaultSessionTTL)
		sess, err := store.Prepare(t.Context(), gotID)

		require.NoError(t, err)
		require.NotEqual(t, gotID, sess.ID)
	})

	t.Run("commits with authenticated TTL when current user is set", func(t *testing.T) {
		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := session.NewInMemoryStoreWithNow(func() time.Time { return now })
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		var gotID string
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess, _ := SessionFromContext(r.Context())
			sess.CurrentUser = &session.CurrentUser{
				ID:    "xyz",
				Email: "xyz@example.com",
			}
			gotID = sess.ID

			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusOK, res.StatusCode)

		now = now.Add(cfg.AuthenticatedSessionTTL)
		sess, err := store.Prepare(t.Context(), gotID)

		require.NoError(t, err)
		require.NotEqual(t, gotID, sess.ID)
	})

	t.Run("returns 500 when context is cancelled", func(t *testing.T) {
		store := session.NewInMemoryStore()
		cfg := &config.Config{
			DefaultSessionTTL:       30 * time.Minute,
			AuthenticatedSessionTTL: 3 * time.Hour,
		}

		called := false
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			w.WriteHeader(http.StatusOK)
		})

		h := Session(store, cfg)(next)

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rec := httptest.NewRecorder()

		h.ServeHTTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusInternalServerError, res.StatusCode)
		require.False(t, called)
	})
}

func TestSessionFromContext(t *testing.T) {
	t.Run("returns empty session and false when not set", func(t *testing.T) {
		sess, ok := SessionFromContext(context.Background())

		require.True(t, sess == nil)
		require.False(t, ok)
	})
}
