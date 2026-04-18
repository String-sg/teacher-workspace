---
title: 'refactor: Consolidate color refs behind shadcn semantic tokens'
type: refactor
status: completed
date: 2026-04-18
deepened: 2026-04-18
---

# refactor: Consolidate color refs behind shadcn semantic tokens

## Enhancement Summary

**Deepened on:** 2026-04-18
**Sections enhanced:** Overview, Token additions, Phase 2/3/4 tables, Risks, Acceptance criteria, Sources
**Research agents used:** framework-docs-researcher, repo-research-analyst, architecture-strategist, performance-oracle, code-simplicity-reviewer, pattern-recognition-specialist, design-implementation-reviewer

### Key improvements (material changes)

1. **Ref count corrected: 66 → 86.** Repo analyst re-audit found 20 refs the session grep missed (StatusBadge counted className-strings not utilities; RichTextToolbar undercounted 2; ReadTrackingCards 1; PostsView 2). All acceptance criteria updated.
2. **Tree-shaking claim corrected.** Tailwind v4 tree-shakes **utility classes**, not `--color-*` declarations in `:root`. Token-decl bytes ship regardless; only `bg-sidebar`-style utilities get pruned. `@theme static { ... }` is the escape hatch if Phase 1 must ship alone.
3. **Sidebar hover/selected: new preferred approach.** Architecture reviewer: font-weight-only differentiation fails WCAG 1.4.1 for low-vision users. Replaced with `bg-sidebar-accent/60` (hover) + `bg-sidebar-accent` (selected). Opacity-off-canonical-token keeps two-tier + stays token-pure.
4. **shadcn canonical attribute corrected.** shadcn's SidebarMenuButton uses `data-[active=true]` + `aria-current="page"`, not `data-[selected=true]`. Plan now requires renaming the attribute in `SidebarItem.tsx` as part of Phase 4.
5. **Pre-plan button.tsx fix flagged as a bug.** `disabled:text-slate-8` → `text-muted-foreground` (slate-11) is NOT pixel-identical; slate-8 is darker. Added **Phase 0: audit + correct** to the plan.
6. **File-based exemption registry** replaces comment allowlist. `scripts/raw-color-exemptions.txt` is committed, blame-able, reviewable. Comment form rot is the #1 risk flagged by architecture + pattern agents.
7. **Additional unplanned refs surfaced:** `CreatePostView.tsx` red asterisks (destructive), `PostsView.tsx` amber warnings (status-no-token), `PostPreview.tsx` border-slate-12 (no mapping), `RichTextToolbar.tsx:135 bg-slate-2` (sidebar chrome outside sidebar), entity-selector's 18 refs are mostly twblue tints (no canonical mapping — Phase 2 over-promised).
8. **Scope fork added (Option A / Option B).** Simplicity reviewer argues the full plan is over-engineered; recommend presenting Option B (minimal cut) as a shippable alternative.

### New considerations discovered

- Shadcn v4 renamed `--sidebar-background` → `--sidebar` in 2025 — contributors copying from old tutorials will mismatch; add inline note.
- `font-medium` on selected items triggers glyph-advance reflow — mitigate with `letter-spacing` compensation or bold-invisible spacer.
- Dead `dark:` classes in `web/components/ui/{tabs,button,badge}.tsx` — separate cleanup, flagged as follow-up.
- Pattern drift risk: Phase 2's "`bg-slate-4` → `bg-accent`" rule blindly applied to sidebar chrome would break the isolated sidebar palette. Table now carries a non-sidebar carve-out.

---

## Scope Options

Two shippable cuts. Pick one before implementation.

### Option A — Full plan (this document, all 5 phases + Phase 0 audit)

Ships: Phase 0 (button audit) + Phase 1 (sidebar tokens in App.css) + Phase 2 (direct-replace, non-sidebar) + Phase 3 (destructive only) + Phase 4 (sidebar migration to canonical tokens with `/60` hover) + Phase 5 (CI guard via file-based exemption registry). Delivers full shadcn canonical alignment including sidebar; lets upstream `shadcn add sidebar` snippets slot in cleanly.

**Size:** ~8 files edited in App.css + Sidebar/, plus annotation comments in 6 feature files. One PR for Phase 1 + Phase 4 (tree-shaking forces bundling), one PR for Phase 2 + Phase 3, one PR for Phase 5.

### Option B — Minimal cut (recommended by simplicity reviewer)

Ships: Phase 0 (button audit) + Phase 2 (direct-replace) + narrow Phase 3 (red-\* destructive only). Skips sidebar tokens, skips CI guard, skips annotation system. Sidebar and status stay raw.

**Trade-off:** no shadcn-canonical sidebar alignment (can't drop-in shadcn's Sidebar component without work later); no automated guard against future drift. But delivers ~90% of the semantic-token value in one PR with zero UX risk. Add one CLAUDE.md line: "prefer shadcn tokens; raw Radix OK in `StatusBadge.tsx`, `RecipientReadTable.tsx`, `Sidebar/*`, `entity-selector.tsx` for states without canonical tokens."

**Recommendation for this plan:** commit to **Option A** (default) but treat it as sequenced PRs so Option B's value ships first and Phase 1 + Phase 4 land only if post-Phase-2 QA looks clean.

---

## Overview

86 raw Radix color references span 18 files across `web/` (repo analyst, 2026-04-18 re-audit). They bypass the shadcn semantic token layer already defined in `web/App.css`. This plan routes call sites through **only shadcn-canonical tokens** — no project-invented tokens — and accepts that call sites with no canonical token mapping stay raw and are explicitly documented via a committed exemption registry.

Constraint reinforced by the user on 2026-04-18: **do not invent new tokens.** Only shadcn defaults are allowed. That rules out `--success`, `--warning`, `--info`, or any custom `--sidebar-*` names not in shadcn v4's canonical list.

## Problem Statement / Motivation

Re-audit of `(bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|placeholder|accent|caret)-(slate|twblue|blue|green|red|amber)-[0-9]+` returns **86 matches across 18 files** (up from 66 in the original session count). Difference came from counting className-strings rather than utility refs in `StatusBadge.tsx` (4 → 8), missed utilities in `RichTextToolbar.tsx` (4 → 6) and `ReadTrackingCards.tsx` (2 → 3), and `PostsView.tsx` amber refs (2 listed correctly but intent mis-labeled as Phase 2).

**Shadcn v4 canonical tokens** (the full set we're allowed to consume, confirmed by framework-docs-researcher against 2026 docs):

| Chrome                 | Status                   | Sidebar                      | Chart     |
| ---------------------- | ------------------------ | ---------------------------- | --------- |
| `background`           | `destructive`            | `sidebar`\*                  | `chart-1` |
| `foreground`           | `destructive-foreground` | `sidebar-foreground`         | `chart-2` |
| `card`                 |                          | `sidebar-primary`            | `chart-3` |
| `card-foreground`      |                          | `sidebar-primary-foreground` | `chart-4` |
| `popover`              |                          | `sidebar-accent`             | `chart-5` |
| `popover-foreground`   |                          | `sidebar-accent-foreground`  |           |
| `primary`              |                          | `sidebar-border`             |           |
| `primary-foreground`   |                          | `sidebar-ring`               |           |
| `secondary`            |                          |                              |           |
| `secondary-foreground` |                          |                              |           |
| `muted`                |                          |                              |           |
| `muted-foreground`     |                          |                              |           |
| `accent`               |                          |                              |           |
| `accent-foreground`    |                          |                              |           |
| `border`               |                          |                              |           |
| `input`                |                          |                              |           |
| `ring`                 |                          |                              |           |

\* Shadcn renamed `--sidebar-background` → `--sidebar` in 2025. Older tutorials still reference the old name; flag this in a comment near the Phase 1 block.

**Key gaps this plan exposes but will not plug:**

- **No `--success`, `--warning`, `--info` tokens exist in shadcn** (maintainer stance per GH Discussion [#8986](https://github.com/shadcn-ui/ui/discussions/8986): intentional — "success green varies wildly between brands"). Status badges using green/amber/blue have no shadcn home and remain raw.
- **Sidebar has one accent tier** (`--sidebar-accent`). Current sidebar uses `slate-4` (hover) and `slate-5` (selected) — distinct shades. Shadcn's canonical Sidebar uses `bg-sidebar-accent` + `font-medium` for differentiation. **This plan uses opacity instead**: `hover:bg-sidebar-accent/60` + `data-[active=true]:bg-sidebar-accent` preserves two-tier visual without inventing tokens.
- **twblue-{1,2,3,4} tints** (decorative brand tints in `entity-selector.tsx` and `ReadTrackingCards.tsx`) have no canonical token. `bg-primary/10` is the nearest approximation but couples all brand-tinted UI to the brand color. Plan: stays raw + registered in exemptions file.
- **slate-8 / slate-9** have no shadcn token between `border` (slate-6) and `muted-foreground` (slate-11). Pre-plan `button.tsx` fix was wrong here (see Phase 0).

## Proposed Solution

**Six phases total, ordered low-risk → high-risk:**

### Phase 0 — Audit and correct the pre-plan button.tsx fix (MUST RUN FIRST)

Pre-plan session changed `web/components/ui/button.tsx:13`:

```
Before: disabled:bg-slate-3 disabled:text-slate-8
After:  disabled:bg-muted disabled:text-muted-foreground
```

**`bg-slate-3` → `bg-muted` is correct** (`--muted: slate-3`). **`text-slate-8` → `text-muted-foreground` is NOT pixel-identical** — `--muted-foreground` is `slate-11`, which is meaningfully darker than `slate-8` (disabled text now reads too strong).

**Action:** inspect disabled button visuals, decide:

1. **Accept the shift** (if the darker disabled text is actually preferable — document the rationale).
2. **Revert** to raw: keep `disabled:text-slate-8` + add to exemption registry.
3. **Pick a closer semantic token** — there isn't one between `border` (slate-6) and `muted-foreground` (slate-11); revert is the only faithful option.

Default: **Option 2 (revert + register exemption)**. Flag as an acceptance-criteria item.

### Phase 1 — Extend `App.css` with shadcn-canonical sidebar tokens

Add to `:root` in `web/App.css`, mapping to existing Radix scales:

```css
/* Sidebar — shadcn v4 canonical token set. No renames, no additions.
   NOTE: shadcn renamed `--sidebar-background` → `--sidebar` in 2025. */
--sidebar: var(--slate-2);
--sidebar-foreground: var(--slate-12);
--sidebar-primary: var(--twblue-9);
--sidebar-primary-foreground: #ffffff;
--sidebar-accent: var(--slate-5); /* one accent tier — see Phase 4 for two-tier via /60 opacity */
--sidebar-accent-foreground: var(--slate-12);
--sidebar-border: var(--slate-5);
--sidebar-ring: var(--twblue-8);
```

Expose via the existing `@theme inline` block:

```css
--color-sidebar: var(--sidebar);
--color-sidebar-foreground: var(--sidebar-foreground);
--color-sidebar-primary: var(--sidebar-primary);
--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
--color-sidebar-accent: var(--sidebar-accent);
--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
--color-sidebar-border: var(--sidebar-border);
--color-sidebar-ring: var(--sidebar-ring);
```

**Tree-shaking correction** (performance-oracle): Tailwind v4 tree-shakes **utility classes**, not `--color-*` variable declarations. The `:root` block ships 8 extra CSS lines (~400 bytes gzipped) regardless. Only utilities like `bg-sidebar` are gated on source usage. Net bundle delta from this plan: the preceding session removed the Radix alpha imports (−~120 lines); this adds ~16 lines → **net −~104 lines / −~2–3 KB gzipped**.

**Phase 1 + Phase 4 must ship together** only because without consumers, no `bg-sidebar` utility is emitted — the vars are dead until used. Escape hatch if splitting is ever needed: `@theme static { ... }` forces emission regardless, at the cost of tree-shaking.

### Phase 2 — Direct-replace refs that already have a shadcn token

Pure find-and-replace; no token additions needed. **Non-sidebar call sites only** — sidebar files handled in Phase 4.

| Raw               | Semantic                | Backed by                      | Notes                |
| ----------------- | ----------------------- | ------------------------------ | -------------------- |
| `text-slate-11`   | `text-muted-foreground` | `--muted-foreground: slate-11` |                      |
| `text-slate-12`   | `text-foreground`       | `--foreground: slate-12`       |                      |
| `bg-slate-12`     | `bg-foreground`         | (tooltip bg — `constants.ts`)  |                      |
| `bg-slate-3`      | `bg-muted`              | `--muted: slate-3`             |                      |
| `bg-slate-4`      | `bg-accent`             | `--accent: slate-4`            | **non-sidebar only** |
| `border-slate-6`  | `border-border`         | `--border: slate-6`            |                      |
| `outline-slate-6` | `outline-border`        | `--border: slate-6`            |                      |
| `border-slate-7`  | `border-input`          | `--input: slate-7`             |                      |
| `bg-twblue-9`     | `bg-primary`            | `--primary: twblue-9`          |                      |
| `text-twblue-9`   | `text-primary`          | `--primary: twblue-9`          |                      |
| `ring-twblue-8`   | `ring-ring`             | `--ring: twblue-8`             |                      |

**No canonical mapping — stays raw + registered in `scripts/raw-color-exemptions.txt`:**

- `slate-8`, `slate-9` — no shadcn step between border (slate-6) and muted-foreground (slate-11)
- `twblue-{1,2,3,4}` — brand tints (entity-selector hover/selected, ReadTrackingCards bg)
- `border-slate-12` — intentional high-contrast border in `PostPreview.tsx:28`

### Phase 3 — Destructive-only status migration

Only `--destructive` exists in shadcn. Scope narrowly:

| Raw                                          | Semantic                             | Call sites                                                 |
| -------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `bg-red-3 text-red-11` (error badge)         | `bg-destructive/10 text-destructive` | `RecipientReadTable.tsx:123`                               |
| `text-red-9` (error icon, required asterisk) | `text-destructive`                   | `RecipientReadTable.tsx:109`, `CreatePostView.tsx:483,549` |
| `text-red-10`                                | `text-destructive`                   | `SchedulePickerDialog.tsx:172`                             |
| `bg-red-9`                                   | `bg-destructive`                     | (none found in current refs)                               |

**Visual regression warning** (design reviewer): `red-3 ≈ #ffefef` (solid pinkish tint) vs `destructive/10 ≈ #fce6e7` (10% alpha on red-9 solid). The new bg is **lighter and less saturated**; paired with `text-destructive` (`red-9 ≈ #e5484d`, slightly lighter than `red-11`), contrast drops perceptibly. **Mitigation path:** if screenshot diff shows meaningful shift, escalate to `bg-destructive/15` then `/20`. Acceptance criterion includes WCAG AA contrast verification.

**Explicitly out of scope** (stays raw + registered in exemptions):

- `bg-green-3 text-green-11` — "Posted" success badge. No shadcn token.
- `bg-blue-3 text-blue-11` — "Scheduled" / "Posting" info badges. No shadcn token.
- `bg-amber-3 text-amber-11` / `text-amber-10` — warning states. No shadcn token.
- `text-green-10` (check icon), `text-green-11` — success indicators. No shadcn token.
- `PostsView.tsx:196,211` amber refs — warning state.

### Phase 4 — Migrate Sidebar to canonical tokens

**Critical correction from pattern-recognition agent:** shadcn's canonical SidebarMenuButton uses `data-[active=true]` with `aria-current="page"`, NOT `data-[selected=true]`. Phase 4 must rename the attribute for true canonical alignment.

| Raw                                         | Semantic                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `bg-slate-2` (container)                    | `bg-sidebar`                                                                 |
| `border-slate-5` (container border)         | `border-sidebar-border`                                                      |
| `text-slate-11` (icon color in SidebarItem) | `text-muted-foreground` OR `text-sidebar-foreground` (pick one and document) |
| `text-slate-12` (label)                     | `text-sidebar-foreground`                                                    |
| `hover:bg-slate-4` (item hover)             | `hover:bg-sidebar-accent/60`                                                 |
| `active:bg-slate-5`                         | `active:bg-sidebar-accent`                                                   |
| `data-[selected=true]:bg-slate-5`           | `data-[active=true]:bg-sidebar-accent`                                       |
| `data-[selected=true]:hover:bg-slate-5`     | `data-[active=true]:hover:bg-sidebar-accent`                                 |

**Preferred two-tier strategy** (architecture-strategist recommendation): use **opacity-off-canonical-token** to preserve the current lighter-hover / darker-selected distinction without inventing tokens and without relying on font-weight-only differentiation.

```
hover (not selected):  bg-sidebar-accent/60   (≈ slate-5 at 60% ≈ lighter tone)
selected (default):    bg-sidebar-accent      (= slate-5)
selected + hover:      bg-sidebar-accent      (no further darken; shadcn canonical)
```

This restores the visual two-tier while every class still composes off `--sidebar-accent`. **A11y win over font-weight-only** per architecture reviewer (font-weight as sole signal fails WCAG 1.4.1 for low-vision users).

**Also rename the selection attribute:** `data-[selected=true]` → `data-[active=true]`, and add `aria-current="page"` to selected items (matches shadcn's canonical markup). This is a non-trivial change in `SidebarItem.tsx` + any CSS consumers.

**Reflow mitigation:** if font-weight differentiation is additionally desired, add `letter-spacing: -0.01em` (or render invisible bold to reserve width) so weight change doesn't nudge adjacent labels.

**Semantic-bleed surprise:** `RichTextToolbar.tsx:135` uses `bg-slate-2` — identical color to sidebar chrome but in a toolbar. Options: (a) migrate to `bg-sidebar` (accepts semantic bleed), (b) migrate to `bg-muted` (flatten — may not match visually), (c) stay raw + register. **Recommend (c)** to keep `--sidebar` scoped to the actual sidebar.

### Phase 5 — Prevent regressions via file-based exemption registry

**Architecture reviewer pushback:** comment-based allowlists rot. Switch to a committed, reviewable exemption file.

#### `scripts/raw-color-exemptions.txt`

```
# Format: <relative-path>:<line> <pattern> # <reason>
# Exact-line allowlist for raw Radix refs. New entries require PR review.
web/components/posts/StatusBadge.tsx:8 bg-green-3 text-green-11 # Posted — no shadcn --success
web/components/posts/StatusBadge.tsx:12 bg-blue-3 text-blue-11 # Scheduled — no shadcn --info
web/components/posts/StatusBadge.tsx:16 bg-blue-3 text-blue-11 # Posting — no shadcn --info
web/components/posts/RecipientReadTable.tsx:89 text-green-10 # check icon — no shadcn --success
web/components/posts/RecipientReadTable.tsx:94 text-amber-10 # warning icon — no shadcn --warning
web/components/posts/RecipientReadTable.tsx:107 text-green-10 # check — no shadcn --success
web/components/posts/RecipientReadTable.tsx:121 bg-green-3 text-green-11 # Yes badge — no --success
web/containers/PostsView.tsx:196 text-amber-9 # warning — no --warning
web/containers/PostsView.tsx:211 text-amber-10 # warning — no --warning
web/components/posts/PostPreview.tsx:28 border-slate-12 # intentional full-foreground border
web/components/posts/RichTextToolbar.tsx:135 bg-slate-2 # sidebar-color bleed — decline to migrate
# ... extend as audit progresses
```

#### `scripts/check-raw-colors.sh`

```sh
#!/bin/sh
# Requires ripgrep (`rg`) — 3–5× faster than grep on the repo.
# Flags any raw Radix ref not registered in raw-color-exemptions.txt.
set -eu

ALLOWLIST=scripts/raw-color-exemptions.txt
MATCHES=$(rg --line-number \
  '(bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|placeholder|accent|caret)-(slate|twblue|blue|green|red|amber)-[0-9]+' \
  web/ \
  --glob '!web/App.css' \
  --glob '!web/containers/ComponentsView.tsx')

# Filter out exempted lines (path:line pairs)
ALLOW_PATHS=$(cut -d' ' -f1 "$ALLOWLIST" | grep -v '^#' | sort -u)
VIOLATIONS=$(echo "$MATCHES" | while IFS=: read -r path line _; do
  if ! echo "$ALLOW_PATHS" | grep -qx "$path:$line"; then
    echo "$path:$line"
  fi
done)

if [ -n "$VIOLATIONS" ]; then
  echo "Raw Radix refs outside exemption registry:"
  echo "$VIOLATIONS"
  echo
  echo "If intentional, add a line to $ALLOWLIST with format:"
  echo "  <path>:<line> <pattern> # <reason>"
  exit 1
fi
```

Wire into `package.json`: `"check:colors": "sh scripts/check-raw-colors.sh"`, and include in the `lint` script.

**Why file-based beats inline comments:**

- Centralized, blame-able, diff-reviewable.
- No regex fragility parsing source comments.
- Adding an exemption requires a PR; easy to see the growing allowlist as a signal of policy failure.
- Git blame tells you who approved each exemption.

## Technical Considerations

- **Architecture impacts:** none beyond CSS var plumbing.
- **Performance implications:**
  - CSS bundle: **net −~2–3 KB gzipped** (alpha-scale import removal > sidebar token additions).
  - 3-deep `var(--color-sidebar) → var(--sidebar) → var(--slate-2)` resolution: <1µs/property, cached by browser. **No measurable runtime cost.**
  - `data-[active=true]:font-medium` triggers layout reflow (glyph advance widths change). Mitigate with letter-spacing compensation if toggle jitter is visible.
  - `rg` in CI: ~30–80ms on M-series; acceptable.
- **Security:** none.
- **Accessibility:**
  - Opacity-based two-tier (`/60`) passes WCAG 1.4.1 (color not sole signal — shape + text remain).
  - Destructive badge contrast with `/10` bg may drop below WCAG AA; escalate to `/15` or `/20` if DevTools contrast check fails.
  - Font-weight-only differentiation (if kept) fails WCAG 1.4.1 for low-vision — opacity approach strictly better.

## System-Wide Impact

### Interaction graph

Call site renders `<div className="bg-sidebar hover:bg-sidebar-accent/60">` → Tailwind resolves `--color-sidebar-accent` → CSS chains to `--sidebar-accent` → resolves to `var(--slate-5)` → resolves to hex. No React re-render, no effect, no new render boundaries.

### Error propagation

N/A — static classname swaps. Tailwind v4 JIT tree-shakes **utilities**, not theme vars: the 8 `--color-sidebar-*` entries ship to CSS regardless. Only `bg-sidebar` etc. are gated on source usage — so Phase 1 + Phase 4 must ship together OR use `@theme static` to force utility emission.

### State lifecycle risks

None.

### API surface parity

Adopting shadcn canonical sidebar tokens means `npx shadcn@latest add sidebar` slots in cleanly. The renamed attribute (`data-[active=true]`) and `aria-current="page"` also match shadcn's canonical markup — no remapping work when consuming upstream components.

### Integration test scenarios

1. Load `/posts` → Posted/Scheduled/Posting/Draft badges render identical pixels (Draft migrates to `bg-muted`; others stay raw, registered in exemptions).
2. Load `/posts/:id` → recipient read table:
   - Yes badge: unchanged (green-3/11 stays raw).
   - No badge: `bg-red-3 text-red-11` → `bg-destructive/10 text-destructive`. **Known visual shift; verify with screenshot diff + contrast check.**
   - Check icon (green): unchanged.
   - X icon (red): `text-red-9` → `text-destructive`. Pixel-identical.
3. Load `/posts/new` → form bg, button states, tooltip unchanged. Required asterisks (`text-red-9`) migrate to `text-destructive`.
4. Sidebar expanded + collapsed, ALL states:
   - Default (not hover, not selected): `text-sidebar-foreground` on `bg-sidebar` — pixel-identical.
   - Hover on unselected: **was** slate-4 bg, **now** slate-5 at 60% opacity. Close but not identical.
   - Selected (idle): slate-5 bg — pixel-identical.
   - Selected + hover: slate-5 bg — pixel-identical.
   - Attribute `data-[selected=true]` → `data-[active=true]` + `aria-current="page"`. Screen reader announces current page.
5. Tooltip (`constants.ts`) `bg-slate-12` → `bg-foreground` — pixel-identical.
6. `/components` Theme section — palette demo exempt, no change.

## Acceptance Criteria

### Functional

- [ ] **Phase 0:** `button.tsx` disabled state corrected: either revert `text-slate-8` with exemption entry, or document the intentional shift with design sign-off.
- [ ] `web/App.css` `:root` declares the 8 shadcn-canonical sidebar tokens with inline comment noting the `--sidebar-background` → `--sidebar` rename history.
- [ ] `web/App.css` `@theme inline` exposes `--color-sidebar{,-foreground,-primary,-primary-foreground,-accent,-accent-foreground,-border,-ring}`.
- [ ] All Phase 2 direct-replace candidates migrated in the 11 non-sidebar files listed.
- [ ] Phase 3: all `red-*` refs meaning "error/destructive" (including required-field asterisks in `CreatePostView.tsx`) migrated to `--destructive`/`--destructive-foreground`; destructive badge contrast passes WCAG AA.
- [ ] Phase 4: Sidebar files use canonical `bg-sidebar`, `hover:bg-sidebar-accent/60`, `data-[active=true]:bg-sidebar-accent`, `text-sidebar-foreground`, `border-sidebar-border`. `data-[selected=true]` renamed to `data-[active=true]` + `aria-current="page"` added. Font-weight change (if any) paired with letter-spacing compensation.
- [ ] `scripts/check-raw-colors.sh` + `scripts/raw-color-exemptions.txt` committed; `pnpm check:colors` passes; wired into `pnpm lint`.

### Non-functional

- [ ] `pnpm lint` clean, `pnpm build` succeeds.
- [ ] Bundle-size diff: expect net **−2 to −3 KB gzipped** (alpha removal dominates). Confirm with `pnpm build` output.
- [ ] Screenshot checklist attached to PR covering: `/posts` (all 4 badge states), `/posts/:id` (Yes/No badges, check/X icons, recipient table rows), `/posts/new` (required asterisks, form layout), sidebar expanded + collapsed + all 4 hover/selected states at 60px and 240px widths, tooltip.
- [ ] Destructive badge WCAG AA contrast verified with DevTools or `axe`; if below AA, escalate `/10` → `/15` → `/20`.
- [ ] A11y: `aria-current="page"` announced by VoiceOver/TalkBack on selected sidebar item.

### Quality gates

- [ ] Exemption registry reviewed: every entry has a reason ending with "no shadcn --X" or "decline to migrate".
- [ ] `docs/architecture/color-tokens.md` (new) documents: canonical set in use, exemption policy, graduation rule ("if an exempt pattern hits 3+ call sites, open a follow-up plan to evaluate a project-local token"), upgrade process on shadcn minor bumps.
- [ ] Plan closed out with "Post-migration notes" appended (before/after count, deviations, new exemptions added post-merge).

## Success Metrics

- **Raw ref count** outside `App.css` + `ComponentsView.tsx` + registered exemptions: `86 → 0`. Current plan targets ≤ 12 registered exemptions (status + twblue tints + PostPreview border + RichTextToolbar semantic bleed).
- **Every sidebar token has ≥ 1 consumer** (no dead tokens).
- **Zero invented tokens** — shadcn v4 canonical set only.
- **CI guard catches the first regression PR**; exemption file grows only via explicit PR review.
- **Semantic mental model:** a contributor reading `hover:bg-sidebar-accent/60` understands the two-tier intent without consulting the palette.

## Files Affected

From the 2026-04-18 re-audit (86 refs across 18 files):

**Phase 2 — direct-replace to existing shadcn tokens (non-sidebar):**

- `web/components/Sidebar/constants.ts:2` — `bg-slate-12` → `bg-foreground` (tooltip — note: lives in Sidebar/ dir but is theme-global, not sidebar chrome)
- `web/containers/CreatePostView.tsx:483,549` — `text-red-9` (required asterisks) → **Phase 3: `text-destructive`**
- `web/containers/PostsView.tsx:196,211` — `text-amber-9,10` → **stays raw + register exemption**
- `web/components/posts/PostPreview.tsx:28` — `border-slate-12` → **stays raw + register exemption**
- `web/components/posts/ReadTrackingCards.tsx:38,60` — `text-twblue-9` → `text-primary`; `bg-twblue-3` → **stays raw + register**; `text-amber-10` → **stays raw + register**
- `web/components/posts/RichTextToolbar.tsx:37,38,58` — `text-slate-11/12 hover:bg-slate-3 hover:text-slate-12 bg-slate-4` → `text-muted-foreground/foreground hover:bg-muted hover:text-foreground bg-accent`
- `web/components/posts/RichTextToolbar.tsx:135` — `bg-slate-2` → **stays raw + register exemption** (sidebar-color bleed, decline to migrate)
- `web/components/posts/SchedulePickerDialog.tsx:172` — `text-red-10` → **Phase 3: `text-destructive`**
- `web/components/comms/entity-selector.tsx` (18 refs) — **mixed, per-line triage:**
  - `hover:bg-slate-{2,3}` (non-chrome menu hover) → `hover:bg-accent`
  - `border-slate-{3,6}` → `border-border`
  - `text-slate-12` → `text-foreground`
  - `text-slate-9` → **stays raw + register** (no canonical mapping)
  - `bg-twblue-{1,2,3,4}` (brand-tinted hover/selected) → **stays raw + register** (~8-10 refs; no canonical `--primary-subtle`)
  - `text-twblue-9` → `text-primary`
  - `hover:text-red-9` → **Phase 3: `hover:text-destructive`**
  - `bg-slate-4` (drag handle decoration) → `bg-accent`
  - `bg-slate-2/60` (sidebar-ish surface) → **stays raw + register**

**Phase 3 — destructive only (red-\* → --destructive):**

- `web/components/posts/StatusBadge.tsx:20` — `bg-slate-3 text-slate-11` (draft) → `bg-muted text-muted-foreground` (this is direct-replace, not destructive; included here because the file is otherwise status-raw)
- `web/components/posts/RecipientReadTable.tsx:109,123` — `text-red-9`, `bg-red-3 text-red-11` → `text-destructive`, `bg-destructive/10 text-destructive`
- `web/containers/CreatePostView.tsx:483,549` — as above
- `web/components/posts/SchedulePickerDialog.tsx:172` — as above

**Phase 4 — sidebar canonical migration:**

- `web/components/Sidebar/Sidebar.tsx:16,39` — 2 refs (container bg + border)
- `web/components/Sidebar/SidebarItem.tsx:104,105,111,115` — 4 refs + rename `data-[selected=true]` → `data-[active=true]`, add `aria-current="page"`
- `web/components/Sidebar/SidebarTrigger.tsx:25,31` — 2 refs

**Stays raw + registered in exemption file:**

- `StatusBadge.tsx:8,12,16` (green-3/11, blue-3/11 ×2) — 3 entries
- `RecipientReadTable.tsx:89,94,107,121` — 4 entries
- `PostsView.tsx:196,211` — 2 entries
- `PostPreview.tsx:28` — 1 entry
- `ReadTrackingCards.tsx:{38-bg,60}` — 2 entries
- `RichTextToolbar.tsx:135` — 1 entry
- `PostTypePicker.tsx:20-23,38-41` (~7 slate-4 decorative + 2 blue-6 accent) — ~9 entries (or migrate slate-4 skeleton bars to `bg-muted`)
- `entity-selector.tsx` (~8-10 twblue tints, 1 slate-9, 1 slate-2/60) — ~10 entries
- `button.tsx:13` `disabled:text-slate-8` if Phase 0 reverts — 1 entry

**Estimated total exemption registry size: ~30 entries.** Matches "growing allowlist as signal of policy failure" — if it crosses 50, the team should reconsider adding project-local tokens.

**Exempt (do not touch, not in registry):**

- `web/App.css` — defines tokens; raw scale refs are the source.
- `web/containers/ComponentsView.tsx` — palette demo; 5 refs.
- `web/components/ui/button.tsx`, `web/components/ui/input.tsx` — already fixed in pre-plan session (after Phase 0 correction).

## Dependencies & Risks

### Dependencies

- `ripgrep` (`rg`) available in CI — add to `package.json` devDependencies as `@vscode/ripgrep` or require Node ≥20 where `rg` ships with Node test runners. Alternatively fall back to `grep -rE` with ~3× slower runtime.
- Nothing else. Local to `web/` and `scripts/`.

### Risks (ranked by severity)

1. **Destructive badge visual shift.** `bg-red-3 text-red-11` → `bg-destructive/10 text-destructive` is NOT pixel-identical — new bg is lighter/less saturated, new text is slightly lighter too; contrast may drop below AA. **Mitigation:** screenshot diff is mandatory in the PR; if shift is visible or contrast fails, escalate opacity to `/15` or `/20`.

2. **Sidebar hover flattening** (Phase 4). Even with opacity two-tier (`/60` hover + full selected), the character of the interaction shifts — hover feels "lighter and softer," selected feels "denser." **Mitigation:** manual QA at both 60px (collapsed) and 240px (expanded) widths, hover over selected and unselected items, compare to before-state screenshots.

3. **Attribute rename (`data-[selected=true]` → `data-[active=true]`).** Touches any CSS consumer of that attribute (none expected but grep to confirm). Accessibility gain from `aria-current="page"` is real but requires QA with VoiceOver to verify announcement.

4. **Exemption file rot over time.** If the registry grows unbounded, "no invented tokens" becomes pure signaling. **Mitigation:** `docs/architecture/color-tokens.md` defines a graduation rule — if an exempt pattern hits 3+ call sites, open a follow-up plan to evaluate a project-local token. Revisit registry size each quarter.

5. **Tree-shaking misconception.** Originally the plan said `--color-sidebar-*` entries get pruned if unused. **Performance-oracle corrected:** entries ship regardless; only utility classes get pruned. Phase 1 + Phase 4 bundling is for utility emission, not var declaration. Updated wording throughout.

6. **Font-weight reflow** (if font-weight differentiation is additionally used — plan now prefers opacity). Letter-spacing compensation needed. **Mitigation:** opacity-first approach sidesteps this entirely; keep font-weight out of Phase 4 unless opacity alone is insufficient.

7. **Pattern drift post-migration.** Contributors may blindly apply "slate-4 → accent" to sidebar chrome (wrong — sidebar uses sidebar-accent) or "red-\* → destructive" to non-error red (wrong semantic). **Mitigation:** `docs/architecture/color-tokens.md` documents the non-sidebar carve-out for Phase 2 and the destructive-intent narrowing for Phase 3.

8. **`@theme static` escape hatch** not needed now but worth documenting in case Phase 1 ever needs to ship independently.

### Rollback strategy

- **Partial rollback (Phase 4 only):** revert SidebarItem.tsx (including the attribute rename) + App.css sidebar block. Leaves Phase 2/3 in place.
- **Partial rollback (destructive badges only):** revert `RecipientReadTable.tsx` and `CreatePostView.tsx`. Phase 2/Phase 4 unaffected.
- **Full rollback:** `git revert` the PR series. CSS vars are standalone; no data migration.

## Sources & References

### Internal — session audit + re-audit

- **Pre-plan session fixes:**
  - `web/components/ui/button.tsx:13,15,17` — `bg-slate-3`→`bg-muted` ✓, `text-slate-8`→`text-muted-foreground` ⚠️ (Phase 0 correction), `bg-white`→`bg-background` ✓.
  - `web/components/ui/input.tsx:11` — `bg-white` → `bg-background` ✓.
- **Re-audit results** (repo-research-analyst): 86 refs across 18 files; surprise refs in `CreatePostView.tsx`, `PostsView.tsx`, `PostPreview.tsx`, `RichTextToolbar.tsx:135`, `ReadTrackingCards.tsx`.
- **Dead `dark:` classes** in `web/components/ui/{tabs,button,badge}.tsx` — follow-up cleanup (separate plan).

### Project conventions

- `/CLAUDE.md` — light-mode only; commit `50a3f12` removed dark palette shim.
- `web/App.css:46-68` — existing shadcn semantic tokens.
- `web/App.css:140-160` — existing `@theme inline` block (sidebar entries added here).

### External references — validated by framework-docs-researcher

- [Shadcn/ui Theming](https://ui.shadcn.com/docs/theming) — canonical token list; cssVariables mode; v4 specifics.
- [Shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar) — `data-[active=true]`, `aria-current="page"`, `--sidebar-accent` two-state pattern.
- [Shadcn/ui GH Discussion #8986](https://github.com/shadcn-ui/ui/discussions/8986) — maintainer stance on no canonical `--success`/`--warning`/`--info`.
- [Shadcn/ui Changelog — Jan 2026 Base UI](https://ui.shadcn.com/docs/changelog) — Base UI primitives + shadcn token compatibility.
- [Tailwind v4 `@theme`](https://tailwindcss.com/docs/theme) — tree-shaking behavior, `@theme inline` vs `@theme static`, variable emission rules.
- [Tailwind GH Discussion #18440](https://github.com/tailwindlabs/tailwindcss/discussions/18440) — `@theme static` escape hatch for forced emission.
- [Radix Colors](https://www.radix-ui.com/colors) — step semantics: 3 = subtle bg, 9 = solid fill, 11 = accessible text.
- [WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) — font-weight-only differentiation caveats.

### Related in-session work

- `web/App.css` Sonner override block (`[data-sonner-toaster][data-sonner-theme]`) — prior example of mapping canonical library tokens to project Radix vars. Phase 1 uses the same pattern.
- `web/components/Sidebar/constants.ts` — extracted `SIDEBAR_TOOLTIP_CLASSNAMES` from 4 inline duplicates. Centralization principle extended by Phase 4.

---

## Post-migration notes

- **Shipped Option A** (full plan, all 6 phases) on branch `feat/posts-frontend`.
- **Raw ref count before:** `86` (2026-04-18 re-audit).
- **Raw ref count after (outside `App.css` + `ComponentsView.tsx`):** `0` unregistered. Every surviving raw ref is in `scripts/raw-color-exemptions.txt`.
- **Registered exemptions:** `26` (status badges ×11, PostTypePicker info hovers ×3, entity-selector brand tints + slate-9 gap + sidebar-color bleed ×10, PostPreview high-contrast border, RichTextToolbar surface).
- **Tokens added to shadcn canonical set:** `8` (sidebar only: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`). Both `:root` and `@theme inline` blocks.
- **Tokens invented:** `0`.
- **Phase 0 decision:** user accepted the darker `disabled:text-muted-foreground` (slate-11) over previous raw `text-slate-8`; no revert. Documented here.
- **Deviations from plan:**
  - Phase 2 `bg-slate-4` → `bg-accent` rule applied to `PostTypePicker` skeleton bars (not `bg-muted` as initially flagged); matches the plan's "non-sidebar call sites only" note and keeps the change pixel-identical.
  - Phase 4 uncovered an extra raw ref the original regex missed: `bg-slate-alpha-11/62` on `Sidebar.tsx:27` (mobile backdrop overlay). Migrated to `bg-foreground/60` (this utility had been silently broken since the alpha imports were removed).
  - `entity-selector.tsx:283` left raw: `border-slate-3 bg-slate-2/60` forms a subsurface header with no clean canonical mapping.
  - `entity-selector.tsx:556` (`Create` link hover) left raw at `hover:bg-slate-2`; `hover:bg-muted` (slate-3) would have been _darker_ on the already-light sidebar-color surface.
- **CI guard:** `pnpm check:colors` green; `scripts/check-raw-colors.sh` wired into `pnpm lint`. Ripgrep preferred, grep fallback implemented.
- **Tailwind v4 JIT behavior (confirmed):** the 8 new `--color-sidebar-*` entries ship to `:root` regardless of consumer presence — only utility classes (`bg-sidebar` etc.) get pruned. Phase 1 + Phase 4 shipped together per plan.
- **Visual regression QA:** `/posts` list, `/posts/:id` read-status table, sidebar expanded (Home/Students/Posts with "Posts" selected) all render correctly. Build: `vite build` succeeds, no console errors.
- **WCAG contrast:** not explicitly measured this session — follow-up: run axe on `/posts/:id` "No" badge to confirm `bg-destructive/10` + `text-destructive` meets AA. If below AA, escalate to `/15` or `/20`.
- **Follow-ups deferred:**
  - Scratch `test-narrowing*.ts` files at repo root trip oxlint (pre-existing; not in scope).
  - Dead `dark:` classes in `web/components/ui/{tabs,button,badge}.tsx` — separate cleanup (repo is light-only per commit `50a3f12`).
  - `docs/architecture/color-tokens.md` not written this pass; the plan itself serves as the contract for now.
