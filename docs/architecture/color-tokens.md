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

| Token                    | Radix ref          | Rationale                                         |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `--background`           | `--white` (`#fff`) | Light-only; dark mode sweeps via `--white`.       |
| `--foreground`           | `--slate-12`       | Radix scale's accessible-text step.               |
| `--muted`, `--secondary` | `--slate-3`        | Subtle bg tint; Radix scale's "subtle bg" step.   |
| `--muted-foreground`     | `--slate-11`       | Radix scale's accessible-text-on-bg step.         |
| `--accent`               | `--slate-4`        | Slightly darker than muted — hover/active surf.   |
| `--border`               | `--slate-6`        | Radix scale's "non-interactive-border" step.      |
| `--input`                | `--slate-7`        | Radix scale's "interactive-border" step.          |
| `--primary`              | `--twblue-9`       | Brand scale's "solid fill" step.                  |
| `--ring`                 | `--twblue-8`       | One step lighter for focus — standard pairing.    |
| `--destructive`          | `--red-9`          | Radix scale's "solid fill" step for destructive.  |
| `--sidebar`              | `--slate-2`        | Lightest non-white — sidebar chrome.              |
| `--sidebar-accent`       | `--slate-5`        | One step above `--accent` — sidebar select state. |

## Why shadcn v4 canonical

- Matches upstream snippets: `npx shadcn@latest add <component>` slots in without
  remapping tokens.
- Avoids inventing `--success` / `--warning` / `--info` — shadcn explicitly does
  not ship these ([GH Discussion #8986](https://github.com/shadcn-ui/ui/discussions/8986)).
  We keep status colors raw + registered (see exemption policy below).
- Sidebar token set (8 tokens) is a shadcn v4 addition; earlier versions used
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

## Graduation rule

If an exempt pattern appears at **3 or more call sites**, open a follow-up to
evaluate promoting it to a project-local semantic token. Current patterns
over the threshold (tracked as follow-ups):

- Status colors (green/amber/blue) — ~11 exemptions. No canonical shadcn
  mapping; deliberately not graduated per the "no invented tokens" policy.
- `bg-twblue-{1-4}` brand tints — ~5 exemptions in
  `entity-selector.tsx`. Candidate for `--primary-subtle` if the "no
  invented tokens" constraint ever relaxes.
- Sidebar-color surfaces outside `Sidebar/` — 3 exemptions
  (`RichTextToolbar.tsx:135`, `entity-selector.tsx:221,:556`). Candidate for
  `--surface-muted`.

Decision authority for graduation lives with the project lead.

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
