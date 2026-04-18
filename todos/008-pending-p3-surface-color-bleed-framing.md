---
status: pending
priority: p3
issue_id: 008
tags: [code-review, architecture, tokens]
dependencies: []
---

# "Sidebar-color bleed" framing at 3 exemption sites is wrong — needs a surface token

## Problem Statement

The exemption registry describes `RichTextToolbar.tsx:135` (`bg-slate-2`), `entity-selector.tsx:221` (`hover:bg-slate-2`), and `entity-selector.tsx:556` (`hover:bg-slate-2`) as "sidebar-color bleed outside Sidebar/". That framing is a smell, not a design principle — if the toolbar surface intentionally matches the sidebar chrome color, the right abstraction is a neutral _surface_ token (e.g. `--surface-muted` → `var(--slate-2)`), not a "bleed exemption."

## Findings

**architecture-strategist:**

> `RichTextToolbar.tsx:135 bg-slate-2` framing is wrong. The comment "sidebar-color bleed outside Sidebar/" is a smell, not a feature. If the toolbar surface intentionally matches the sidebar, that's a _surface_ semantic, not a sidebar semantic — it should be `bg-sidebar` (wrong: implies it's a sidebar) or a new `--surface-subtle` token. Same pattern in `entity-selector.tsx:221, :556`.
>
> **Recommendation:** introduce `--surface-muted` (aliased to `--slate-2`) and retire these 3 exemptions. This is the follow-up the registry header gestures at. Don't ship `bg-muted` here — `--muted` maps to `--slate-3` in this codebase, so it's visually distinct.

## Constraint conflict

User mandate for the parent PR was **"do not invent new tokens."** This finding directly pushes against that — the architect is essentially saying "the no-invented-tokens rule forces awkward exemptions; once you hit 3 sites of the same pattern, graduating a project-local token is the architecturally right move."

## Proposed Solutions

### Option A — Graduate `--surface-muted` token (architect's recommendation)

Add to `App.css`:

```css
--surface-muted: var(--slate-2);
```

Expose in `@theme inline`:

```css
--color-surface-muted: var(--surface-muted);
```

Retire 3 exemptions. Requires revisiting the "no invented tokens" rule with the user.

**Pros:** resolves the architectural smell, sets precedent for the graduation rule in the plan. **Cons:** requires user sign-off to override the constraint. **Effort:** Small. **Risk:** Low.

### Option B — Unify on `bg-muted` (slate-3)

Accept the visual shift and migrate all 3 sites to `bg-muted` (slate-3, slightly darker). Visual drift of one Radix step.

**Pros:** uses an existing shadcn token; zero new invention. **Cons:** visual regression at 3 call sites. **Effort:** Small. **Risk:** Medium.

### Option C — Status quo

Leave the exemptions in place. Revisit if/when the graduation trigger (3+ call sites) becomes painful.

**Pros:** respects user constraint; zero immediate work. **Cons:** architectural smell persists; the "graduation rule" in the plan is dead on arrival since the threshold is already hit.

## Recommended Action

(Filled during triage. Recommend re-raising with user — this is exactly the case the graduation rule was designed for.)

## Technical Details

- **Affected files:** `web/App.css`, `web/components/posts/RichTextToolbar.tsx`, `web/components/comms/entity-selector.tsx`, `scripts/raw-color-exemptions.txt`

## Acceptance Criteria

- [ ] Decision captured in `docs/plans/…-plan.md` post-migration notes
- [ ] If Option A: `--surface-muted` declared + exposed + 3 consumers migrated + 3 exemptions removed
- [ ] If Option B: 3 consumers use `bg-muted`, visual diff reviewed
- [ ] If Option C: registry header comment updated to note "3-sites-graduation rule intentionally deferred"

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Plan: `docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md` (graduation rule in architecture review section)
- Review finding: architecture-strategist run 2026-04-18
