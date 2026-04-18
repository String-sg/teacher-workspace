---
status: pending
priority: p2
issue_id: 002
tags: [code-review, quality, typescript]
dependencies: [001]
---

# `SHADCN_DEFAULTS: Record<string, string>` loses key safety

## Problem Statement

`SHADCN_DEFAULTS` in `ComponentsView.tsx` is typed `Record<string, string>`, so `mappings[token]` is inferred `string` (never `undefined`) and any typo in a token name silently type-checks. The demo component is supposed to be the reference other contributors read — it should model the project's idiomatic token shape.

## Findings

**kieran-typescript-reviewer:**

> `Record<string, string>` means `mappings[token]` is `string` (never `undefined`) and any typo elsewhere silently type-checks. This is the kind of "add a constant, infer the type" pattern TS 5 rewards:
>
> ```tsx
> const SHADCN_DEFAULTS = {
>   background: '#ffffff',
>   foreground: 'var(--slate-12)',
>   …
> } as const satisfies Record<string, string>;
> type ShadcnToken = keyof typeof SHADCN_DEFAULTS;
> const SHADCN_TOKENS = Object.keys(SHADCN_DEFAULTS) as ShadcnToken[];
> ```
>
> Then `useState<Record<ShadcnToken, string>>` and every downstream index gives you both exhaustiveness and autocompletion.

**Location:** `web/containers/ComponentsView.tsx:76-97`

## Proposed Solutions

### Option A — `as const satisfies` + derived key type (recommended)

```tsx
const SHADCN_DEFAULTS = {
  background: '#ffffff',
  foreground: 'var(--slate-12)',
  // …
} as const satisfies Record<string, string>;

type ShadcnToken = keyof typeof SHADCN_DEFAULTS;
const SHADCN_TOKENS = Object.keys(SHADCN_DEFAULTS) as ShadcnToken[];
```

Then `useState<Record<ShadcnToken, string>>(SHADCN_DEFAULTS)` gives exhaustiveness + autocompletion.

**Pros:** idiomatic TS 5, zero runtime cost, makes the demo component a better reference for the rest of the codebase. **Cons:** none. **Effort:** Small. **Risk:** None.

### Option B — Manual union

```tsx
type ShadcnToken = 'background' | 'foreground' | 'card' | …;
```

**Pros:** explicit. **Cons:** duplicates the keys; drift prone. **Effort:** Small. **Risk:** Low.

## Recommended Action

(Filled during triage.)

## Technical Details

- **Affected files:** `web/containers/ComponentsView.tsx`
- Coordinate with todo 001: once `SelectValue` narrows `value` to `string`, the `ALL_OPTIONS.find` call chain benefits from `ShadcnToken` awareness too.

## Acceptance Criteria

- [ ] `SHADCN_DEFAULTS` uses `as const satisfies`
- [ ] `ShadcnToken = keyof typeof SHADCN_DEFAULTS`
- [ ] `SHADCN_TOKENS` typed `ShadcnToken[]`
- [ ] `useState<Record<ShadcnToken, string>>(SHADCN_DEFAULTS)`
- [ ] `pnpm build` passes

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: kieran-typescript-reviewer run 2026-04-18
