# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A unified platform that consolidates teacher-facing applications into day-to-day workflows.

## Tech Stack

- Go 1.26.1
- PNPM 10
- TypeScript 6.0
- React 19
- Vite 7
- Tailwind CSS 4

## Architecture

- Monorepo: Go backend + React frontend
- Config via environment variables with `TW_` prefix (see `.env.example`)
- Go HTTP server uses standard library `net/http` — no framework

## Build & Run Commands

### Go

```bash
go build -o build/tw ./cmd/tw       # Build binary
go run ./cmd/tw                     # Run directly
go test ./...                       # Run all tests
go test ./path/to/pkg               # Run single package tests
go test -run TestName ./path/to/pkg # Run a specific test
golangci-lint run                   # Static analysis
```

### Frontend

```bash
pnpm install                        # Install dependencies
pnpm dev                            # Run Vite dev server
pnpm build                          # Build production bundle
pnpm lint                           # Run ESLint
pnpm format                         # Run Prettier
```

## Formatting & Linting

- Go: `golangci-lint run` (gofmt + goimports)
- TS/JS: `pnpm lint` (ESLint), `pnpm format` (Prettier)
- Pre-commit: Husky + lint-staged runs Prettier and ESLint on staged files

## Test Conventions

### Go

#### Structure

- Parent test + subtests. Small pure functions get standalone tests without subtests

#### Naming

- Outcome first, optionally followed by scenario: `"returns error on timeout"`, `"rejects invalid key"`
- Table-driven subtests use just the distinguishing trait: `"missing XXX"`, `"wrong status code"`. The parent test name provides the verb context

#### Assertions

Use `want/got` style:

- Error checks: `t.Fatalf("want nil, got: %v", err)` or `t.Fatal("want: err, got: nil)`
- Field checks: `t.Errorf("want name: %q, got: %q", want, got)`
- Containment: `t.Errorf("want err containing %q, got: %v", substr, err)`
- When `got` isn't already captured, use an `if` initialiser: `if want, got := "XXX", resp.Header.Get("X-XXX"); want != got { ... }`

### TypeScript

- No frontend tests yet

## Commit Conventions

- Keep commit messages to a single summary line - no multi-line body/description. Details go in the PR description instead
- Use conventional commit format (e.g. `feat:`, `fix:`, `test:`, `docs:`)
- Use backticks around file names and variables names in commit message
- Be specific - name the things being changed rather than using vague descriptions
- Don't list implementation details (e.g. individual functions, internal mechanisms) - keep it high level
- Make logical, incremental commits rather than one large commit
- Always create a feature branch before starting work

## Design System

Read [DESIGN.md](DESIGN.md) before modifying any Flow DS component styling. Key rule: **override tokens first, use wrappers only for exceptions**.

- Token overrides: `web/flow-teacher-ds.css`
- Component wrappers: `web/components/ui/`
- Preview page: `/components` route (`web/containers/ComponentsView.tsx`)
