---
status: pending
priority: p3
issue_id: 010
tags: [code-review, architecture, docs]
dependencies: []
---

# Missing `docs/architecture/color-tokens.md` contract doc

## Problem Statement

The post-migration notes in `docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md` explicitly flag this doc as deferred. The plan doc + exemption registry header comment together carry ~70% of the weight, but what's missing is the _decision record_: why shadcn v4 (vs. v3, vs. direct Radix), why `--muted` is rebased on `--slate-3` specifically, why `--ring` is `--twblue-8` not `--primary`, and the graduation rule for promoting recurring exemptions to project-local tokens.

## Findings

**architecture-strategist:**

> Missing `docs/architecture/color-tokens.md` is acceptable risk short-term but debt compounds fast. The plan doc + registry header comment do carry ~70% of the weight for a reader who knows where to look. What's missing is the _decision record_: why shadcn v4 (vs. v3, vs. direct Radix), why rebase `--muted` on `--slate-3` specifically, why `--ring` is `--twblue-8` not `--primary`. Without this, the next contributor will either break the invariants (likely) or re-derive them from git archaeology (expensive).

## Proposed Solutions

### Option A — Write `docs/architecture/color-tokens.md` (~40 lines)

Sections:

1. **Token layers** — raw Radix scales in `:root` → shadcn semantic tokens in `:root` → `@theme inline` exports
2. **Why shadcn v4 canonical** — matches upstream snippets, enables `shadcn add X` without remap
3. **Why the specific Radix mappings** — `--muted: slate-3`, `--accent: slate-4`, `--border: slate-6`, `--input: slate-7`, etc.
4. **Exemption policy** — when to register vs. migrate; the graduation rule (3+ call sites → promote)
5. **Upgrade process** — what to do when shadcn v5 renames a token
6. **Decorative slate-4 rule** — filled shapes vs. dividers (depends on todo 009)

**Pros:** proper decision record; short enough to actually get read. **Cons:** ~1 hour of writing. **Effort:** Medium. **Risk:** None.

### Option B — Expand the plan's "Token Contract" section in-place

The plan already has 80% of the content. Mark the plan as the de facto contract and stop there.

**Pros:** zero new files. **Cons:** plan docs are read as execution history, not living contracts; unlikely to be consulted months later. **Effort:** Trivial. **Risk:** Medium.

### Option C — CLAUDE.md addendum

A short "Color tokens" section in `CLAUDE.md`.

**Pros:** visible to all contributors via the main project doc. **Cons:** bloats CLAUDE.md with niche content. **Effort:** Small. **Risk:** Low.

## Recommended Action

Option A (the post-migration notes explicitly called this out as the follow-up).

## Technical Details

- **Affected files:** `docs/architecture/color-tokens.md` (new)
- Incorporates: todo 009 (decorative rule), todo 005 (coupling note)

## Acceptance Criteria

- [ ] `docs/architecture/color-tokens.md` exists, ~40 lines
- [ ] Documents token layers, Radix mappings, exemption policy + graduation rule, upgrade process
- [ ] Linked from `README.md` or `CLAUDE.md`

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Plan: `docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md` (post-migration notes)
- Review finding: architecture-strategist run 2026-04-18
