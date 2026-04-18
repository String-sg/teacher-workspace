---
status: pending
priority: p2
issue_id: 007
tags: [code-review, quality, cleanup]
dependencies: []
---

# Lingering narration comment in `entity-selector.tsx`

## Problem Statement

The session's `/deslop` pass removed narrating comments across `entity-selector.tsx` (4 removals: "Sync activeScope", "Clear any member exclusions", "Propagate exclusions", "Clear exclusions") but missed one: `{/* Drag handle + title bar */}` at line 773 narrates what the wrapping div contains. By the project's comment-style convention (WHY, not WHAT), this should be dropped.

## Findings

**pattern-recognition-specialist:**

> Narrating comments were correctly stripped from `entity-selector.tsx` (4 removals: "Sync activeScope", "Clear any member exclusions", "Propagate exclusions", "Clear exclusions") and `CreatePostView.tsx` (3 removals). One survivor: `web/components/comms/entity-selector.tsx:773` `{/* Drag handle + title bar */}` is pure narration and should be dropped for consistency with the rest of the cleanup.

**Location:** `web/components/comms/entity-selector.tsx:773`

## Proposed Solutions

### Option A — Delete the comment (recommended)

```diff
- {/* Drag handle + title bar */}
  <div className="flex items-center justify-between border-b px-4 py-3">
```

**Pros:** matches the project's WHY-only comment style; reduces noise. **Cons:** none. **Effort:** Trivial. **Risk:** None.

### Option B — Rewrite as WHY

If the drag handle + title is a non-obvious bottom-sheet convention, rewrite explaining why the visual structure matters. Grep the rest of the file first — if the pattern is self-evident from the JSX, delete (Option A).

**Pros:** preserves context if genuinely needed. **Cons:** probably not needed here.

## Recommended Action

Option A.

## Technical Details

- **Affected files:** `web/components/comms/entity-selector.tsx`
- **Line:** 773

## Acceptance Criteria

- [ ] Comment removed
- [ ] Build passes

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: pattern-recognition-specialist run 2026-04-18
- Project comment convention: CLAUDE.md, `/deslop` skill
