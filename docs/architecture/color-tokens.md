# Color tokens

Contract for color consumption across `web/`. This document is the source of
truth — the plan at
[`docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md`](../plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md)
captures the _migration_; this file captures the _policy_.

## Token layers

Three layers, declared in `web/App.css`:

```
Radix scales (raw hex)      :root — @import '@radix-ui/colors/{slate,blue,green,red,amber}.css'
         │                  :root — `--twblue-1..12` hex literals (brand scale)
         ▼
Shadcn semantic tokens      :root — `--background`, `--foreground`, `--primary`,
         │                         `--muted`, `--accent`, `--destructive`,
         │                         `--border`, `--input`, `--ring`,
         │                         `--sidebar{,-foreground,-primary,…}`
         ▼
Tailwind utility exports    @theme inline — `--color-background`, `--color-primary`,
                                   `--color-sidebar`, etc.
```

Call sites consume Tailwind utilities (`bg-background`, `text-muted-foreground`,
`bg-sidebar-accent`, `text-destructive`). They should **not** consume raw Radix
scales (`bg-slate-4`, `text-red-9`) unless the exemption registry authorizes it
(see below).

## Mapping decisions

Every semantic token maps to exactly one Radix step. These choices are
load-bearing — changing them shifts the whole app.

| Token                      | Radix ref    | Rationale                                                                                                                                                                                    |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--background`             | `--slate-1`  | Very subtle cool-tint wash; `--slate-1` is near-white with slate hue.                                                                                                                        |
| `--foreground`             | `--slate-12` | Radix scale's accessible-text step.                                                                                                                                                          |
| `--card`, `--popover`      | `#ffffff`    | Pure white surfaces lift from the slate-1 app background.                                                                                                                                    |
| `--card-foreground`        | `--slate-12` | Same text color as the rest of the app.                                                                                                                                                      |
| `--popover-foreground`     | `--slate-12` | Same text color as the rest of the app.                                                                                                                                                      |
| `--primary`                | `--twblue-9` | Brand scale's "solid fill" step.                                                                                                                                                             |
| `--primary-foreground`     | `#ffffff`    | White text on solid brand.                                                                                                                                                                   |
| `--secondary`              | `#ffffff`    | Used by outline/secondary button surfaces — matches cards.                                                                                                                                   |
| `--secondary-foreground`   | `--slate-12` | Text on secondary surfaces.                                                                                                                                                                  |
| `--muted`                  | `--slate-3`  | Subtle bg tint; Radix scale's "subtle bg" step.                                                                                                                                              |
| `--muted-foreground`       | `--slate-11` | Radix scale's accessible-text-on-bg step. For "faded" states (e.g. disabled button text) compose with a slash opacity — `text-muted-foreground/40` — rather than remapping the token itself. |
| `--accent`                 | `--slate-4`  | Slightly darker than muted — hover/active surface.                                                                                                                                           |
| `--accent-foreground`      | `--slate-12` | Text on accent surfaces.                                                                                                                                                                     |
| `--destructive`            | `--red-9`    | Radix scale's "solid fill" step for destructive.                                                                                                                                             |
| `--destructive-foreground` | `#ffffff`    | White text on solid destructive.                                                                                                                                                             |
| `--border`                 | `--slate-6`  | Radix scale's "non-interactive-border" step.                                                                                                                                                 |
| `--input`                  | `--slate-7`  | Radix scale's "interactive-border" step.                                                                                                                                                     |
| `--ring`                   | `--twblue-7` | Two steps lighter than primary — subtle focus ring.                                                                                                                                          |
| `--sidebar`                | `--slate-2`  | Lightest slate step — sidebar chrome.                                                                                                                                                        |
| `--sidebar-accent`         | `--slate-5`  | One step above `--accent` — sidebar select state.                                                                                                                                            |

## Shadcn v4 canonical token list

Verified against [ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming).
Every token we declare must appear in this list, and every token on this list
that we _don't_ declare should be explained.

### Core theme (18 tokens)

```
--background  --foreground
--card        --card-foreground
--popover     --popover-foreground
--primary     --primary-foreground
--secondary   --secondary-foreground
--muted       --muted-foreground
--accent      --accent-foreground
--destructive
--border  --input  --ring
```

### Chart (5 tokens)

`--chart-1` through `--chart-5`. **Not declared** in `App.css` — no charts in
the product today. Add when a chart component lands.

### Sidebar (8 tokens)

```
--sidebar                    --sidebar-foreground
--sidebar-primary            --sidebar-primary-foreground
--sidebar-accent             --sidebar-accent-foreground
--sidebar-border             --sidebar-ring
```

### Radius (8 tokens)

`--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`,
`--radius-2xl`, `--radius-3xl`, `--radius-4xl`. **Only `--radius` is declared**
in `App.css`. The rest are missing; consumers use ad-hoc arbitrary values
(`rounded-[var(--radius-input)]`) instead of the canonical `rounded-sm/md/lg/xl`
utilities. See "Known deviations" below.

### Tokens we declare that are NOT in the canonical list

| Declared                   | Status                        | Action                                                                                                                                                                               |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--destructive-foreground` | Not canonical                 | Retained as `#ffffff`; shadcn v4 only ships `--destructive`. Consumers that need white text on solid destructive bg use this locally. Candidate for removal if no consumer needs it. |
| `--radius-input`           | Not canonical (project value) | Maps to `14px` (which equals `--radius-xl` when `--radius: 0.625rem`). Candidate for replacement with canonical `rounded-xl` after adding the full radius family.                    |

No other project-invented tokens are declared.

### Why not invent tokens

- Matches upstream snippets: `npx shadcn@latest add <component>` slots in
  without remapping.
- Avoids `--success` / `--warning` / `--info` — shadcn explicitly does not
  ship these ([GH Discussion #8986](https://github.com/shadcn-ui/ui/discussions/8986)).
  We keep status colors raw + registered (see exemption policy below).
- Neither Radix nor shadcn ship `--white` or `--black` — pure white is
  written as the CSS literal `#ffffff` at the handful of consumers.
- Sidebar token set is a shadcn v4 addition; earlier versions used
  `--sidebar-background`. We use the current `--sidebar` name.

## Exemption policy

Raw Radix utilities (`bg-slate-4`, `text-green-10`, etc.) outside of
`web/App.css` and `web/containers/ComponentsView.tsx` (the palette demo) must
be registered in
[`scripts/raw-color-exemptions.txt`](../../scripts/raw-color-exemptions.txt)
with a reason. CI enforces this via `pnpm check:colors`
([`scripts/check-raw-colors.sh`](../../scripts/check-raw-colors.sh)), which
runs on every lint invocation.

Register an exemption when:

1. **No shadcn canonical mapping exists** — status colors
   (`--success`/`--warning`/`--info` don't exist), brand tints
   (`bg-twblue-{1-4}` has no `--primary-subtle`), in-between slate steps
   (`text-slate-9` sits between `--border` (slate-6) and `--muted-foreground`
   (slate-11)).
2. **The visual semantic is intentionally non-standard** — e.g.
   `PostPreview.tsx:28 border-slate-12` is a deliberate full-foreground
   border that doesn't fit `--border` (slate-6).

Do not register an exemption when:

- A direct migration exists. Use the mapping table below.
- You're writing new code that could use a semantic token.

### Direct-replace mapping table (use when migrating)

| Raw utility                          | Semantic utility                     | Notes                                        |
| ------------------------------------ | ------------------------------------ | -------------------------------------------- |
| `text-slate-11`                      | `text-muted-foreground`              |                                              |
| `text-slate-12`                      | `text-foreground`                    |                                              |
| `bg-slate-12`                        | `bg-foreground`                      | e.g. tooltip bg.                             |
| `bg-slate-3`                         | `bg-muted`                           |                                              |
| `bg-slate-4`                         | `bg-accent`                          | Non-sidebar call sites only (see below).     |
| `border-slate-6`                     | `border-border`                      |                                              |
| `outline-slate-6`                    | `outline-border`                     |                                              |
| `border-slate-7`                     | `border-input`                       |                                              |
| `bg-twblue-9`                        | `bg-primary`                         |                                              |
| `text-twblue-9`                      | `text-primary`                       |                                              |
| `ring-twblue-8`                      | `ring-ring`                          |                                              |
| `bg-slate-2`                         | `bg-sidebar`                         | Sidebar chrome only.                         |
| `border-slate-5`                     | `border-sidebar-border`              | Sidebar chrome only.                         |
| `hover:bg-slate-4`                   | `hover:bg-sidebar-accent/60`         | Sidebar-only hover tier.                     |
| `bg-slate-5` (active)                | `bg-sidebar-accent`                  | Sidebar select/active state.                 |
| `text-red-9/10`                      | `text-destructive`                   | Error/danger intent. Not for non-error reds. |
| `bg-red-3 text-red-11` (error badge) | `bg-destructive/10 text-destructive` | Check WCAG AA on the `/10` pair.             |

### Decorative `bg-slate-4` split

`bg-slate-4` has two migration targets depending on shape role:

- **Filled shapes** (skeleton bars, drag handles, decorative surfaces) →
  `bg-accent`. Examples: `PostTypePicker.tsx` skeletons,
  `entity-selector.tsx:777` drag handle.
- **Thin dividers / separators** → `bg-border` (slate-6, darker — matches
  border-weight styling). Example: `RichTextToolbar.tsx:58` vertical divider.

A filled skeleton using `bg-border` would be too dark; a divider using
`bg-accent` would be too faint. Pick based on visual weight.

## No invented tokens

The project lead has set a firm constraint: **use shadcn v4 canonical tokens
only; do not introduce project-local semantic tokens** (e.g. no `--success`,
`--warning`, `--info`, `--surface-muted`, `--primary-subtle`, `--white`, etc.).

Neither Radix nor shadcn publishes a `--white` variable — white is written as
the CSS literal `#ffffff` at the handful of consumers that need it
(`--card`, `--popover`, `--primary-foreground`, `--secondary`,
`--destructive-foreground`, `--sidebar-primary-foreground`).

When a recurring exemption pattern (3+ call sites of the same raw ref) appears,
it is **tracked, not graduated**. The registry header in
[`scripts/raw-color-exemptions.txt`](../../scripts/raw-color-exemptions.txt)
lists the patterns. Resolving them requires either (a) accepting a visual
shift to the nearest canonical token, or (b) an explicit project-lead decision
to override the no-new-tokens constraint. Default: accept the exemption.

Current patterns at or above the threshold (intentionally not graduated):

- **Status colors** (green/amber/blue) — ~11 exemptions. No shadcn canonical;
  raw refs remain. `red-*` destructive intent already migrates to
  `--destructive`.
- **`bg-twblue-{1-4}` brand tints** — ~5 exemptions in `entity-selector.tsx`.
  No `--primary-subtle` in shadcn; raw refs remain.
- **Sidebar-color surfaces outside `Sidebar/`** — 3 exemptions
  (`RichTextToolbar.tsx:135`, `entity-selector.tsx:221,:556`). Option B
  (`bg-muted`, slate-3) visibly darkens these surfaces and was rejected;
  raw refs remain.

## Upgrade process

When shadcn v5 (or later) adds or renames canonical tokens:

1. Read the shadcn changelog and identify adds/renames.
2. Add the new token declarations to `:root` and `@theme inline`, mapped to
   Radix.
3. Migrate consumers — follow the direct-replace table pattern.
4. Update this document's mapping table.
5. Run `pnpm check:colors` + `pnpm build` + visual QA.

## Sidebar coupling

The `--sidebar-*` tokens are only meaningful while `web/components/Sidebar/*`
references them. Tailwind v4 JIT tree-shakes utilities, not var declarations,
so a full Sidebar revert leaves `--color-sidebar-*` entries in the shipped CSS
as dead bytes. **Revert policy:** if you remove all Sidebar consumers, also
remove the sidebar token block from `App.css`.

## References

- Plan:
  [`docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md`](../plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md)
- Shadcn theming: https://ui.shadcn.com/docs/theming
- Shadcn Sidebar: https://ui.shadcn.com/docs/components/sidebar
- Radix Colors: https://www.radix-ui.com/colors
- Tailwind v4 `@theme`: https://tailwindcss.com/docs/theme
