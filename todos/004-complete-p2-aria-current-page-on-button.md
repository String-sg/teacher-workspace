---
status: pending
priority: p2
issue_id: 004
tags: [code-review, accessibility, a11y]
dependencies: []
---

# `aria-current="page"` on the `<Button>` branch misleads screen readers

## Problem Statement

`SidebarItem.tsx` has three render branches: anchor (`<a>`), React Router `<Link>`, and `<Button>`. All three got the attribute rename `data-selected` → `data-active="true"` + `aria-current="page"` in Phase 4. For the anchor and Link branches this is correct — `aria-current="page"` is the canonical WAI-ARIA value on nav links. For the Button branch it's subtly wrong: the button doesn't navigate, so announcing "current page" misleads screen-reader users. The correct value on a non-link activation trigger is `aria-current="true"` or `aria-pressed="true"` (if it's a toggle).

## Findings

**security-sentinel (a11y note):**

> `aria-current="page"` on `<Button>` — LOW (a11y, not security). `aria-current="page"` on a non-link element is discouraged by WAI-ARIA; `aria-current="true"` is the generic value. Screen readers announcing "current page" on a button that doesn't navigate is mildly misleading. The `<Link>`/`<a>` variants at lines 149, 172 are correct.
>
> File: `web/components/Sidebar/SidebarItem.tsx:196`

**Location:** `web/components/Sidebar/SidebarItem.tsx:196-197` (the Button render branch).

## Proposed Solutions

### Option A — Branch-specific ARIA (recommended)

Pass different `aria-current` values per branch:

```tsx
// anchor / Link branches (existing):
aria-current={selected ? 'page' : undefined}

// Button branch:
aria-current={selected ? 'true' : undefined}
```

**Pros:** correct ARIA semantics for each role. **Cons:** slight duplication across branches. **Effort:** Small. **Risk:** None.

### Option B — Extract a helper

```tsx
const ariaCurrent = (selected: boolean | undefined, asNav: boolean) =>
  selected ? (asNav ? 'page' : 'true') : undefined;
```

**Pros:** centralized logic, self-documenting. **Cons:** adds a helper for 3 call sites. **Effort:** Small. **Risk:** None.

### Option C — Uniformly drop `aria-current` on Button

If the Button branch is never actually used for nav (grep suggests it's for user-triggered actions like "Help", "Sign out"), removing `aria-current` entirely is the simplest fix.

**Pros:** no semantic confusion. **Cons:** loses the "currently-selected" announcement for screen-reader users on the Button branch (if any `SidebarItem` with `onClick` is actually a current-selection indicator). **Effort:** Small. **Risk:** Low.

## Recommended Action

(Filled during triage. Option A is most defensible.)

## Technical Details

- **Affected files:** `web/components/Sidebar/SidebarItem.tsx`
- **Lines:** 149 (anchor — correct), 171 (Link — correct), 196-197 (Button — needs fix)

## Acceptance Criteria

- [ ] Button branch uses `aria-current="true"` (or equivalent) instead of `aria-current="page"`
- [ ] Anchor and Link branches remain `aria-current="page"` (unchanged)
- [ ] Manual QA: VoiceOver announces "selected" (not "current page") on the Button variant
- [ ] Build passes

## Work Log

(To be filled.)

## Resources

- WAI-ARIA `aria-current` spec: https://www.w3.org/TR/wai-aria-1.2/#aria-current
- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: security-sentinel run 2026-04-18
