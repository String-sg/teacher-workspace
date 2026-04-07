# PG Real Proxy Handler — Implementation Plan

**Date:** 2026-04-07
**Branch:** feat/pg-proxy
**Goal:** Build the real HTTP reverse proxy in `server/internal/pg/proxy.go` that forwards
requests to pgw-web with a `X-TW-Staff-ID` identity header. Flip `TW_PG_MOCK=false` to
activate. Also produce the PG team contract doc.

---

## Task 1: Add identity stub — server/internal/pg/identity.go

Define `StaffIDFromContext`. Today returns a hardcoded stub (1013). When TW auth lands,
swap the implementation — proxy code stays unchanged.

```go
package pg

import "context"

type contextKey struct{}

// StaffIDFromContext returns the authenticated staff ID from the request context.
// Returns (0, false) if no identity is present.
func StaffIDFromContext(ctx context.Context) (int, bool) {
    id, ok := ctx.Value(contextKey{}).(int)
    return id, ok
}

// WithStaffID returns a new context carrying the given staff ID.
// Called by TW auth middleware once session is validated.
func WithStaffID(ctx context.Context, staffID int) context.Context {
    return context.WithValue(ctx, contextKey{}, staffID)
}
```

**Commit:** `feat(server/pg): add staff identity context helpers`

---

## Task 2: Build real proxy — server/internal/pg/proxy.go

```go
package pg

import (
    "fmt"
    "log/slog"
    "net/http"
    "net/http/httputil"
    "net/url"
    "time"
)

func (h *Handler) registerProxy(mux *http.ServeMux) {
    target, _ := url.Parse(h.cfg.BaseURL)
    proxy := &httputil.ReverseProxy{
        Director:     h.director(target),
        ErrorHandler: h.proxyErrorHandler,
        Transport: &http.Transport{
            ResponseHeaderTimeout: time.Duration(h.cfg.TimeoutMS) * time.Millisecond,
        },
    }
    // Register all routes — same set as mock
    routes := []string{
        "GET /api/web/2/staff/session/current",
        "GET /api/configs",
        "GET /api/web/2/staff/announcements",
        "GET /api/web/2/staff/announcements/shared",
        "GET /api/web/2/staff/announcements/{postId}",
        "POST /api/web/2/staff/announcements",
        "DELETE /api/web/2/staff/announcements/{postId}",
        "GET /api/web/2/staff/consentForms",
        "GET /api/web/2/staff/consentForms/shared",
        "GET /api/web/2/staff/consentForms/{consentFormId}",
        "POST /api/web/2/staff/consentForms",
        "DELETE /api/web/2/staff/consentForms/{consentFormId}",
        "GET /api/web/2/staff/ptm",
        "GET /api/web/2/staff/ptm/{eventId}",
        "POST /api/web/2/staff/ptm",
        "DELETE /api/web/2/staff/ptm/{eventId}",
        "GET /api/web/2/staff/ptm/timeslots/{eventId}",
        "GET /api/web/2/staff/groups/assigned",
        "GET /api/web/2/staff/groups/custom",
        "GET /api/web/2/staff/groups/custom/{customGroupId}",
        "POST /api/web/2/staff/groups/custom",
        "PUT /api/web/2/staff/groups/custom/{customGroupId}",
        "DELETE /api/web/2/staff/groups/custom/{customGroupId}",
        "GET /api/web/2/staff/school/staff",
        "GET /api/web/2/staff/school/students",
        "GET /api/web/2/staff/school/groups",
        "GET /api/web/2/staff/users/me",
        "GET /api/web/2/staff/notificationPreference",
        "PUT /api/web/2/staff/notificationPreference",
    }
    for _, pattern := range routes {
        mux.Handle(pattern, proxy)
    }
}

func (h *Handler) director(target *url.URL) func(*http.Request) {
    return func(r *http.Request) {
        r.URL.Scheme = target.Scheme
        r.URL.Host = target.Host
        r.Host = target.Host

        // Attach staff identity header
        r.Header.Del("X-TW-Staff-ID")
        if staffID, ok := StaffIDFromContext(r.Context()); ok {
            r.Header.Set("X-TW-Staff-ID", fmt.Sprintf("%d", staffID))
        }

        // Remove forwarded headers that could leak internal info
        r.Header.Del("X-Forwarded-For")
    }
}

func (h *Handler) proxyErrorHandler(w http.ResponseWriter, r *http.Request, err error) {
    slog.Error("pg proxy upstream error", "path", r.URL.Path, "err", err)
    w.Header().Set("Content-Type", "application/json; charset=UTF-8")
    w.WriteHeader(http.StatusBadGateway)
    _, _ = w.Write([]byte(`{"error":"pg_unavailable","message":"Parents Gateway is temporarily unavailable"}`))
}
```

**Commit:** `feat(server/pg): add real reverse proxy handler`

---

## Task 3: Add TimeoutMS to PGConfig

**File:** `server/internal/config/config.go`

Add `TimeoutMS int` field to `PGConfig` with `dotenv:"TW_PG_TIMEOUT_MS"` tag.
Default: `10000`.

Update `.env.example` with `# TW_PG_TIMEOUT_MS=10000`.

**Commit:** `feat(server): add TW_PG_TIMEOUT_MS to PG config`

---

## Task 4: Wire registerProxy in handler.go

**File:** `server/internal/pg/handler.go`

Replace the `// Phase 2: real proxy routes go here` comment:

```go
func (h *Handler) Register(mux *http.ServeMux) {
    if h.cfg.Mock {
        h.registerMock(mux)
        return
    }
    h.registerProxy(mux)
}
```

**Commit:** included in Task 2 commit.

---

## Task 5: Write PG team contract doc

**File:** `plans/PG-PROXY-CONTRACT.md`

Document the exact three changes pgw-web needs. Short, direct, copy-pasteable into email.

**Commit:** `docs: add PG team proxy contract requirements`

---

## Task 6: Verify

```bash
go build ./...
go test ./...
```
