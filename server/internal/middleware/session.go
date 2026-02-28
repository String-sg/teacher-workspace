package middleware

import (
	"context"
	"net/http"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/session"
)

type ctxKeySession struct{}

// Session is an HTTP middleware that manages user sessions using the provided
// session store. It reads the session ID from the "tw.session" cookie and
// prepares a session for the request context. The session is committed back to
// the store when the response is written.
func Session(store session.Store, cfg *config.Config) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var id string

			cookie, err := r.Cookie("tw.session")
			if err == nil {
				id = cookie.Value
			}

			logger := LoggerFromContext(r.Context())

			sess, err := store.Prepare(r.Context(), id)
			if err != nil {
				logger.Error("failed to prepare session", "err", err)
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				return
			}

			ctx := WithSession(r.Context(), sess)

			next.ServeHTTP(w, r.WithContext(ctx))

			ttl := cfg.DefaultSessionTTL
			if sess.IsAuthenticated() {
				ttl = cfg.AuthenticatedSessionTTL
			}

			if err := store.Commit(r.Context(), sess, ttl); err != nil {
				logger.Error("failed to commit session", "err", err)
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				return
			}
		})
	}
}

// SessionFromContext retrieves the session from the provided context.
// The returned boolean indicates whether a session was present.
func SessionFromContext(ctx context.Context) (*session.Session, bool) {
	sess, ok := ctx.Value(ctxKeySession{}).(*session.Session)
	return sess, ok
}

// WithSession attaches the session to the context.
// Intended for use in [Session] middleware and tests only.
func WithSession(ctx context.Context, sess *session.Session) context.Context {
	return context.WithValue(ctx, ctxKeySession{}, sess)
}
