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

- Monorepo: Go backend + React frontend.
- Env vars prefixed `TW_` (see `.env.example`).
- Go HTTP server uses stdlib `net/http`; no framework.

## Build & Run Commands

```bash
pnpm dev:all                          # Run server + web together
```

### Server

```bash
go build -o build/tw ./server/cmd/tw  # Build binary
go run ./server/cmd/tw                # Run directly
go tool air                           # Run with live-reload
go test ./...                         # Run all tests
go test ./path/to/pkg                 # Run single package tests
go test -run TestName ./path/to/pkg   # Run a specific test
golangci-lint run                     # Static analysis
```

### Web

```bash
pnpm dev                              # Run Vite dev server
pnpm build                            # Build production bundle
pnpm lint                             # Run oxlint
pnpm format                           # Run oxfmt
```

## Formatting & Linting

- Go: `golangci-lint run` (gofmt + goimports).
- TS/JS: `pnpm lint` (oxlint), `pnpm format` (oxfmt).
- Pre-commit: Husky + lint-staged run oxfmt and oxlint on staged files.

## Style

- Don't use em-dashes (`—`). Use colons, parentheses, or separate sentences.

### Go

#### Struct literals

Use **keyed struct literals** (field names), even when every field is set. Positional literals break silently on field add/reorder and force readers to cross-reference the type.

- Yes: `User{Name: "a", Age: 1}`
- No: `User{"a", 1}`
- Applies to table-driven test cases too: list each field by name.

#### Type comments

- Start with the type name; full sentence.
- Describe what the type represents and its role in the package.
- Document non-obvious semantics: zero-value use, invariants, ownership, mutability, concurrency, error meaning.
- Skip field or implementation restatements; include only what callers can't infer from the definition.

#### Method comments

- Start with the method name; full sentence.
- Describe from the caller's view: what it does, not how.
- Document non-obvious semantics: nil, mutation, errors, ordering, concurrency, zero-value.
- Skip signature restatements; include only what callers can't infer from the code.
- Add an example when the method is central, tricky, or easier shown than told.

#### Field comments

Describe the field, not surrounding workflow. Start with `contains` (slices/maps), `reports whether` (bools), `is`, or `holds`. If the field name implies the noun, focus on the qualifier.

#### Code comments

Comment _why_, not _what_; self-explanatory code needs no comment.

- Add comments only for non-obvious logic, invariants, or edge cases.
- Place comments above a logical block, not on every line.
- Tie comments to stable intent so they don't rot when implementation changes.

## Test Conventions

### Go

#### Structure

- One parent test per function/method under test, named after it. All cases live as `t.Run` subtests inside the parent.
  - Top-level functions: `Test<Func>` (e.g. `TestParse`).
  - Struct methods: `Test<Type>_<Method>` (e.g. `TestReader_Read`).
- Small pure helpers get standalone tests without subtests.
- Related subtests can be grouped under an intermediate `t.Run` (e.g. `t.Run("rejects invalid input", ...)`); table-driven cases inside use only the distinguishing trait (the group name provides the verb).

#### Naming

- Parent function: `Test<Func>` or `Test<Type>_<Method>`, no extra suffix.
- Subtest names start with the outcome, optionally followed by the scenario: `"returns error on timeout"`, `"rejects invalid key"`.
- Table-driven cases inside a grouping `t.Run` use just the distinguishing trait: `"missing XXX"`, `"wrong status code"`.

#### Assertions

Use `want/got` style:

- Error checks: `t.Fatalf("want nil, got: %v", err)` or `t.Fatal("want: err, got: nil")`
- Field checks: `t.Errorf("want name: %q, got: %q", want, got)`
- Containment: `t.Errorf("want err containing %q, got: %v", substr, err)`
- If `got` isn't captured, use an `if` initialiser: `if want, got := "XXX", resp.Header.Get("X-XXX"); want != got { ... }`

## Commit Conventions

- Single summary line only (no multi-line body); details go in the PR description.
- Use conventional commit format (e.g. `feat:`, `fix:`, `test:`, `docs:`).
- Backtick file and variable names in commit messages.
- Be specific: name the things being changed, not vague descriptions.
- Keep it high level; don't list implementation details (e.g. individual functions).
- Make logical, incremental commits.

## Pull Request Conventions

- Use `.github/PULL_REQUEST_TEMPLATE.md` for the description; fill every section.
