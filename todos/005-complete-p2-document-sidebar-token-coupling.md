---
status: pending
priority: p2
issue_id: 005
tags: [code-review, architecture, docs]
dependencies: []
---

# Sidebar token declaration → consumer coupling is undocumented at the edit site

## Problem Statement

The 8 shadcn canonical sidebar tokens (`--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, etc.) declared in `web/App.css` `:root` + `@theme inline` only produce Tailwind utilities (`bg-sidebar`, `bg-sidebar-accent`, etc.) when a source file actually references those utilities — Tailwind v4 tree-shakes utilities, not the var declarations themselves. A future revert of the Sidebar consumer commits (`4665529`) without also reverting the App.css block (part of `4665529`) would leave dead `--color-sidebar-*` vars in `:root` permanently, consuming ~400 bytes of CSS and confusing anyone reading the token file.

The plan doc captures this risk, but the plan is not shipped with the repo's architecture surface. A developer bisecting/reverting won't read the plan.

## Findings

**architecture-strategist:**

> `--color-sidebar-*` exports (`web/App.css:157-164`) and the consumers that reference them (e.g. `bg-sidebar`, `bg-sidebar-accent` in `Sidebar.tsx`, `SidebarItem.tsx`) are not co-located in a single commit. `b70fdc8` (plan) and `4665529` (sidebar migration) are adjacent in history, but nothing in code or commit messages warns a future dev that reverting the consumer commit without reverting the token commit leaves dead CSS vars in `:root` permanently.
>
> **Recommendation:** either collapse token-declaration + first-consumer into one atomic commit, or add a one-line comment at `App.css:156` ("these vars are only meaningful while `Sidebar/*` consumes them") so the coupling is legible at the edit site.

**Location:** `web/App.css:52-63` (sidebar `:root` block) and `web/App.css:156-164` (sidebar `@theme inline` block).

## Proposed Solutions

### Option A — Inline comment at the edit site (recommended)

Add a one-line comment in `App.css` adjacent to the sidebar token declarations:

```css
/* Sidebar — shadcn v4 canonical token set. Consumed by web/components/Sidebar/*.
   If those files stop referencing the tokens, remove this block too — Tailwind
   v4 JIT tree-shakes utilities, not var declarations. */
--sidebar: var(--slate-2);
```

**Pros:** legible at the edit site; zero structural change. **Cons:** comments can drift from code. **Effort:** Small. **Risk:** None.

### Option B — Collocate tokens + consumers via a `@layer` or dedicated file

Move sidebar tokens to `web/components/Sidebar/sidebar.css` (imported by `App.css`). Then a full Sidebar revert naturally removes the tokens too.

**Pros:** physical coupling enforces the semantic coupling. **Cons:** departs from shadcn's convention of putting all tokens in a single theme file; makes `App.css` the odd one out. **Effort:** Medium. **Risk:** Low.

### Option C — Ship `docs/architecture/color-tokens.md`

The post-migration notes flag this doc as deferred. It would document the coupling formally.

**Pros:** proper decision record. **Cons:** doesn't help bisect/revert workflows that don't consult docs. **Effort:** Medium. **Risk:** Low. See todo 010.

## Recommended Action

(Filled during triage. Option A is the cheapest hedge; add it alongside todo 010.)

## Technical Details

- **Affected files:** `web/App.css`
- **Lines:** 52-63 (`:root` block), 156-164 (`@theme inline` block)

## Acceptance Criteria

- [ ] Comment at `App.css:52` explaining coupling with `web/components/Sidebar/*`
- [ ] Comment at `App.css:156` noting tree-shaking behavior
- [ ] Revert workflow documented (revert consumer → also revert tokens)

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: architecture-strategist run 2026-04-18
- Related: todo 010 (`docs/architecture/color-tokens.md`)
