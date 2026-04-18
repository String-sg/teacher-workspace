---
status: pending
priority: p3
issue_id: 012
tags: [code-review, tooling, shell]
dependencies: []
---

# `check-raw-colors.sh` swallows all non-zero exits via `|| true`

## Problem Statement

`scripts/check-raw-colors.sh` runs `rg` and `grep` with a trailing `|| true` to swallow exit 1 (the "no matches" case, which is not an error for our use). But `|| true` also swallows exit ≥2 (invalid regex, I/O error, permission denied), which means a future pattern change or CI environment glitch could cause the script to silently pass when it should fail. POSIX `sh` doesn't offer `set -o pipefail`, so the awk/while-read pipeline that follows also can't catch mid-pipeline failures.

## Findings

**security-sentinel:**

> **Fail-open — LOW.** `rg ... || true` and `grep ... || true` correctly swallow exit 1 (no match). But note: if `rg`/`grep` fails with exit ≥2 (e.g. invalid regex on a future edit, I/O error), `|| true` still swallows it and `MATCHES=""` → script exits 0. **MEDIUM if you change the pattern in the future.**

## Proposed Solutions

### Option A — Guard exit codes explicitly (recommended)

```sh
MATCHES=$(rg ... ) || { code=$?; [ "$code" -eq 1 ] || { echo "rg failed with $code" >&2; exit $code; }; MATCHES=""; }
```

Or cleaner via a helper function:

```sh
tolerate_no_match() {
  "$@"
  code=$?
  case "$code" in
    0|1) ;;       # 0 = matches found, 1 = no matches
    *) echo "Command failed with exit $code" >&2; exit "$code" ;;
  esac
}
```

**Pros:** surfaces real errors; keeps no-match as a pass. **Cons:** more shell. **Effort:** Small. **Risk:** None.

### Option B — Accept the risk

Current pattern is fixed and `rg`/`grep` are reliable. The guard mostly matters if the pattern becomes user-configurable.

**Pros:** zero work. **Cons:** latent bug.

### Option C — Port the check to TypeScript

Replace `check-raw-colors.sh` with a Node script. Could integrate with existing oxlint plugin machinery. Larger surface but first-party error handling.

**Pros:** robust. **Cons:** more code, more deps. **Effort:** Medium. **Risk:** Low.

## Recommended Action

(Filled during triage. Option A is cheap enough to do preemptively.)

## Technical Details

- **Affected files:** `scripts/check-raw-colors.sh`
- **Lines:** 22-31 (rg/grep blocks)

## Acceptance Criteria

- [ ] Non-match exit 1 continues to pass
- [ ] Other non-zero exits fail loudly
- [ ] `pnpm check:colors` still green on clean tree

## Work Log

(To be filled.)

## Resources

- PR: https://github.com/String-sg/teacher-workspace/pull/143
- Review finding: security-sentinel run 2026-04-18
