# PG Proxy Server — Implementation Spec

**Purpose:** Complete, agent-ready spec to build the PG proxy module inside the TW Go server. Read this alongside `PG-API-CONTRACT.md` (endpoint/shape reference) and `PG-INTEGRATION-APPROACH.md` (architecture overview).

**Source:** Derived from pgw-web codebase analysis + TW server patterns from VIBECODE.md.

---

## 1. Critical Discovery: PG Cookie Names

These were extracted directly from the pgw-web source. Do not guess — use exactly these.

| Cookie | Name | Notes |
|---|---|---|
| School staff session | `session` | Signed cookie-session; sends both `session` and `session.sig` |
| School staff session signature | `session.sig` | Required alongside `session` |
| CSRF token cookie | `csrf` | Set on every GET response, max age 30 min |
| CSRF request header | `xsrf-token` | Lowercase. PG reads `req.headers['xsrf-token']` |

**Session max age:** 1,800,000 ms = 30 minutes.

**Non-production bypass:** In non-prod PG environments, `xsrf-token: csrfbypass` header skips CSRF validation. Useful for dev proxy testing.

---

## 2. PG Error Response Shapes

PG returns different error shapes depending on the error type. TW BFF must detect and handle these.

### Auth failure (session expired / not authenticated)

PG returns **302 redirect** to login page — NOT a 401 JSON response. TW BFF must detect this:

```
HTTP/1.1 302 Found
Location: /api/web/v2/staff/session/login
```

TW BFF should treat any 3xx redirect from pgw-web as an auth failure and trigger PG session re-establishment.

### CSRF failure

```json
HTTP 401
{
  "resultCode": "CSRF_TOKEN_ERROR",
  "error": {
    "errorId": "uuid-v1",
    "message": "..."
  }
}
```

### General API error

```json
{
  "resultCode": "FAILURE",
  "error": {
    "errorId": "uuid-v1",
    "message": "error description"
  }
}
```

### Validation error

```json
{
  "resultCode": "INVALID_FORM",
  "error": {
    "errorId": "uuid-v1",
    "message": "One or more input has an error"
  }
}
```

---

## 3. Go Module Structure

All new files go under `server/internal/pg/`. Follows the same patterns as `server/internal/handler/`.

```
server/internal/pg/
  config.go          — PGConfig struct, dotenv tags, Validate()
  proxy.go           — core reverse proxy: attach cookies, forward, capture Set-Cookie
  session.go         — MIMS artifact → PG session exchange; Valkey storage interface
  csrf.go            — CSRF token capture from GET responses; inject on mutations
  mock.go            — fixture file server (dev/test only)
  routes.go          — Register(mux, cfg, sessionStore) — wires all /teachers/* routes
  fixtures/          — JSON fixture files (one per endpoint)
    session_current.json
    configs.json
    announcements_list.json
    announcement_detail.json
    announcement_read_status.json
    consent_forms_list.json
    consent_form_detail.json
    ptm_list.json
    ptm_detail.json
    ptm_timeslots.json
    ptm_bookings.json
    groups_assigned.json
    groups_custom_list.json
    groups_custom_detail.json
    school_staff.json
    school_students.json
    school_groups.json
    notification_preferences.json
    user_me.json
```

---

## 4. Config Additions

Add `PGConfig` to `server/internal/config/config.go` following existing patterns.

### New struct

```go
type PGConfig struct {
    BaseURL         string        `dotenv:"TW_PG_BASE_URL"`
    Mock            bool          `dotenv:"TW_PG_MOCK"`
    MIMSCallbackPath string       `dotenv:"TW_PG_MIMS_CALLBACK_PATH"`
    SessionCookieName string      `dotenv:"TW_PG_SESSION_COOKIE_NAME"`
    CSRFCookieName  string        `dotenv:"TW_PG_CSRF_COOKIE_NAME"`
    CSRFHeaderName  string        `dotenv:"TW_PG_CSRF_HEADER_NAME"`
    Timeout         time.Duration `dotenv:"TW_PG_TIMEOUT"`
}
```

### Default values

```go
PG: PGConfig{
    BaseURL:          "https://pg.moe.edu.sg",
    Mock:             true,
    MIMSCallbackPath: "/api/web/v2/staff/identity/login/MIMScallback",
    SessionCookieName: "session",
    CSRFCookieName:   "csrf",
    CSRFHeaderName:   "xsrf-token",
    Timeout:          10 * time.Second,
},
```

### Validate additions

```go
func (c PGConfig) validate() error {
    var errs []error
    if !c.Mock && c.BaseURL == "" {
        errs = append(errs, errors.New("TW_PG_BASE_URL is required when TW_PG_MOCK=false"))
    }
    return errors.Join(errs...)
}
```

### Env var reference

| Var | Type | Default | Required |
|---|---|---|---|
| `TW_PG_BASE_URL` | string | `https://pg.moe.edu.sg` | Only when mock=false |
| `TW_PG_MOCK` | bool | `true` | No |
| `TW_PG_MIMS_CALLBACK_PATH` | string | `/api/web/v2/staff/identity/login/MIMScallback` | No |
| `TW_PG_SESSION_COOKIE_NAME` | string | `session` | No |
| `TW_PG_CSRF_COOKIE_NAME` | string | `csrf` | No |
| `TW_PG_CSRF_HEADER_NAME` | string | `xsrf-token` | No |
| `TW_PG_TIMEOUT` | duration | `10s` | No |

---

## 5. Session Store Interface

TW BFF needs to store per-user PG state (session cookies, CSRF token). Define this interface so it can be backed by Valkey in prod and an in-memory map in tests.

```go
// PGSessionData holds the PG-side auth state for a single TW user session.
type PGSessionData struct {
    SessionCookie    string    // value of PG `session` cookie
    SessionSigCookie string    // value of PG `session.sig` cookie
    CSRFToken        string    // value of PG `csrf` cookie (= xsrf-token header value)
    EstablishedAt    time.Time
}

// SessionStore persists per-TW-session PG auth state.
type SessionStore interface {
    Get(ctx context.Context, twSessionID string) (*PGSessionData, error)
    Set(ctx context.Context, twSessionID string, data *PGSessionData, ttl time.Duration) error
    Delete(ctx context.Context, twSessionID string) error
}
```

---

## 6. proxy.go — Core Proxy Logic

### Function signature

```go
// Proxy forwards an authenticated HTTP request to pgw-web, injecting
// the stored PG session cookies and (for mutations) the CSRF token.
// It captures any Set-Cookie headers from PG and updates the session store.
func Proxy(
    w http.ResponseWriter,
    r *http.Request,
    cfg *config.PGConfig,
    store SessionStore,
    twSessionID string,
    pgPath string,          // PG-side path, e.g. "/api/web/2/staff/announcements"
    client *http.Client,
) error
```

### Behaviour

1. Retrieve `PGSessionData` from store using `twSessionID`
2. If not found → return `ErrNoPGSession` (caller triggers re-auth)
3. Build upstream request:
   - URL: `cfg.BaseURL + pgPath + querystring`
   - Method + body: copy from incoming request
   - Headers to forward: `Content-Type`, `Accept`, `X-Request-ID`
   - Cookie header: `session=<value>; session.sig=<sigValue>; csrf=<csrfValue>`
   - For POST/PUT/DELETE: add header `xsrf-token: <csrfToken>`
4. Execute with `client.Do(req)` with `cfg.Timeout` context
5. Detect auth failure:
   - If response is 3xx → return `ErrPGAuthExpired` (caller re-establishes session)
   - If response body contains `"resultCode":"CSRF_TOKEN_ERROR"` → return `ErrPGCSRFExpired`
6. Capture response cookies:
   - If response sets new `csrf` cookie → update stored `CSRFToken`
   - If response sets new `session` + `session.sig` → update stored session cookies
7. Write response back to `w`:
   - Status code
   - `Content-Type` header
   - Body (streamed, not buffered)
   - **Do NOT** forward `Set-Cookie` headers to browser (PG cookies are server-side only)

### Error types

```go
var (
    ErrNoPGSession   = errors.New("pg: no session found for TW session")
    ErrPGAuthExpired = errors.New("pg: session expired (redirect received)")
    ErrPGCSRFExpired = errors.New("pg: csrf token rejected")
    ErrPGTimeout     = errors.New("pg: upstream request timed out")
)
```

---

## 7. session.go — MIMS → PG Session Exchange

### Function signature

```go
// EstablishPGSession calls PG's MIMS callback endpoint using the MIMS
// artifact, captures the resulting PG session cookies, and persists them
// in the session store for the given TW session ID.
func EstablishPGSession(
    ctx context.Context,
    cfg *config.PGConfig,
    store SessionStore,
    twSessionID string,
    mimsArtifact string,    // the raw MIMS artifact/token from the SSO redirect
    client *http.Client,
) error
```

### Behaviour

1. Build GET request to `cfg.BaseURL + cfg.MIMSCallbackPath + "?artifact=" + mimsArtifact`
2. Execute (no cookies on this request — it's the initial exchange)
3. If response is not 2xx or 3xx-to-app (not redirect-to-login) → return error
4. Parse `Set-Cookie` headers from response:
   - Look for cookie named `cfg.SessionCookieName` (`session`) → store as `SessionCookie`
   - Look for cookie named `cfg.SessionCookieName + ".sig"` (`session.sig`) → store as `SessionSigCookie`
   - Look for cookie named `cfg.CSRFCookieName` (`csrf`) → store as `CSRFToken`
5. Persist to store with TTL = 25 min (slightly under PG's 30 min max age)
6. Return nil if all three cookies captured, otherwise return descriptive error

### Note on MIMS single-use artifacts

If MIMS artifacts are single-use, TW must establish the PG session BEFORE establishing the TW session during the login callback. Both use the same artifact — process PG first (step 5 above), store cookies, then proceed with TW's own session creation. The order in the login handler matters.

---

## 8. csrf.go — CSRF Token Management

CSRF tokens are refreshed by PG on every request (both GET and mutation). The proxy must always update the stored token from the latest `csrf` Set-Cookie response header.

This is handled inside `proxy.go` step 6 — no separate handler needed. `csrf.go` exports just the helper:

```go
// ExtractCookieValue parses a raw Set-Cookie header slice and returns the
// value of the cookie with the given name, or ("", false) if not found.
func ExtractCookieValue(setCookieHeaders []string, name string) (string, bool)
```

---

## 9. mock.go — Fixture Server

When `cfg.Mock == true`, routes return fixture JSON instead of proxying.

### Function signature

```go
// MockHandler returns an http.HandlerFunc that serves fixture JSON for
// the given fixture filename. File is read from the embedded fixtures FS.
func MockHandler(fixtureName string) http.HandlerFunc
```

### Fixture embedding

Use Go's `embed` package:

```go
//go:embed fixtures/*
var fixtures embed.FS
```

### Behaviour

`MockHandler("announcements_list.json")` returns a handler that:
1. Reads `fixtures/announcements_list.json` from the embedded FS
2. Sets `Content-Type: application/json`
3. Writes `200 OK` + file contents

For POST/PUT/DELETE mocks: return `200 OK` with a minimal success body. E.g.:

```go
func MockWriteHandler(responseBody string) http.HandlerFunc
```

---

## 10. routes.go — Route Registration

### Function signature

```go
// Register wires all /teachers/* proxy routes onto the provided mux.
// If cfg.Mock is true, routes serve fixture JSON. Otherwise they proxy to pgw-web.
func Register(mux *http.ServeMux, cfg *config.PGConfig, store SessionStore, client *http.Client)
```

### How it fits into main server

In `server/internal/handler/handler.go`, add PG registration:

```go
func Register(mux *http.ServeMux, cfg *config.Config, client *http.Client) {
    routes := &Handler{cfg: cfg, client: client}

    // existing routes
    mux.HandleFunc("/", routes.Index)
    mux.HandleFunc("POST /otp/request", routes.RequestOTP)
    mux.HandleFunc("POST /otp/verify", routes.VerifyOTP)

    // PG proxy routes
    pgStore := pg.NewMemoryStore() // swap with Valkey store in prod
    pg.Register(mux, &cfg.PG, pgStore, client)
}
```

### Route table

Each route maps a TW-facing path to a pgw-web path. Follows RFC-028 convention: strip `/teachers` prefix.

**Convention for JSON routes:** TW frontend calls `GET /teachers/<resource>.json` for client-side nav data. TW BFF route pattern: `GET /teachers/{resource...}` — strip `/teachers` prefix, optionally add `.json` handling if needed (can also just use the clean path).

#### Read routes (GET)

```go
// Session & config
mux.HandleFunc("GET /teachers/session/current",    pgProxy("/api/web/2/staff/session/current",    "session_current.json"))
mux.HandleFunc("GET /teachers/configs",             pgProxy("/api/configs",                        "configs.json"))

// Announcements
mux.HandleFunc("GET /teachers/announcements",                          pgProxy("/api/web/2/staff/announcements",                        "announcements_list.json"))
mux.HandleFunc("GET /teachers/announcements/shared",                   pgProxy("/api/web/2/staff/announcements/shared",                  "announcements_list.json"))
mux.HandleFunc("GET /teachers/announcements/{postId}",                 pgProxy("/api/web/2/staff/announcements/{postId}",               "announcement_detail.json"))
mux.HandleFunc("GET /teachers/announcements/{postId}/readStatus",      pgProxy("/api/web/2/staff/announcements/{postId}/readStatus",    "announcement_read_status.json"))
mux.HandleFunc("GET /teachers/announcements/drafts/{draftId}",         pgProxy("/api/web/2/staff/announcements/drafts/{draftId}",       "announcement_detail.json"))
mux.HandleFunc("GET /teachers/announcements/prefilled/{prefilledId}",  pgProxy("/api/web/2/staff/announcements/prefilled/{prefilledId}","announcement_detail.json"))

// Consent Forms
mux.HandleFunc("GET /teachers/consentForms",                           pgProxy("/api/web/2/staff/consentForms",                        "consent_forms_list.json"))
mux.HandleFunc("GET /teachers/consentForms/shared",                    pgProxy("/api/web/2/staff/consentForms/shared",                  "consent_forms_list.json"))
mux.HandleFunc("GET /teachers/consentForms/{id}",                      pgProxy("/api/web/2/staff/consentForms/{id}",                   "consent_form_detail.json"))
mux.HandleFunc("GET /teachers/consentForms/drafts/{draftId}",          pgProxy("/api/web/2/staff/consentForms/drafts/{draftId}",       "consent_form_detail.json"))

// PTM
mux.HandleFunc("GET /teachers/meetings",                               pgProxy("/api/web/2/staff/ptm",                                 "ptm_list.json"))
mux.HandleFunc("GET /teachers/meetings/{eventId}",                     pgProxy("/api/web/2/staff/ptm/{eventId}",                      "ptm_detail.json"))
mux.HandleFunc("GET /teachers/meetings/{eventId}/timeslots",           pgProxy("/api/web/2/staff/ptm/timeslots/{eventId}",             "ptm_timeslots.json"))
mux.HandleFunc("GET /teachers/meetings/{eventId}/bookings",            pgProxy("/api/web/2/staff/ptm/bookings/{eventId}",             "ptm_bookings.json"))
mux.HandleFunc("GET /teachers/meetings/serverdatetime",                pgProxy("/api/web/2/staff/ptm/serverdatetime",                  ""))

// Groups
mux.HandleFunc("GET /teachers/groups/assigned",                        pgProxy("/api/web/2/staff/groups/assigned",                    "groups_assigned.json"))
mux.HandleFunc("GET /teachers/groups/custom",                          pgProxy("/api/web/2/staff/groups/custom",                      "groups_custom_list.json"))
mux.HandleFunc("GET /teachers/groups/custom/{id}",                     pgProxy("/api/web/2/staff/groups/custom/{id}",                 "groups_custom_detail.json"))

// School data
mux.HandleFunc("GET /teachers/school/staff",                           pgProxy("/api/web/2/staff/school/staff",                       "school_staff.json"))
mux.HandleFunc("GET /teachers/school/students",                        pgProxy("/api/web/2/staff/school/students",                    "school_students.json"))
mux.HandleFunc("GET /teachers/school/groups",                          pgProxy("/api/web/2/staff/school/groups",                      "school_groups.json"))

// Account
mux.HandleFunc("GET /teachers/me",                                     pgProxy("/api/web/2/staff/users/me",                           "user_me.json"))
mux.HandleFunc("GET /teachers/notification-preferences",               pgProxy("/api/web/2/staff/notificationPreference",             "notification_preferences.json"))
```

#### Write routes (POST/PUT/DELETE)

In mock mode these return minimal success JSON. In proxy mode they forward with CSRF injection.

```go
// Announcements write
mux.HandleFunc("POST   /teachers/announcements",                              pgWriteProxy("/api/web/2/staff/announcements"))
mux.HandleFunc("POST   /teachers/announcements/drafts",                       pgWriteProxy("/api/web/2/staff/announcements/drafts"))
mux.HandleFunc("PUT    /teachers/announcements/drafts/{draftId}",             pgWriteProxy("/api/web/2/staff/announcements/drafts/{draftId}"))
mux.HandleFunc("POST   /teachers/announcements/drafts/schedule",              pgWriteProxy("/api/web/2/staff/announcements/drafts/schedule"))
mux.HandleFunc("POST   /teachers/announcements/duplicate",                    pgWriteProxy("/api/web/2/staff/announcements/duplicate"))
mux.HandleFunc("DELETE /teachers/announcements/{postId}",                     pgWriteProxy("/api/web/2/staff/announcements/{postId}"))
mux.HandleFunc("DELETE /teachers/announcements/drafts/{draftId}",             pgWriteProxy("/api/web/2/staff/announcements/drafts/{draftId}"))

// Consent forms write
mux.HandleFunc("POST   /teachers/consentForms",                               pgWriteProxy("/api/web/2/staff/consentForms"))
mux.HandleFunc("POST   /teachers/consentForms/drafts",                        pgWriteProxy("/api/web/2/staff/consentForms/drafts"))
mux.HandleFunc("PUT    /teachers/consentForms/drafts/{draftId}",              pgWriteProxy("/api/web/2/staff/consentForms/drafts/{draftId}"))
mux.HandleFunc("POST   /teachers/consentForms/drafts/schedule",               pgWriteProxy("/api/web/2/staff/consentForms/drafts/schedule"))
mux.HandleFunc("POST   /teachers/consentForms/duplicate",                     pgWriteProxy("/api/web/2/staff/consentForms/duplicate"))
mux.HandleFunc("DELETE /teachers/consentForms/{id}",                          pgWriteProxy("/api/web/2/staff/consentForms/{id}"))
mux.HandleFunc("DELETE /teachers/consentForms/drafts/{draftId}",              pgWriteProxy("/api/web/2/staff/consentForms/drafts/{draftId}"))
mux.HandleFunc("PUT    /teachers/consentForms/{id}/updateDueDate",            pgWriteProxy("/api/web/2/staff/consentForms/{id}/updateDueDate"))

// PTM write
mux.HandleFunc("POST   /teachers/meetings",                                   pgWriteProxy("/api/web/2/staff/ptm"))
mux.HandleFunc("DELETE /teachers/meetings/{eventId}",                         pgWriteProxy("/api/web/2/staff/ptm/{eventId}"))
mux.HandleFunc("POST   /teachers/meetings/booking/block",                     pgWriteProxy("/api/web/2/staff/ptm/booking/block"))
mux.HandleFunc("POST   /teachers/meetings/booking/unblock",                   pgWriteProxy("/api/web/2/staff/ptm/booking/unblock"))
mux.HandleFunc("POST   /teachers/meetings/booking/add",                       pgWriteProxy("/api/web/2/staff/ptm/booking/add"))
mux.HandleFunc("POST   /teachers/meetings/booking/change",                    pgWriteProxy("/api/web/2/staff/ptm/booking/change"))
mux.HandleFunc("POST   /teachers/meetings/booking/remove",                    pgWriteProxy("/api/web/2/staff/ptm/booking/remove"))

// Groups write
mux.HandleFunc("POST   /teachers/groups/custom",                              pgWriteProxy("/api/web/2/staff/groups/custom"))
mux.HandleFunc("PUT    /teachers/groups/custom/{id}",                         pgWriteProxy("/api/web/2/staff/groups/custom/{id}"))
mux.HandleFunc("DELETE /teachers/groups/custom/{id}",                         pgWriteProxy("/api/web/2/staff/groups/custom/{id}"))
mux.HandleFunc("PUT    /teachers/groups/custom/{id}/share",                   pgWriteProxy("/api/web/2/staff/groups/custom/{id}/share"))
mux.HandleFunc("POST   /teachers/groups/student/count",                       pgWriteProxy("/api/web/2/staff/groups/student/count"))

// Account write
mux.HandleFunc("PUT    /teachers/me/displayEmail",                            pgWriteProxy("/api/web/2/staff/{staffId}/updateDisplayEmail"))
mux.HandleFunc("PUT    /teachers/me/displayName",                             pgWriteProxy("/api/web/2/staff/{staffId}/updateDisplayName"))
mux.HandleFunc("PUT    /teachers/notification-preferences",                   pgWriteProxy("/api/web/2/staff/notificationPreference"))
```

### Helper constructors used above

```go
// pgProxy returns a handler for GET routes.
// In mock mode: serves fixtureName from embedded FS.
// In proxy mode: calls Proxy() with pgPath.
func pgProxy(pgPath, fixtureName string) http.HandlerFunc

// pgWriteProxy returns a handler for POST/PUT/DELETE routes.
// In mock mode: returns minimal 200 JSON success response.
// In proxy mode: calls Proxy() with CSRF injection enabled.
func pgWriteProxy(pgPath string) http.HandlerFunc
```

---

## 11. Request Forwarding Rules

### Headers to ALWAYS forward to PG

```
Content-Type
Accept
X-Request-ID        (from TW middleware.RequestID)
```

### Headers to NEVER forward to PG

```
Host                (set to PG host automatically)
Authorization       (TW internal auth — irrelevant to PG)
Cookie              (replaced entirely with PG session cookies)
```

### Query string handling

Forward all query params verbatim. Critical params per endpoint:

| Endpoint | Key query params |
|---|---|
| `GET /announcements` | `page`, `pageSize`, `search`, `status`, `dateFrom`, `dateTo` |
| `GET /consentForms` | same as above |
| `GET /school/students` | `search`, `level`, `className` |
| `GET /groups/assigned` | `type=summary` |
| `GET /groups/custom` | `type=summary` |
| `GET /meetings/{id}/bookings` | `scheduleDate` (ISO string, required) |

### Path parameter substitution

Go 1.22+ `http.ServeMux` supports `{param}` patterns. When calling Proxy(), extract path values and substitute into `pgPath`:

```go
pgPath = strings.ReplaceAll(pgPath, "{postId}", r.PathValue("postId"))
pgPath = strings.ReplaceAll(pgPath, "{id}", r.PathValue("id"))
// etc.
```

---

## 12. Mock Fixture JSON Files

The following are the exact fixture JSON files to create in `server/internal/pg/fixtures/`.

### session_current.json

```json
{
  "staffId": 1013,
  "staffName": "EBI HO BIN BIN",
  "isA": true,
  "staffSchoolId": 1001,
  "staffEmailAdd": "parentsgateway.otp+PGU00391@gmail.com",
  "is2FAAuthorized": false,
  "schoolEmailAddress": "sandwich_pri@moe.edu.sg",
  "schoolName": "SANDWICH PRIMARY SCHOOL",
  "sessionTimeLeft": 1799,
  "displayName": "",
  "displayEmail": "",
  "displayUpdatedBy": "",
  "displayUpdatedAt": "",
  "isAdminUpdated": false,
  "isIhl": false,
  "heyTaliaAccess": true
}
```

### configs.json

```json
{
  "flags": {
    "absence_submission": { "enabled": true },
    "duplicate_announcement_form_post": { "enabled": true },
    "heytalia_chat": { "enabled": true },
    "schedule_announcement_form_post": { "enabled": true }
  },
  "configs": {
    "absence_notification": { "blacklist": [] },
    "two_way_comms": {
      "isTwoWayCommsBetaEnabled": true,
      "twoWayCommsBetaSchoolWhiteList": []
    },
    "web_notification": {
      "enabled": false,
      "endDateTime": "2026-12-31T23:59:59.000Z",
      "message": "",
      "startDateTime": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### announcements_list.json

```json
{
  "posts": [
    {
      "id": "ann_1036",
      "postId": 1036,
      "title": "Term 2 School Camp — Consent Required",
      "date": "2026-03-24T03:12:51.000Z",
      "status": "POSTED",
      "toParentsOf": ["Boxing", "H6-05"],
      "readMetrics": { "readPerStudent": 1, "totalStudents": 2 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN"
    },
    {
      "id": "ann_1035",
      "postId": 1035,
      "title": "Sports Day 2026 — Important Information",
      "date": "2026-03-20T09:00:00.000Z",
      "status": "POSTED",
      "toParentsOf": ["H6-05"],
      "readMetrics": { "readPerStudent": 2, "totalStudents": 2 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN"
    },
    {
      "id": "ann_1034",
      "postId": 1034,
      "title": "Term 3 Newsletter",
      "date": "2026-04-15T08:00:00.000Z",
      "status": "SCHEDULED",
      "toParentsOf": ["H6-05"],
      "readMetrics": { "readPerStudent": 0, "totalStudents": 2 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN"
    },
    {
      "id": "ann_1033",
      "postId": 1033,
      "title": "Draft — End of Year Concert",
      "date": "2026-03-18T14:30:00.000Z",
      "status": "DRAFT",
      "toParentsOf": [],
      "readMetrics": { "readPerStudent": 0, "totalStudents": 0 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN"
    }
  ],
  "total": 4,
  "page": 1,
  "pageSize": 10
}
```

### announcement_detail.json

```json
{
  "announcementId": 1036,
  "title": "Term 2 School Camp — Consent Required",
  "content": null,
  "richTextContent": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Dear Parents,\"}]},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"We are pleased to inform you that the Term 2 School Camp will be held from 10-12 April 2026. Please read the attached information carefully.\"}]},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Venue: Outward Bound Singapore\"}]}]},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Please pack light — refer to the packing list attached\"}]}]}]},{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"For enquiries, please contact your form teacher.\"}]}]}",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:12:51.000Z",
  "postedDate": "2026-03-24T03:12:51.000Z",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "attachments": [
    {
      "attachmentId": 1,
      "fileName": "packing_list.pdf",
      "fileSize": 204800,
      "mimeType": "application/pdf"
    }
  ],
  "images": [],
  "shortcutLink": [],
  "websiteLinks": [],
  "staffOwners": [
    { "staffID": 1013, "staffName": "EBI HO BIN BIN" }
  ],
  "students": [
    { "studentId": 1, "studentName": "TAN XIAO MING", "className": "H6-05", "isRead": true },
    { "studentId": 2, "studentName": "LEE WEI LIANG", "className": "Boxing", "isRead": false }
  ],
  "status": "POSTED",
  "scheduledSendAt": null,
  "scheduledSendFailureCode": null
}
```

### announcement_read_status.json

```json
{
  "readCount": 1,
  "totalCount": 2,
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "isRead": true,
      "readAt": "2026-03-25T08:00:00.000Z"
    },
    {
      "studentId": 2,
      "studentName": "LEE WEI LIANG",
      "className": "Boxing",
      "isRead": false,
      "readAt": null
    }
  ]
}
```

### consent_forms_list.json

```json
{
  "posts": [
    {
      "id": "cf_1038",
      "postId": 1038,
      "title": "Consent Form for Boxing Competition 1 April 2026",
      "date": "2026-03-24T03:08:05.000Z",
      "status": "OPEN",
      "toParentsOf": ["Boxing"],
      "respondedMetrics": { "respondedPerStudent": 1, "totalStudents": 2 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN",
      "consentByDate": "2026-03-30T15:59:59.000Z"
    },
    {
      "id": "cf_1037",
      "postId": 1037,
      "title": "Learning Journey to Science Centre",
      "date": "2026-03-10T09:00:00.000Z",
      "status": "CLOSED",
      "toParentsOf": ["H6-05"],
      "respondedMetrics": { "respondedPerStudent": 2, "totalStudents": 2 },
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN",
      "consentByDate": "2026-03-20T15:59:59.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 10
}
```

### consent_form_detail.json

```json
{
  "consentFormId": 1038,
  "title": "Consent Form for Boxing Competition 1 April 2026",
  "richTextContent": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Dear Parents, your child has been selected to represent the school in the Boxing Competition on 1 April 2026. Please indicate your consent below.\"}]}]}",
  "responseType": "YES_NO",
  "eventStartDate": "2026-04-01T04:00:00.000Z",
  "eventEndDate": "2026-04-01T09:00:00.000Z",
  "consentByDate": "2026-03-30T15:59:59.000Z",
  "addReminderType": "ONE_TIME",
  "reminderDate": "2026-03-29T15:59:59.000Z",
  "postedDate": "2026-03-24T03:08:05.000Z",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:08:05.000Z",
  "attachments": [],
  "images": [],
  "websiteLinks": [],
  "customQuestions": [],
  "staffOwners": [{ "staffID": 1013, "staffName": "EBI HO BIN BIN" }],
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "Boxing",
      "response": "YES",
      "respondedAt": "2026-03-25T09:00:00.000Z"
    },
    {
      "studentId": 2,
      "studentName": "LEE WEI LIANG",
      "className": "Boxing",
      "response": null,
      "respondedAt": null
    }
  ],
  "status": "OPEN",
  "consentFormHistory": []
}
```

### ptm_list.json

```json
{
  "upcoming": [
    {
      "eventId": 1001,
      "title": "Parent-Teacher Meeting — Term 2 2026",
      "eventDates": [
        {
          "startDateTime": "2026-04-10T01:00:00.000Z",
          "endDateTime": "2026-04-10T09:00:00.000Z"
        }
      ],
      "bookingWindows": [
        {
          "windowDate": {
            "startDateTime": "2026-04-05T00:00:00.000Z",
            "endDateTime": "2026-04-09T16:00:00.000Z"
          }
        }
      ],
      "bookingSummary": { "available": 12, "pending": 2, "booked": 2 },
      "targetStudents": 4,
      "createdDate": "2026-03-20T08:00:00.000Z",
      "slotDuration": 30,
      "bookingsPerSlot": 1,
      "status": "BOOKING_OPEN"
    }
  ],
  "past": [
    {
      "eventId": 1000,
      "title": "Parent-Teacher Meeting — Term 1 2026",
      "eventDates": [
        {
          "startDateTime": "2026-01-15T01:00:00.000Z",
          "endDateTime": "2026-01-15T09:00:00.000Z"
        }
      ],
      "bookingWindows": [],
      "bookingSummary": { "available": 0, "pending": 0, "booked": 16 },
      "targetStudents": 30,
      "createdDate": "2026-01-05T08:00:00.000Z",
      "slotDuration": 15,
      "bookingsPerSlot": 1,
      "status": "PAST"
    }
  ]
}
```

### ptm_detail.json

```json
{
  "eventId": 1001,
  "title": "Parent-Teacher Meeting — Term 2 2026",
  "richTextContent": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Dear Parents, you are invited to book a meeting slot with your child's form teacher.\"}]}]}",
  "venue": "School Hall",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "eventDates": [
    {
      "startDateTime": "2026-04-10T01:00:00.000Z",
      "endDateTime": "2026-04-10T09:00:00.000Z"
    }
  ],
  "bookingWindows": [
    {
      "windowDate": {
        "startDateTime": "2026-04-05T00:00:00.000Z",
        "endDateTime": "2026-04-09T16:00:00.000Z"
      }
    }
  ],
  "slotDuration": 30,
  "bookingsPerSlot": 1,
  "staffOwners": [{ "staffID": 1013, "staffName": "EBI HO BIN BIN" }],
  "attachments": [],
  "websiteLinks": [],
  "status": "BOOKING_OPEN",
  "createdDate": "2026-03-20T08:00:00.000Z"
}
```

### ptm_timeslots.json

```json
{
  "eventId": 1001,
  "timeslots": [
    {
      "slotId": 1,
      "startDateTime": "2026-04-10T01:00:00.000Z",
      "endDateTime": "2026-04-10T01:30:00.000Z",
      "capacity": 1,
      "booked": 0,
      "isBlocked": false,
      "bookings": []
    },
    {
      "slotId": 2,
      "startDateTime": "2026-04-10T01:30:00.000Z",
      "endDateTime": "2026-04-10T02:00:00.000Z",
      "capacity": 1,
      "booked": 1,
      "isBlocked": false,
      "bookings": [
        {
          "bookingId": 10,
          "studentId": 1,
          "studentName": "TAN XIAO MING",
          "parentName": "TAN AH KOW",
          "bookedAt": "2026-04-06T09:00:00.000Z"
        }
      ]
    },
    {
      "slotId": 3,
      "startDateTime": "2026-04-10T02:00:00.000Z",
      "endDateTime": "2026-04-10T02:30:00.000Z",
      "capacity": 1,
      "booked": 0,
      "isBlocked": true,
      "bookings": []
    }
  ]
}
```

### ptm_bookings.json

```json
{
  "eventId": 1001,
  "scheduleDate": "2026-04-10T00:00:00.000Z",
  "bookings": [
    {
      "bookingId": 10,
      "slotId": 2,
      "startDateTime": "2026-04-10T01:30:00.000Z",
      "endDateTime": "2026-04-10T02:00:00.000Z",
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "Boxing",
      "parentName": "TAN AH KOW",
      "bookedAt": "2026-04-06T09:00:00.000Z",
      "remark": ""
    }
  ]
}
```

### groups_assigned.json

```json
{
  "classes": [
    {
      "classId": 101,
      "className": "H6-05",
      "level": "SECONDARY 4",
      "year": 2026,
      "role": "FORM_TEACHER",
      "studentCount": 30
    }
  ],
  "ccas": [
    {
      "ccaId": 10,
      "ccaName": "BOXING",
      "studentCount": 15
    }
  ],
  "levels": [
    {
      "levelId": 6,
      "levelName": "SECONDARY 4",
      "year": 2026,
      "studentCount": 120
    }
  ],
  "school": {
    "schoolId": 1001,
    "schoolName": "SANDWICH PRIMARY SCHOOL",
    "studentCount": 600
  }
}
```

### groups_custom_list.json

```json
{
  "customGroups": [
    {
      "customGroupId": 5,
      "name": "My Study Group",
      "studentCount": 8,
      "createdBy": 1013,
      "createdByName": "EBI HO BIN BIN",
      "isShared": false,
      "createdAt": "2026-03-01T08:00:00.000Z"
    },
    {
      "customGroupId": 6,
      "name": "Enrichment Class A",
      "studentCount": 12,
      "createdBy": 1014,
      "createdByName": "STACY WU YONG GUANG",
      "isShared": true,
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ]
}
```

### groups_custom_detail.json

```json
{
  "customGroupId": 5,
  "name": "My Study Group",
  "createdBy": 1013,
  "createdByName": "EBI HO BIN BIN",
  "isShared": false,
  "sharedWith": [],
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "indexNumber": 15,
      "ccas": ["BOXING"]
    },
    {
      "studentId": 2,
      "studentName": "LEE WEI LIANG",
      "className": "H6-05",
      "indexNumber": 16,
      "ccas": []
    }
  ],
  "createdAt": "2026-03-01T08:00:00.000Z"
}
```

### school_staff.json

```json
{
  "staff": [
    {
      "staffId": 1013,
      "staffName": "EBI HO BIN BIN",
      "email": "parentsgateway.otp+PGU00391@gmail.com",
      "schoolEmail": "sandwich_pri@moe.edu.sg",
      "assignedClass": "H6-05"
    },
    {
      "staffId": 1014,
      "staffName": "STACY WU YONG GUANG",
      "email": "parentsgateway.otp+PGU00392@gmail.com",
      "schoolEmail": "sandwich_pri@moe.edu.sg",
      "assignedClass": "H6-04"
    }
  ]
}
```

### school_students.json

```json
{
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "level": "SECONDARY 4",
      "indexNumber": 15,
      "ccas": ["BOXING"]
    },
    {
      "studentId": 2,
      "studentName": "LEE WEI LIANG",
      "className": "H6-05",
      "level": "SECONDARY 4",
      "indexNumber": 16,
      "ccas": []
    },
    {
      "studentId": 3,
      "studentName": "CHEN XIAO HUA",
      "className": "H6-04",
      "level": "SECONDARY 4",
      "indexNumber": 5,
      "ccas": ["BOXING", "DANCE & DRAMA CLUB"]
    }
  ],
  "total": 3
}
```

### school_groups.json

```json
{
  "classes": [
    { "classId": 101, "className": "H6-05", "level": "SECONDARY 4", "year": 2026 },
    { "classId": 102, "className": "H6-04", "level": "SECONDARY 4", "year": 2026 }
  ],
  "levels": [
    { "levelId": 6, "levelName": "SECONDARY 4", "year": 2026 }
  ],
  "ccas": [
    { "ccaId": 10, "ccaName": "BOXING" },
    { "ccaId": 11, "ccaName": "DANCE & DRAMA CLUB" }
  ]
}
```

### user_me.json

```json
{
  "staffId": 1013,
  "staffName": "EBI HO BIN BIN",
  "email": "parentsgateway.otp+PGU00391@gmail.com",
  "schoolEmail": "sandwich_pri@moe.edu.sg",
  "schoolName": "SANDWICH PRIMARY SCHOOL",
  "displayName": "",
  "displayEmail": "",
  "recentLogins": [
    {
      "loginAt": "2026-04-01T08:00:00.000Z",
      "device": "MacBook Pro",
      "browser": "Chrome 124",
      "ipAddress": "1.2.3.4"
    },
    {
      "loginAt": "2026-03-31T09:30:00.000Z",
      "device": "MacBook Pro",
      "browser": "Chrome 124",
      "ipAddress": "1.2.3.4"
    }
  ]
}
```

### notification_preferences.json

```json
{
  "preferences": [
    {
      "eventType": "CONSENT_FORM_RESPONSE_YES",
      "label": "When a parent responds 'Yes'",
      "enabled": true
    },
    {
      "eventType": "CONSENT_FORM_RESPONSE_NO",
      "label": "When a parent responds 'No'",
      "enabled": true
    },
    {
      "eventType": "CONSENT_FORM_RESPONSE_CHANGED",
      "label": "When a parent changes their response",
      "enabled": false
    },
    {
      "eventType": "PTM_BOOKING_MADE",
      "label": "When a parent books a meeting slot",
      "enabled": true
    },
    {
      "eventType": "PTM_BOOKING_CANCELLED",
      "label": "When a parent cancels a meeting slot",
      "enabled": true
    }
  ]
}
```

---

## 13. Mock Success Responses for Write Routes

In mock mode, all POST/PUT/DELETE return one of these depending on route:

```json
// POST /teachers/announcements → create published
{ "announcementId": 9999, "postId": 9999 }

// POST /teachers/announcements/drafts → create draft
{ "announcementDraftId": 9999 }

// POST /teachers/consentForms → create published
{ "consentFormId": 9999 }

// POST /teachers/consentForms/drafts → create draft
{ "consentFormDraftId": 9999 }

// POST /teachers/meetings → create PTM
{ "eventId": 9999 }

// POST /teachers/groups/custom → create group
{ "customGroupId": 9999 }

// POST /teachers/groups/student/count → count
{ "studentCount": 45 }

// DELETE routes → 204 No Content (empty body)

// All other PUT/POST → generic success
{ "success": true }
```

---

## 14. TW Session ID Extraction

The proxy needs the TW session ID to look up stored PG session data. This is extracted from the TW session cookie. The exact mechanism depends on the TW session implementation (currently in-memory `store` map in `handler/otp.go`). The `session_id` cookie value is the TW session ID.

```go
func twSessionIDFromRequest(r *http.Request) (string, error) {
    c, err := r.Cookie("session_id")
    if err != nil {
        return "", fmt.Errorf("twSessionID: session_id cookie not found: %w", err)
    }
    return c.Value, nil
}
```

---

## 15. Integration Checklist

Before wiring proxy to real pgw-web (Phase 2):

- [ ] Confirm MIMS artifact is not single-use (or handle ordering if it is)
- [ ] Confirm TW server IP is allowlisted in PG's WAF/network rules
- [ ] Confirm PG dev environment URL (`TW_PG_BASE_URL`)
- [ ] Test MIMS callback path returns `session` + `session.sig` cookies
- [ ] Verify `csrf` cookie is present on PG GET responses
- [ ] Test that `xsrf-token` header value from `csrf` cookie passes CSRF validation on a POST
- [ ] Confirm PG returns 302 (not 401) on expired sessions
- [ ] Confirm session re-establishment works within a single request cycle
