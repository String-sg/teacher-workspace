---
status: pending
priority: p3
issue_id: 009
tags: [code-review, quality, docs]
dependencies: []
---

# Decorative `bg-slate-4` split into 3 different targets — rule not documented

## Problem Statement

During the migration, `bg-slate-4` call sites landed on three different shadcn tokens depending on the call site's role:

| Call site                  | Migrated to | File                                                       |
| -------------------------- | ----------- | ---------------------------------------------------------- |
| Skeleton bars (decorative) | `bg-accent` | `web/components/posts/PostTypePicker.tsx:20-23, 38-39, 41` |
| Divider (decorative)       | `bg-border` | `web/components/posts/RichTextToolbar.tsx:58`              |
| Drag handle (interactive)  | `bg-accent` | `web/components/comms/entity-selector.tsx:777`             |

The split is defensible (borders want `bg-border`, fills want `bg-accent`) but the rule is not documented anywhere. A future contributor migrating a new `bg-slate-4` has no guide and will pick by vibe.

## Findings

**pattern-recognition-specialist:**

> Three call sites, three different targets... The divider picking `bg-border` is defensible (borders want slate-6) but is a silent deviation from the rule. Worth a one-line rationale somewhere or a plan note — otherwise reviewers of future files will not know which of the three to pick.

Wait — re-reading: the divider is `bg-slate-4` → `bg-border` (slate-6), which is actually a _darker_ color shift. The reviewer noted this is a deliberate visual choice for dividers. Document it.

## Proposed Solutions

### Option A — Document in `docs/architecture/color-tokens.md` (dep on todo 010)

Add a "Decorative slate-4 rule" section:

- Filled shapes (skeletons, drag handles, decorative surfaces) → `bg-accent`
- Thin dividers / separators → `bg-border` (slate-6, darker — matches border-weight styling)

**Pros:** reproducible guidance. **Cons:** depends on todo 010 shipping. **Effort:** Small. **Risk:** None.

### Option B — Inline comment at each call site

Add a one-line rationale at the 3 call sites.

**Pros:** legible at the edit site. **Cons:** duplication; risks drift. **Effort:** Small. **Risk:** Low.

### Option C — Unify on one target

Migrate all 3 to `bg-accent`. Accept the divider becoming lighter (slate-4 instead of slate-6).

**Pros:** single rule. **Cons:** visual regression on RichTextToolbar divider. **Effort:** Small. **Risk:** Medium.

## Recommended Action

Option A, paired with todo 010.

## Technical Details

- **Affected files:** `docs/architecture/color-tokens.md` (new)

## Acceptance Criteria

- [ ] Decorative slate-4 rule documented in `docs/architecture/color-tokens.md`
- [ ] Rule captures the distinction between filled shapes (`bg-accent`) and dividers (`bg-border`)

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: pattern-recognition-specialist run 2026-04-18
- Related: todo 010
