# Sidebar parity between `main` and `feat/posts-frontend`

## Context

`feat/posts-frontend` intentionally replaces `@import '@flow/core/tailwind.no-reset.css'` with a local Flow-compat shim in [web/App.css](../web/App.css) so colors can be rebased on Radix + shadcn tokens. That swap also dropped everything else Flow's stylesheet was quietly providing — spacing, typography, foreground colors, and its `@source` directives. Every sidebar fix in this branch exists to put one of those missing pieces back.

The sidebar _components_ on this branch are structurally identical to `main`. Only three files differ, and two of them are one-line fixes whose need is created by the CSS swap:

| File                                                                                | Change                                              |
| ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| [web/App.css](../web/App.css)                                                       | replaced Flow stylesheet with a local shim          |
| [web/components/Sidebar/Sidebar.tsx](../web/components/Sidebar/Sidebar.tsx)         | cosmetic class reorder (oxfmt) — no behavior change |
| [web/components/Sidebar/SidebarItem.tsx](../web/components/Sidebar/SidebarItem.tsx) | `p-sm` → `h-10 items-center px-sm`                  |

Unchanged: `SidebarHeader.tsx`, `SidebarContent.tsx`, `SidebarFooter.tsx`, `SidebarTrigger.tsx`, `context.ts`, `SidebarProvider.tsx`.

## Why each change is needed

### 1. Spacing tokens had to be defined — and correctly

**Why**: every sidebar primitive (`p-sm` on items, `px-sm` on content, `gap-y-xs` between items, `p-2xs` on the header label) reads from `--spacing-*`. Flow's stylesheet defined those vars; the shim didn't. Tailwind v4's default spacing scale uses a different step pattern, so utilities silently resolved to the wrong numbers.

The first draft of the shim tried to map them but was off by one step (`--spacing-sm: 0.5rem` instead of `0.75rem`). Every sidebar dimension — padding, gap, item height — came out tighter than main.

**Fix**: declare the Flow scale exactly as Flow defines it.

```css
--spacing-2xs: 0.25rem;
--spacing-xs: 0.5rem;
--spacing-sm: 0.75rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
```

### 2. Tailwind needs `@source` pointers into `@flow/core`

**Why**: Tailwind v4 generates utilities via JIT scanning, and **does not scan `node_modules/` by default**. Flow's `tailwind.no-reset.css` contained `@source "./components"` and `@source "./unstable"`; removing that import removed the pointer.

The symptom was subtle and sidebar-specific: Flow's ghost icon button renders with `py-sm` in its class list. That class only appears inside `@flow/core/dist/components/button/…`, which was no longer being scanned. The rule `.py-sm { … }` was never generated, so the expanded SidebarTrigger collapsed to `40×16` (padding-top/bottom = 0). `px-sm` worked only because `SidebarContent.tsx` also uses it, which _was_ in the scan path.

**Fix**: re-add the Flow source dirs at the top of App.css.

```css
@source '../node_modules/@flow/core/dist/components';
@source '../node_modules/@flow/core/dist/unstable';
```

This is why the checklist at the bottom says: **don't assume a utility you see in the DOM has a matching CSS rule. JIT only generates what it can scan.**

### 3. Flow's typography tokens and utilities had to be re-shimmed

**Why**: `Typography` components (used by TooltipContent, SidebarHeader, SidebarItem labels) apply classes like `typography-body-sm`, `text-style-body-sm`, `leading-style-body-sm`, `font-style-body-sm`. These are hand-authored in `@flow/core/dist/styles.css` — not JIT utilities — so `@source` doesn't help. And they read from `--text-style-*`, `--leading-style-*`, etc. tokens that also lived in Flow's stylesheet.

Without them, all sidebar text fell back to browser defaults (16px / 400 / 24px line-height), making the tooltip text too large and the "Teacher Workspace" label too tall (which then threw off its absolute positioning in the header — see #4).

**Fix**: declare the tokens, then hand-author the handful of utility classes the Typography component emits, matched to Flow's real values (`body-sm` = 14/400/20, `label-md` = 16/400/16, `label-md-strong` = 16/600/16):

```css
--text-style-body-sm: 0.875rem;
--leading-style-body-sm: 20px;
/* …label-md, label-md-strong… */

.typography-body-sm { font-family: var(--font-family-style-body-sm); … }
.text-style-body-sm    { font-size:   var(--text-style-body-sm); }
.font-style-body-sm    { font-weight: var(--font-weight-style-body-sm); }
.leading-style-body-sm { line-height: var(--leading-style-body-sm); }
/* …repeat for label-md and label-md-strong… */
```

### 4. The foreground-contrast color had to be defined

**Why**: `TooltipContent` applies `bg-slate-12 text-foreground-contrast`. The `text-foreground-contrast` utility _was_ generated (it's used in Flow's compiled output, which is now being scanned via #2), but it resolves to `var(--color-foreground-contrast)` — a token Flow sets and the shim didn't. With no value, color inherited the page's dark slate-12 against the dark tooltip pill. Invisible text.

**Fix**: set it on `@theme inline`.

```css
--color-foreground-contrast: #ffffff;
--color-foreground-default: var(--slate-12);
```

### 5. SidebarItem needed a fixed height (`h-10 px-sm` instead of `p-sm`)

**Why**: once the spacing and typography were correct, a pre-existing layout bug in main became visible — **the item height changed between states.** With `p-sm` (12px all sides) and `align-items: stretch`:

- Collapsed (icon only, 16px) → `12 + 16 + 12 = 40px`
- Expanded (label with 24px line-height during motion, real 16px after) → `12 + 24 + 12 = 48px` mid-animation, then settles back

Every item grew mid-transition, causing an accumulated vertical drift. On main this is hidden by different animation timings and nobody's reported it, but here it was jarring.

**Fix**: swap padding-driven height for an explicit `h-10` and center content:

```diff
- 'flex cursor-pointer justify-start gap-x-xs rounded-lg p-sm …'
+ 'flex h-10 cursor-pointer items-center justify-start gap-x-xs rounded-lg px-sm …'
```

The `items-center` also fixes a related 4px icon-vs-label vertical misalignment inside each item. Same root cause — stretch alignment with content of different heights.

### 6. Sidebar border switched from `inset-shadow` to `border-r`

**Why**: unrelated to the shim, but worth documenting. Main paints the 1px divider with `inset-shadow-[0_0_0_1px] inset-shadow-slate-5` (an inset shadow that mimics a border on all four edges). The sidebar only shows one visible edge — the right one — so a plain `border-r` is simpler and semantically correct.

```diff
- 'relative hidden w-16 bg-slate-2 inset-shadow-[0_0_0_1px] inset-shadow-slate-5 …'
+ 'relative hidden w-16 border-r border-slate-5 bg-slate-2 …'
```

No visual difference, just cleaner.

## If you swap `@flow/core/tailwind.no-reset.css` again

The common thread across bugs 1–4 is that Flow's stylesheet is doing five different jobs at once. Dropping the import silently drops all five. Before declaring the shim done, verify:

- [ ] `--spacing-*` scale matches Flow's values exactly (0.25 / 0.5 / 0.75 / 1 / 1.5 rem).
- [ ] `--text-style-*`, `--leading-style-*`, `--font-weight-style-*`, `--font-family-style-*` tokens exist for every typography variant used (`body-sm`, `label-md`, `label-md-strong`, plus whatever else your screens touch).
- [ ] The matching `.typography-*`, `.text-style-*`, `.leading-style-*`, `.font-style-*`, `.font-family-style-*` utility classes are hand-authored — Tailwind JIT can't produce them.
- [ ] `--color-foreground-contrast` and `--color-foreground-default` are defined.
- [ ] `@source` directives cover every Flow `dist/` subfolder your app imports from (`components`, `unstable`, …).
- [ ] Inspect the expanded sidebar trigger — `40×40` means `py-sm` is resolving; `40×16` means `@source` is missing.
- [ ] Hover a collapsed nav item — white text on dark pill means `--color-foreground-contrast` is defined.
- [ ] Grep the built CSS (`.py-sm`, `.typography-body-sm`, etc.) — missing rule = missing shim entry.
