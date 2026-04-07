# PG Mock Proxy — Implementation Plan

**Date:** 2026-04-07  
**Branch:** feat/pg-mock-proxy  
**Goal:** Add a mock proxy package (`server/internal/pg`) that serves fixture JSON at `/api/web/2/staff/*` routes, unblocking Reza's FE while the real pgw-web integration is negotiated with the PG team.

**API path choice:** `/api/web/2/staff/*` mirrors the real PG API paths exactly, so when we flip from mock to real proxy, no FE URL changes are needed.

---

## Task 1: Add PGConfig to server config

**Files:**
- Modify: `server/internal/config/config.go`

Add `PGConfig` struct and wire it into `Config`:

```go
type PGConfig struct {
    Mock    bool   `dotenv:"TW_PG_MOCK"`
    BaseURL string `dotenv:"TW_PG_BASE_URL"`
}
```

Add `PG PGConfig \`dotenv:",squash"\`` field to `Config` struct.

Add defaults in `Default()`:
```go
PG: PGConfig{
    Mock:    true,
    BaseURL: "https://pg.moe.edu.sg",
},
```

No validation needed for Phase 1 (mock mode only).

**Commit:** `feat(server): add PGConfig to server config`

---

## Task 2: Create server/internal/pg package

**Files to create:**
- `server/internal/pg/handler.go` — Handler struct, New(), Register()
- `server/internal/pg/mock.go` — mock mode: serves fixture JSON from embedded FS
- `server/internal/pg/fixtures/announcements.json` — announcements list fixture

### handler.go

```go
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
    // Phase 2: real proxy routes go here
}
```

### mock.go

Use `embed` to bundle fixture files into the binary. Serve fixture JSON based on request path.

Route map (path suffix → fixture file):
- `GET /api/web/2/staff/announcements` → `fixtures/announcements.json`

Return 404 for unknown routes.

### fixtures/announcements.json

JSON array matching Reza's `PGAnnouncement[]` type from `web/data/mock-pg-announcements.ts`. Wrap in `{ "items": [...] }` envelope — consistent with how list endpoints typically work.

---

## Task 3: Wire PG handler into main handler

**Files:**
- Modify: `server/internal/handler/handler.go`

In `New()`, instantiate `pg.New(&cfg.PG)` and call `.Register(mux)` inside `Register()`.

---

## Task 4: Update .env.example

Add PG vars to `.env.example`:
```
# PG (Parents Gateway) integration
TW_PG_MOCK=true
# TW_PG_BASE_URL=https://pg.moe.edu.sg
```

---

## Task 5: Verify

```bash
go build ./...
go test ./...
```

Then manually test:
```bash
curl http://localhost:3000/api/web/2/staff/announcements
```

Expected: JSON response with announcements array.

**Commit:** `feat(server): add PG mock proxy serving fixture JSON`
