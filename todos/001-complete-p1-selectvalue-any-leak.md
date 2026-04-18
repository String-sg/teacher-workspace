---
status: pending
priority: p1
issue_id: 001
tags: [code-review, quality, typescript]
dependencies: []
---

# SelectValue render-prop leaks `any` into color-styling code

## Problem Statement

`<SelectValue>` from `@base-ui/react/select` types its children render-prop as `(value: any) => React.ReactNode`. The Theme mapping table in `ComponentsView.tsx` consumes that `value` directly: it's spread into `ALL_OPTIONS.find((o) => o.value === value)` (an `any`-vs-`string` comparison) and passed to `style={{ backgroundColor: value }}` (CSS property accepts `any`). Any future refactor that swaps the CSS property or changes `ALL_OPTIONS` entry shape will silently type-check.

## Findings

**kieran-typescript-reviewer (PR #143 review):**

> Per the "no unjustified `any`" rule, tighten this at the boundary:
>
> ```tsx
> {(value) => {
>   const v = typeof value === 'string' ? value : '';
>   const opt = ALL_OPTIONS.find((o) => o.value === v);
>   …
> }}
> ```

Secondary: the `onValueChange={(v) => setMappings((prev) => ({ ...prev, [token]: v ?? prev[token] }))}` null-guard (added to unblock `pnpm build`) is correct but unreachable in practice — base-ui's single-mode Select only emits `null` on reset, which this component never does. Either drop the `??` or `typeof`-gate it to make the dead branch explicit.

**Location:**

- `web/containers/ComponentsView.tsx:207-221` (SelectValue render-prop)
- `web/containers/ComponentsView.tsx:204` (onValueChange null-guard)

## Proposed Solutions

### Option A — Narrow at the boundary (recommended)

```tsx
<SelectValue>
  {(value) => {
    const v = typeof value === 'string' ? value : '';
    const opt = ALL_OPTIONS.find((o) => o.value === v);
    return (
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-sm outline outline-offset-[-1px] outline-slate-6"
          style={{ backgroundColor: v }}
        />
        <code className="text-xs">{opt?.label ?? v}</code>
      </span>
    );
  }}
</SelectValue>
```

**Pros:** one line of narrowing, no runtime cost, removes `any` from the downstream flow. **Cons:** none. **Effort:** Small. **Risk:** None.

### Option B — Type the render-prop explicitly

Wrap `SelectValue` in a project-local component that overrides the render-prop signature to `(value: string | null) => React.ReactNode` (which is actually what base-ui emits at runtime in single-mode). **Pros:** reusable across any future SelectValue consumers. **Cons:** touches the ui/ primitive layer for one demo site. **Effort:** Medium. **Risk:** Low.

### Option C — Live with it

Accept the `any` since the demo component is reference-only. **Pros:** zero work. **Cons:** violates the project's type-safety posture and propagates the `any` into `ALL_OPTIONS.find` type inference.

## Recommended Action

(Filled during triage.)

## Technical Details

- **Affected files:** `web/containers/ComponentsView.tsx`
- **Components:** `ThemeMappingTable` render-prop inside `<SelectValue>`
- **Database changes:** None

## Acceptance Criteria

- [ ] `SelectValue` render-prop narrows `value` to `string` before consumption
- [ ] `ALL_OPTIONS.find` receives a typed `string`
- [ ] `style={{ backgroundColor: … }}` receives a typed `string`
- [ ] `pnpm build` passes
- [ ] Optional: `onValueChange` null-guard either removed or made explicit

## Work Log

(To be filled when work starts.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Base UI Select docs: https://base-ui.com/react/components/select
- Review finding: kieran-typescript-reviewer run 2026-04-18
