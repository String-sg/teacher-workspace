# Sidebar parity between `main` and `feat/posts-frontend`

Post-mortem and reference for the sidebar rendering drift introduced when
`feat/posts-frontend` swapped `@flow/core/tailwind.no-reset.css` for a local
Flow-compat shim in [web/App.css](../web/App.css), and the fixes required to
bring it back to parity with `main`.

## Summary of the diff vs `main`

Sidebar component files are structurally identical — only two files changed
(plus the CSS). All visible differences trace back to the App.css swap.

| File                                                                                | Change                                                                  | Reason                                                    |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| [web/components/Sidebar/Sidebar.tsx](../web/components/Sidebar/Sidebar.tsx)         | cosmetic class reorder (oxfmt)                                          | no behavior change                                        |
| [web/components/Sidebar/SidebarItem.tsx](../web/components/Sidebar/SidebarItem.tsx) | `p-sm` → `h-10 items-center px-sm`                                      | fixed-height items + vertical centering (see bug 3 below) |
| [web/App.css](../web/App.css)                                                       | replaced `@import '@flow/core/tailwind.no-reset.css'` with a local shim | design intent — rebase colors on Radix + shadcn tokens    |

Unchanged on this branch: `SidebarHeader.tsx`, `SidebarContent.tsx`,
`SidebarFooter.tsx`, `SidebarTrigger.tsx`, `context.ts`, `SidebarProvider.tsx`.

## Symptoms seen on `feat/posts-frontend` before the fixes

1. Collapsed sidebar icons sat in tighter boxes than on main.
2. Expanded sidebar trigger button collapsed to `40×16` (vertical padding = 0).
3. Nav-item icons sat 4 px above their labels.
4. Item heights grew by 8 px when expanding, causing a layout shift.
5. Tooltip pill rendered with invisible text (dark on dark).
6. Tooltip / nav-item / header-label typography rendered at the wrong size
   and weight.

## Root causes and fixes (all in `web/App.css`)

### 1. Spacing scale was off by one step

The shim originally defined:

```css
@theme inline {
  --spacing-2xs: 0.125rem; /* should be 0.25rem */
  --spacing-xs: 0.25rem; /* should be 0.5rem  */
  --spacing-sm: 0.5rem; /* should be 0.75rem */
  --spacing-md: 1rem; /* ok */
  --spacing-lg: 1.5rem; /* ok */
}
```

Every value was shifted down one step relative to Flow's canonical scale.
Everything using `p-sm`, `px-sm`, `gap-y-xs`, `p-2xs`, etc. rendered tighter
than on main.

**Fix**: restore Flow's canonical values — `0.25 / 0.5 / 0.75 / 1 / 1.5 rem`.

### 2. Tailwind wasn't scanning Flow's compiled components

The removed `@flow/core/tailwind.no-reset.css` contained:

```css
@source "./components";
@source "./unstable";
```

Tailwind v4 does not scan `node_modules/` by default. Without those
directives, utility classes that appear only inside Flow's compiled JS
(e.g. `py-sm` on Button, `gap-xs` on slot wrappers) were never discovered,
so `.py-sm { … }` was never generated.

Result: Flow's ghost icon button kept `py-sm` in its class list, but the
CSS rule didn't exist — the expanded trigger was 16 px tall instead of 40.
`px-sm` worked because it's also used in local `web/` files (`SidebarContent`),
so Tailwind still generated it.

**Fix**: add the `@source` directives at the top of `App.css`:

```css
@source '../node_modules/@flow/core/dist/components';
@source '../node_modules/@flow/core/dist/unstable';
```

### 3. Two pre-existing vertical-alignment bugs, exposed

These exist on main too but were masked by the wrong spacing values. Once
padding returned to Flow's real scale, the 4 px misalignments became visible:

- **[SidebarItem.tsx](../web/components/Sidebar/SidebarItem.tsx)** — the link
  used `flex justify-start` with no `items-*`. Default `align-items: stretch`
  pinned both the 16 px icon and 24 px-line-height label to the top of the
  content area, so icon center landed 4 px above label center.
  **Fix**: add `items-center`.

- **[SidebarItem.tsx](../web/components/Sidebar/SidebarItem.tsx)** — item
  height derived from content: collapsed (icon only, 16 px) → `12 + 16 + 12 = 40 px`,
  expanded (label, 24 px line-height) → `12 + 24 + 12 = 48 px`. That 8 px
  growth per item caused a layout shift between states.
  **Fix**: swap `p-sm` for `h-10 px-sm` — fixed 40 px height, content
  vertically centered by `items-center`.

`SidebarHeader.tsx` didn't need a change once typography was correct; the
original `top-5 left-3 p-2xs` positioning centers the label on the
`label-md-strong` variant's real 16 px line-height.

### 4. Tooltip text was invisible

Flow's `TooltipContent` renders with `text-foreground-contrast`, which reads
`var(--color-foreground-contrast)`. The shim didn't define that token, so
the CSS property had no value and text inherited the page's dark slate-12
color against the dark `bg-slate-12` pill — invisible.

**Fix**: define Flow-compat foreground tokens in `@theme inline`:

```css
--color-foreground-contrast: #ffffff;
--color-foreground-default: var(--slate-12);
```

### 5. Typography utilities weren't loaded

Flow's typography utilities (`typography-body-sm`, `text-style-body-sm`,
`leading-style-body-sm`, `font-style-body-sm`, plus `label-md`/`label-md-strong`)
are defined in `@flow/core/dist/styles.css` and read from CSS vars like
`--text-style-body-sm`. Neither the rules nor the vars existed in the shim.
Adding `@source` didn't help because these rules are hand-authored CSS, not
JIT-derived utilities.

**Fix**: define the tokens and four utility-class pairs in the shim so
`Typography variant="body-sm" | "label-md" | "label-md-strong"` resolves to
the same values as `main` (14/400/20, 16/400/16, 16/600/16 respectively).

```css
@theme inline {
  --font-family-style-body-sm: ui-sans-serif, system-ui, sans-serif;
  --text-style-body-sm: 0.875rem;
  --font-weight-style-body-sm: 400;
  --leading-style-body-sm: 20px;
  /* …label-md, label-md-strong… */
}

.typography-body-sm {
  font-family: var(--font-family-style-body-sm);
  font-size: var(--text-style-body-sm);
  font-weight: var(--font-weight-style-body-sm);
  line-height: var(--leading-style-body-sm);
}
/* …one three-property helper per size for the Typography slot classes… */
```

## Sidebar border: `inset-shadow` → `border-r`

Separate from the shim, the sidebar now uses a plain right border instead of
the `inset-shadow-[0_0_0_1px]` trick main uses:

```diff
- 'relative hidden w-16 bg-slate-2 inset-shadow-[0_0_0_1px] inset-shadow-slate-5 …'
+ 'relative hidden w-16 border-r border-slate-5 bg-slate-2 …'
```

Cleaner semantics, no behavior difference on the visible edge.

## Why `px-sm` worked but `py-sm` didn't

Both utilities are generated from the same `--spacing-sm` token, so the shifted
value wasn't the issue for the trigger button. The failure was **generation**,
not resolution — Tailwind JIT only generates utilities it can find in
scanned files. Any utility referenced only inside an installed package's
compiled output requires an explicit `@source` pointer. `px-sm` survived
because it also lived in `web/components/Sidebar/SidebarContent.tsx`.

## Checklist if you replace `@flow/core/tailwind.no-reset.css` again

- [ ] Copy the `--spacing-*` scale exactly — don't re-derive or renumber.
- [ ] Copy the `--text-style-*`, `--leading-style-*`, `--font-weight-style-*`,
      `--font-family-style-*` tokens for every typography variant your app
      uses (`body-sm`, `label-md`, `label-md-strong`, and whatever else).
- [ ] Copy the accompanying `.typography-*`, `.text-style-*`,
      `.leading-style-*`, `.font-style-*`, `.font-family-style-*` utility
      classes — Tailwind JIT can't produce these.
- [ ] Define `--color-foreground-contrast` and `--color-foreground-default`
      (at minimum) so Tooltip / Button text has the correct color.
- [ ] Add `@source` directives for every Flow dist subfolder your app uses
      (`components`, `unstable`, and any others).
- [ ] Grep the built CSS for utilities you expect (`.py-sm`, `.gap-xs`, etc.).
      Missing rule = missing source scan.
- [ ] Verify on the expanded sidebar header specifically — the trigger
      button height is a good canary for missing `py-*` rules.
