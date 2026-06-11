# teacher-workspace

Monorepo for the Teacher Workspace platform. Contains a Module Federation host shell (Rsbuild) and a Go API server.

## Repository layout

```
teacher-workspace/
├── apps/
│   └── host/          # MF host shell — Rsbuild, React 19
├── server/            # Go HTTP server
├── go.mod             # Go module root (github.com/String-sg/teacher-workspace)
├── package.json       # pnpm workspace root
└── pnpm-workspace.yaml
```

All future front-end apps live under `apps/` and are scoped `@teacher-workspace/<name>`.

## Toolchain

| Tool | Version |
| ---- | ------- |
| Node | 24      |
| pnpm | 11      |
| Go   | 1.26    |

Node and pnpm versions are enforced via the `engines` field in the root `package.json`. No `.nvmrc` is used; use a version manager that respects `engines` (e.g. [Volta](https://volta.sh/), `fnm`).

## Getting started

```bash
# Install JS dependencies
pnpm install

# Start the host shell dev server
pnpm dev

# Build the host shell
pnpm build
```

```bash
# Run the Go server
go run ./server/...
```

## Package naming convention

Front-end apps follow the `@teacher-workspace/<name>` scope. The host shell is `@teacher-workspace/host`.
