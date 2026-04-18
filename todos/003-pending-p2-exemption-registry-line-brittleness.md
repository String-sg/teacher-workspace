---
status: pending
priority: p2
issue_id: 003
tags: [code-review, architecture, tooling]
dependencies: []
---

# Exemption registry is line-number-keyed and will rot under normal editing

## Problem Statement

`scripts/raw-color-exemptions.txt` pins each allowed raw-Radix ref by `path:line` pair — e.g. `web/components/comms/entity-selector.tsx:221`. Any unrelated edit above line 221 in that file shifts every subsequent exemption, producing (a) false positives in CI where migrated lines now get flagged, or worse (b) silent false negatives where the exempted line moves but a new raw ref appears at the old line number and slips through.

## Findings

**architecture-strategist:**

> `scripts/raw-color-exemptions.txt` pins `entity-selector.tsx:221`, `:268`, `:283`, etc. Any edit above line 221 shifts every subsequent line and produces either (a) false positives in CI, (b) silent false negatives where the exempted line moves but a new raw ref appears at 221. The reason-column is the real contract, but the key is brittle.

`entity-selector.tsx` alone has 10 entries. A routine refactor that adds 3 lines to that file will invalidate most of them.

**Location:**

- `scripts/raw-color-exemptions.txt` (the 26 entries)
- `scripts/check-raw-colors.sh` (the matching logic)

## Proposed Solutions

### Option A — Anchor-comment keying (recommended)

Replace `path:line` keys with a source-side anchor comment like `// raw-color-exempt: <reason-slug>`, and have `check-raw-colors.sh` grep for the anchor adjacent to the flagged line.

**Example source:**

```tsx
// raw-color-exempt: no-shadcn-success
<Badge className="bg-green-3 text-green-11 hover:bg-green-3">Posted</Badge>
```

**Pros:** drift-proof under edits, self-documenting at the edit site, blame-able per-line. **Cons:** requires script rewrite + scattering anchor comments through source. **Effort:** Medium. **Risk:** Low.

### Option B — Path + reason keying

Collapse `path:line` to just `path:reason-slug`. Any raw ref in that path with the reason-slug comment nearby passes. Same mechanism as Option A but reasons live in the registry file instead of source.

**Pros:** keeps registry as single source of truth. **Cons:** granularity loss (any raw ref in the file passes under any registered reason). **Effort:** Small. **Risk:** Medium.

### Option C — CODEOWNERS + status quo

Keep line-keyed registry but require a CODEOWNER to approve every change to `scripts/raw-color-exemptions.txt`. Accept the brittleness as an intentional speed bump.

**Pros:** zero code change. **Cons:** doesn't fix the brittleness; just makes someone notice when CI breaks. **Effort:** Small. **Risk:** None.

## Recommended Action

(Filled during triage. Option A is technically the cleanest; Option C is the cheapest short-term hedge.)

## Technical Details

- **Affected files:** `scripts/raw-color-exemptions.txt`, `scripts/check-raw-colors.sh`, plus one anchor comment per source exemption (~26 lines across 6 files).
- Flagged independently by the simplicity reviewer as a simplification target ("consider path+reason instead of path:line").

## Acceptance Criteria

- [ ] Exemption mechanism survives a refactor that adds/removes lines above an exemption
- [ ] `pnpm check:colors` still catches new unregistered raw refs
- [ ] Registry still blame-able per PR
- [ ] Migration of existing 26 entries complete

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- `scripts/raw-color-exemptions.txt`
- Review findings: architecture-strategist + code-simplicity-reviewer (both independent hits)
