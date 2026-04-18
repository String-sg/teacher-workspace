---
status: complete
priority: p3
issue_id: 011
tags: [code-review, architecture, cleanup]
dependencies: []
---

## Resolution (2026-04-18)

**Initial fix** — extracted `--white: #ffffff` alias; 6 consumers migrated to
`var(--white)`.

**Reverted same session** — the project lead reinforced "no invented tokens,"
and `--white` is not part of Radix Colors or shadcn v4 canonical sets.
Reverted to `#ffffff` literals at all 6 consumers.

Future dark-mode handling will use `@media (prefers-color-scheme: dark)` or
`[data-theme=dark]` with literal overrides at each consumer, not a
project-local alias.

# Hardcoded `#ffffff` literals in `:root` — prep for future dark-mode sweep

## Problem Statement

`web/App.css` `:root` block hardcodes `#ffffff` at six sites:

- `--background: #ffffff` (line 30)
- `--card: #ffffff` (line 32)
- `--popover: #ffffff` (line 34)
- `--primary-foreground: #ffffff` (line 37)
- `--destructive-foreground: #ffffff` (line 45)
- `--sidebar-primary-foreground: #ffffff` (line 57)

The project is light-only (per commit `50a3f12`). If dark mode ships in the future, these six are the exact list of places to sweep. Making them easy to find reduces that cost.

## Findings

**architecture-strategist:**

> `--destructive-foreground: #ffffff` is a literal in `:root` (line 45). Minor, but five other semantic tokens also hardcode `#ffffff`. If dark mode ever ships, these six literals are the exact list of places to sweep. Worth a `/* dark-mode sweep: */` comment cluster or a single `--white: #ffffff` alias to reduce the surface.

## Proposed Solutions

### Option A — `--white` alias (recommended)

```css
:root {
  --white: #ffffff;
  --background: var(--white);
  --card: var(--white);
  --popover: var(--white);
  --primary-foreground: var(--white);
  --destructive-foreground: var(--white);
  --sidebar-primary-foreground: var(--white);
  ...
}
```

**Pros:** single source of truth; dark-mode sweep becomes "change `--white`" OR add dark-scheme-specific overrides for the 6 consumers. **Cons:** `--white` is semantically weak ("what is white for?") — could name it `--surface-base` or similar. **Effort:** Small. **Risk:** None.

### Option B — Marker comment cluster

Keep the literals but add a marker:

```css
/* dark-mode sweep: change these 6 hardcoded whites when the dark palette lands */
--background: #ffffff;
...
```

**Pros:** zero structural change. **Cons:** comment can drift; no enforcement. **Effort:** Trivial. **Risk:** Low.

### Option C — Leave it

Ship dark mode when it's time; grep for `#ffffff` then.

**Pros:** zero work now. **Cons:** tomorrow-me problem.

## Recommended Action

(Filled during triage. Defer until dark mode is actually on the roadmap — then do Option A.)

## Technical Details

- **Affected files:** `web/App.css`
- **Lines:** 30, 32, 34, 37, 45, 57

## Acceptance Criteria

- [ ] Decision captured
- [ ] If Option A: `--white` alias declared; 6 consumers updated; build passes
- [ ] If Option B: marker comment present

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: architecture-strategist run 2026-04-18
- Related: commit `50a3f12` (removed dark palette shim)
