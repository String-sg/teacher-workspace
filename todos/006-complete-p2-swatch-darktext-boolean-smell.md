---
status: pending
priority: p2
issue_id: 006
tags: [code-review, quality, typescript]
dependencies: []
---

# `Swatch` component's `darkText: boolean` prop encodes a theme concern as a flag

## Problem Statement

The `Swatch` component in `ComponentsView.tsx` takes `darkText: boolean` to decide whether to render the step number in `text-slate-12` or `text-white`. The parent computes the boolean inline (`step < 9` for solids, `pct < 50` for alpha). Boolean flags are a smell — they don't extend well (what if a third state arrives?) and they hide the underlying theme intent.

## Findings

**kieran-typescript-reviewer:**

> `Swatch` prop shape — `darkText: boolean` is a booly flag; is there a cleaner API?
>
> The parent already knows the rule (`step < 9`). The component should derive it from the style, or take a `tone: 'light' | 'dark'` union, or accept `textClassName`. A second boolean later ("border?", "compact?") would compound this. At minimum rename to `tone: 'light' | 'dark'` — unions beat booleans as soon as you suspect a third state.

**Location:** `web/containers/ComponentsView.tsx:116-139`

## Proposed Solutions

### Option A — `tone: 'light' | 'dark'` union (recommended)

```tsx
function Swatch({
  label,
  title,
  style,
  tone,
}: {
  label: string | number;
  title: string;
  style: React.CSSProperties;
  tone: 'light' | 'dark';
}) {
  const textClass = tone === 'dark' ? 'text-slate-12' : 'text-white';
  // ...
}

// callers:
tone={step < 9 ? 'dark' : 'light'}
```

**Pros:** extends to 'warning' etc. later; self-documenting at call sites. **Cons:** one extra token at each call site. **Effort:** Small. **Risk:** None.

### Option B — `textClassName` passthrough

```tsx
function Swatch({ label, title, style, textClassName = 'text-slate-12' }: ...) { ... }

// callers:
<Swatch textClassName={step < 9 ? 'text-slate-12' : 'text-white'} ... />
```

**Pros:** maximum flexibility. **Cons:** leaks Tailwind classnames into the caller; more verbose. **Effort:** Small. **Risk:** None.

### Option C — Derive from style at runtime

Compute contrast automatically based on `style.backgroundColor`. Too hard for CSS var values like `var(--slate-4)` — would need a lookup table. Skip.

## Recommended Action

(Filled during triage.)

## Technical Details

- **Affected files:** `web/containers/ComponentsView.tsx`
- **Call sites:** `ScaleRow` solid row + (formerly) alpha row.

## Acceptance Criteria

- [ ] `Swatch` takes `tone: 'light' | 'dark'` (or equivalent non-boolean API)
- [ ] All call sites updated
- [ ] Visual output identical to current

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: kieran-typescript-reviewer run 2026-04-18
