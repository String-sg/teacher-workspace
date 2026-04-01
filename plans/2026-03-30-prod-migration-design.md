# Production Migration Design

**Date:** 2026-03-30
**Branch:** feat/prod-scaffold
**Status:** Approved

---

## Context

The designer prototype (`teacher-workspace-v0`) has a significantly more developed UI than the production repo (`String-sg/teacher-workspace`). Rather than continuing to develop both separately, we migrate the designer prototype into a production-grade codebase by:

1. Adopting the RFC-027 frontend monolith structure
2. Pulling the Go BFF backend from the production repo
3. Dropping TanStack Start in favour of Vite SPA (matching prod stack)
4. Switching from Bun to pnpm

Mock data stays in place throughout — API wiring is out of scope for this migration.

---

## Repository Structure (Target)

```
/server                        ← Go BFF (copied from String-sg/teacher-workspace)
  /cmd/tw/main.go
  /internal/config/
  /internal/handler/
  /internal/htmlutil/
  /internal/middleware/
  /pkg/dotenv/
  /pkg/require/

/web                           ← RFC-027 frontend monolith
  /apps/
    /pg/                       ← Parents Gateway feature app
      /components/             ← PG-specific components (comms/, forms/)
      /routes/                 ← All PG route files (announcements, forms, groups, etc.)
      /hooks/                  ← PG-specific hooks
      /data/                   ← Mock data
      /types/                  ← PG-specific types
  /platform/                   ← Shell owned by Platform Team
    /components/               ← AppSidebar, AppHeader
    /routes/                   ← Root layout, index
  /shared/                     ← Design system, utilities (owned by Platform Team)
    /components/ui/            ← shadcn primitives
    /lib/                      ← utils (cn, etc.)
    /types/                    ← Shared types

/index.html
/vite.config.ts
/tsconfig.json
/package.json                  ← pnpm, no TanStack Start
/pnpm-workspace.yaml
/.env.example
/.github/workflows/ci.yaml     ← copied from prod
/.github/workflows/sast.yml    ← copied from prod
/.golangci.yaml
/.husky/
/.lintstagedrc.js
/.prettierrc.js
/go.mod
/go.sum
```

---

## Dependency Rules (RFC-027)

- `web/apps/*` may import from `web/shared/*`
- `web/apps/*` may import from approved interfaces in `web/platform/*`
- `web/platform/*` may import from `web/shared/*`
- `web/shared/*` must NOT import from apps or platform
- Apps must NOT import from other apps

---

## Stack Changes

| Removed | Replacement |
|---|---|
| `@tanstack/react-start` | Plain Vite + React 19 |
| TanStack Router (file-based, codegen) | TanStack Router (manual route tree) |
| `bun` / `bunfig.toml` | pnpm |
| `src/routeTree.gen.ts` | Deleted |
| `src/` flat structure | `web/apps/`, `web/platform/`, `web/shared/` |

Kept unchanged:
- Tailwind CSS v4
- shadcn/ui + Base UI primitives
- Tiptap rich text
- All existing UI component and route logic

---

## Migration Steps

1. **Copy Go backend** from `String-sg/teacher-workspace` — `/server`, `go.mod`, `go.sum`, `.golangci.yaml`, `.env.example`
2. **Swap package manager** — remove `bun.lock`, `bunfig.toml`; add `pnpm-workspace.yaml`; update `package.json` scripts to use pnpm
3. **Replace TanStack Start** — remove `@tanstack/react-start`; replace `vite.config.ts` with plain Vite config; switch to manual TanStack Router route tree
4. **Restructure frontend** — create `web/` folder; move files per target structure above
5. **Port CI/tooling** — copy `.github/workflows/`, `.husky/`, `.lintstagedrc.js`, `.prettierrc.js`, ESLint config from prod
6. **Verify** — `pnpm dev` serves the app; all existing pages render

---

## Out of Scope

- Real API wiring (mock data stays)
- MIMS SSO / real auth
- Valkey session storage
- RFC-028 downstream app services
- Deployment config
