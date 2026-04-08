# Architecture Decisions

## Stack

- **Frontend:** React 19, React Router 7, Tailwind v4, @flow/core design system
- **Backend:** Go BFF (Backend-For-Frontend) proxy at `server/internal/pg/`
- **Package manager:** pnpm
- **Dev:** Vite 7 with proxy to Go server

## Frontend Layers

```
Routes (App.tsx, lazy-loaded)
  └── Containers (web/containers/) — page-level views with route loaders
       └── Domain components (web/components/comms/) — Posts-specific UI
            └── UI primitives (web/components/ui/) — Flow DS wrappers
                 └── @flow/core — base design system
```

### Design System (DESIGN.md)

**Token-first:** Override CSS tokens in `web/flow-teacher-ds.css` for colors, spacing, typography, shadows. Use `~/components/ui/` wrappers **only** for per-component shape overrides (pill buttons, rounder inputs).

| Component | Override | Result |
|-----------|---------|--------|
| Button | `rounded-full font-medium` | Pill shape |
| Badge | `rounded-full` | Pill shape |
| Input, Textarea | `rounded-xl` | 14px corners |
| TabsTrigger | `rounded-full font-medium` | Pill tabs |
| Everything else | Pure re-export | Flow DS defaults |

### API Client Layer (`web/api/`)

Three files with distinct responsibilities:

- **`types.ts`** — TypeScript interfaces matching Go BFF JSON responses exactly
- **`mappers.ts`** — Converts API shapes to frontend domain types (status case, date routing, Tiptap JSON extraction, readMetrics to counts)
- **`client.ts`** — Fetch helpers, composed loaders, write operations

**Data flow:** Route loader → `client.ts` fetch → API types → `mappers.ts` → FE types → Component

### Route Loaders

Each view co-exports `loader` + `Component`. React Router's `lazy()` picks up both:

```typescript
// PostsView.tsx
export async function loader() { return loadPostsList(); }
export { PostsView as Component };
```

No static `loader` on route definitions — that conflicts with `lazy()`.

### Form State

CreatePostView uses `useReducer` with typed actions (12 variants). Preview panel receives `useDeferredValue(state)` and is wrapped in `React.memo` to prevent re-render cascades during typing.

## Go BFF Proxy

### How It Works

The Go server at `server/internal/pg/` has two modes controlled by `TW_PG_MOCK` env var:

- **Mock mode** (`TW_PG_MOCK=true`, default): Serves embedded JSON fixtures from `server/internal/pg/fixtures/`. 20 GET endpoints registered.
- **Proxy mode** (`TW_PG_MOCK=false`): Reverse proxy to real Parents Gateway (pgw-web). Attaches `X-TW-Staff-ID` header for authentication. 62 endpoints (read + write).

### Endpoints Available

| Feature | Read | Write | Fixtures |
|---------|------|-------|----------|
| Announcements | 6 GET | 7 POST/PUT/DELETE | 5 files |
| Consent Forms | 4 GET | 6 POST/PUT/DELETE | 3 files |
| Meetings (PTM) | 5 GET | 7 POST/DELETE | 5 files |
| Groups | 5 GET | 7 POST/PUT/DELETE | 5 files |
| School Data | 3 GET | 1 POST | 3 files |
| Account | 2 GET | 3 PUT | 2 files |
| Files | 2 GET | 1 POST | none |

### Fixture Fallbacks

When the Go server is not running, the frontend falls back to the same fixture JSON files (imported directly into the client bundle). The `fetchApiSafe` wrapper catches network errors and returns fixture data. It re-throws `AbortError` so React Router navigation cancellation works correctly.

## Mock Data Strategy

- **Go fixtures** (`server/internal/pg/fixtures/*.json`): Real PG API shapes with realistic Singapore education data (Greenridge Secondary School, class 4A, staff TAN GUANG SHIN, etc.)
- **Frontend fixtures fallback**: Same JSON files imported as static imports in `web/api/client.ts`. Used when Go server is unavailable.
- **Frontend inline mocks**: `CreatePostView.tsx` has inline `MOCK_CLASSES`, `MOCK_STAFF`, `PG_SHORTCUTS`, `MOCK_EMAILS` for form selectors. These will be replaced with API calls to `fetchSchoolGroups()` / `fetchSchoolStaff()` when those pages are built.

## Key Type Mappings

| API field | FE field | Conversion |
|-----------|----------|------------|
| `status: "POSTED"` | `status: "posted"` | `.toLowerCase()` |
| `responseType: "VIEW_ONLY"` | `responseType: "view-only"` | Lookup map |
| `readMetrics.readPerStudent` | `stats.readCount` | `Math.round(ratio * total)` |
| `date` (single) | `postedAt` / `scheduledAt` / `createdAt` | Route by status |
| `richTextContent` (Tiptap JSON) | `description` (plain text) | Extract text nodes |
| `students[].isRead` | `recipients[].readStatus` | `isRead ? 'read' : 'unread'` |
| Own endpoint vs shared endpoint | `ownership: 'mine' \| 'shared'` | Derived from which endpoint returned the post |

## Dev Setup

```bash
# Terminal 1 — Go BFF (optional, fixtures fallback works without it)
go run ./server/cmd/tw

# Terminal 2 — Vite dev server
pnpm dev
```

Vite proxies `/api/web/*`, `/api/files/*`, `/api/configs` to Go at `localhost:3000`.
