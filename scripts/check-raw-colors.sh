#!/bin/sh
# Flags raw Radix color refs in web/ that are not registered in
# scripts/raw-color-exemptions.txt. Prefer shadcn canonical tokens
# (bg-muted, text-muted-foreground, bg-sidebar, text-destructive, etc.) —
# see docs/plans/2026-04-18-001-refactor-consolidate-color-refs-behind-shadcn-tokens-plan.md.
#
# Uses ripgrep if available (3-5x faster on the repo); falls back to grep -rE.
set -eu

ALLOWLIST="scripts/raw-color-exemptions.txt"
PATTERN='(bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|placeholder|accent|caret)-(slate|twblue|blue|green|red|amber)-[0-9]+'

if ! [ -f "$ALLOWLIST" ]; then
  echo "ERROR: exemption registry missing at $ALLOWLIST" >&2
  exit 2
fi

# Build path:line allowlist from the registry (ignore comments and blank lines).
ALLOWED=$(grep -v '^[[:space:]]*#' "$ALLOWLIST" | grep -v '^[[:space:]]*$' | awk '{print $1}' | sort -u)

# Scan web/ for raw refs, excluding App.css (token source) and ComponentsView.tsx (palette demo).
if command -v rg >/dev/null 2>&1; then
  MATCHES=$(rg --line-number --no-heading --color never "$PATTERN" web/ \
    --glob '!web/App.css' \
    --glob '!web/containers/ComponentsView.tsx' || true)
else
  MATCHES=$(grep -rEn "$PATTERN" web/ \
    --exclude-dir=node_modules \
    --exclude='App.css' \
    --exclude='ComponentsView.tsx' || true)
fi

# Filter each match to path:line, drop lines that appear in ALLOWED.
VIOLATIONS=$(printf '%s\n' "$MATCHES" | awk -F: 'NF >= 3 { print $1 ":" $2 " " substr($0, index($0, $3)) }' | while IFS= read -r line; do
  key=$(printf '%s' "$line" | awk '{print $1}')
  rest=$(printf '%s' "$line" | cut -d' ' -f2-)
  if ! printf '%s\n' "$ALLOWED" | grep -qFx "$key"; then
    printf '%s  %s\n' "$key" "$rest"
  fi
done)

if [ -n "$VIOLATIONS" ]; then
  printf 'Raw Radix color refs outside the exemption registry:\n\n%s\n\n' "$VIOLATIONS"
  printf 'Either migrate to a shadcn canonical token (bg-muted, text-destructive,\n'
  printf 'bg-sidebar, etc.) or register the exemption with a reason in:\n  %s\n' "$ALLOWLIST"
  exit 1
fi
