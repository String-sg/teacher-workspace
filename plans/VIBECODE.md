# Vibecode Reference — teacher-workspace

A coding standards guide for AI-assisted development on this repo. Read this before generating or reviewing code.

---

## 1. Project Overview

Full-stack monorepo:

- **Backend**: Go 1.26.1 HTTP API (`/server`)
- **Frontend**: React 19 + TypeScript 5.9 + Tailwind CSS 4 + Vite 7 (`/web`)
- **Module**: `github.com/String-sg/teacher-workspace`
- **Package manager**: pnpm

---

## 2. Repo Layout

```
/server
  /cmd/tw          – Go binary entrypoint (main.go)
  /internal/       – handler, middleware, config (private)
  /pkg/            – dotenv, require (reusable/public)

/web
  /components/     – reusable React components (PascalCase dir + index.ts barrel)
  /containers/     – page/view-level containers
  /hooks/          – custom React hooks
  /helpers/        – utility functions

/.github/workflows – ci.yaml (lint/format), sast.yml (CodeQL)
```

---

## 3. Naming Conventions

### Go

| Thing                | Convention                           | Example                            |
| -------------------- | ------------------------------------ | ---------------------------------- |
| Packages             | `lowercase` no underscores           | `handler`, `dotenv`                |
| Exported types/funcs | `PascalCase`                         | `Handler`, `RequestOTP`            |
| Unexported           | `camelCase`                          | `cfg`, `sessionID`                 |
| Constants            | `UPPER_SNAKE_CASE`                   | `ErrorCodeInvalidForm`             |
| Test functions       | `Test<Func>_<Scenario>`              | `TestRequestOTP_SuccessProduction` |
| Env vars             | `TW_` prefix, UPPER_SNAKE_CASE       | `TW_SERVER_PORT`                   |
| Struct tags          | `dotenv:"TW_*"`, `json:"field_name"` |                                    |

### TypeScript / React

| Thing                        | Convention                | Example                              |
| ---------------------------- | ------------------------- | ------------------------------------ |
| Components & component files | `PascalCase`              | `AppCard.tsx`                        |
| Hooks                        | `use` prefix, camelCase   | `useIsMobile.ts`                     |
| Utility files                | `camelCase`               | `dateTime.ts`                        |
| Constants                    | `UPPER_SNAKE_CASE`        | `MOBILE_BREAKPOINT`                  |
| Context types                | suffix `Context`          | `SidebarContext`                     |
| Boolean vars                 | `is`, `has`, `can` prefix | `isMobile`, `isOpen`                 |
| Path alias                   | `~/` → `./web/`           | `import { X } from '~/components/X'` |

---

## 4. Code Style

### Go

- Formatted by `gofmt` + `goimports` — **never hand-format imports**
- Use `any` instead of `interface{}` (golangci auto-rewrites this)
- Exported docstrings start with the symbol name:
  ```go
  // Register attaches all application routes to the provided ServeMux.
  func (h *Handler) Register(mux *http.ServeMux) { … }
  ```

### TypeScript

- **Prettier config**: `printWidth: 100`, `tabWidth: 2`, `singleQuote: true`, `trailingComma: 'all'`
- Tailwind classes auto-ordered by `prettier-plugin-tailwindcss`
- Arrow function components with explicit props type:
  ```tsx
  const MyComponent: React.FC<MyComponentProps> = ({ foo }) => { … };
  ```
- JSDoc on all exported functions/hooks:
  ```ts
  /**
   * A hook to check if the viewport is mobile.
   *
   * @returns `true` if the viewport is mobile, `false` otherwise.
   */
  export function useIsMobile(): boolean { … }
  ```

---

## 5. Import Order

### Go

Groups separated by a blank line: **stdlib → external → internal**

```go
import (
    "context"
    "net/http"

    "golang.org/x/sync/errgroup"

    "github.com/String-sg/teacher-workspace/server/internal/config"
    "github.com/String-sg/teacher-workspace/server/internal/handler"
)
```

### TypeScript

Ordered automatically by `eslint-plugin-simple-import-sort`:

1. Side-effect imports (CSS): `import './App.css'`
2. External packages: `import React from 'react'`
3. Internal (`~/` or relative): `import { Sidebar } from '~/components/Sidebar'`

---

## 6. Error Handling (Go)

- Always return `(T, error)` — never swallow errors
- Wrap with context: `fmt.Errorf("requestOTP: %w", err)`
- Join multiple validation errors: `errors.Join(errs...)`
- HTTP errors via handler helpers:
  ```go
  writeClientErrorResponse(w, http.StatusBadRequest, ErrorCodeInvalidForm)
  writeServerErrorResponse(w, logger, err)
  ```
- Named error code constants: `ErrorCodeInvalidForm`, `ErrorCodeInvalidAuth`
- Detect timeouts: `errors.Is(err, context.DeadlineExceeded)`
- Deferred cleanup with error capture: `defer func() { if err := r.Body.Close(); err != nil { … } }()`

---

## 7. Testing (Go)

- Test files: `*_test.go` collocated with source file
- Top-level naming: `Test<FunctionName>_<Scenario>`
- Subtests: `t.Run("scenario description", func(t *testing.T) { … })`
- Assertions: use helpers from `server/pkg/require` — **not** `testing.T` directly
  ```go
  require.Equal(t, expected, actual)
  require.NoError(t, err)
  require.True(t, condition)
  ```
  All helpers call `t.Helper()` internally.
- HTTP mocking: `RoundTripperFunc` type (defined in handler test files)
- State reset: use cleanup helpers (e.g. `resetStore()`) before each test case

> TypeScript tests: not yet added — follow Go's colocation pattern when introduced.

---

## 8. Tooling Cheatsheet

| Command        | What it does                      |
| -------------- | --------------------------------- |
| `pnpm dev`     | Vite dev server                   |
| `pnpm build`   | TS compile + Vite build → `dist/` |
| `pnpm format`  | Prettier check (all file types)   |
| `pnpm lint`    | ESLint on JS/TS                   |
| `pnpm golint`  | golangci-lint on Go               |
| `pnpm prepare` | Setup Husky hooks                 |

---

## 9. CI / Quality Gates

All checks run via GitHub Actions on every PR:

| Workflow   | Jobs                                                |
| ---------- | --------------------------------------------------- |
| `ci.yaml`  | Prettier format → ESLint → golangci-lint            |
| `sast.yml` | CodeQL for JS/TS + Go (also runs on push to `main`) |

Pre-commit (Husky + lint-staged): Prettier + ESLint fix run automatically on staged files.

**All CI checks must pass before merging.**

---

## 10. Security & Config

- Secrets are **never committed** — use `.env.*` files (gitignored)
- Copy `.env.example` to `.env` locally; never commit `.env`
- Config is loaded via `server/pkg/dotenv` and mapped to structs with `dotenv:"TW_*"` tags
- All env var names are prefixed `TW_`
