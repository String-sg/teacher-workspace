# Teacher Workspace

## Package Manager

Use `pnpm` (not npm). Examples: `pnpm dev`, `pnpm build`, `pnpm install`.

## Design System

Read [DESIGN.md](DESIGN.md) before modifying any Flow DS component styling. Key rule: **override tokens first, use wrappers only for exceptions**.

- Token overrides: `web/flow-teacher-ds.css`
- Component wrappers: `web/components/ui/`
- Preview page: `/components` route (`web/containers/ComponentsView.tsx`)
