# HeyTalia Dev Questions — TW Response Draft

**Status:** Internal draft for review
**Date:** 2026-04-08
**Audience:** TW team (not yet shared with HT)
**Grounded in:** [RFC-027](RFC-027-frontend-architecture-monolith.md), [RFC-028](RFC-028-backend-architecture.md), [PG-BFF-DESIGN](PG-BFF-DESIGN.md)

> Legend: ✅ decided · 🟡 recommendation, needs your sign-off · ❓ open, needs TW input

---

## 1. Frontend delivery ✅

**HT lives inside the TW monolith as an app under `web/apps/heytalia/*`.** Not REST-only, not iframe.

Per RFC-027: TW is an App Folder monolith. Each app contributes routes under its base path (`/heytalia/*`) and uses the platform shell, design system, and routing. Iframe and SDK approaches were explicitly rejected (fragile deep linking, version drift, fragmented UX).

This is the same pattern PG is following today — the FE code lives in this repo.

**Implication for HT:** existing HT React frontend is not lifted as-is. It is rebuilt (or progressively ported) inside `web/apps/heytalia/*` against TW's shared design system. The HT backend (Lambdas, DDB, Bedrock KB) stays where it is and becomes a private downstream service called by TW BFF.

---

## 2. Authentication 🟡

**TW BFF terminates auth. HT backend stops trusting an API key directly from a browser; instead it trusts a short-lived JWT issued by TW BFF.**

Per RFC-028 §Identity Propagation:

- Browser ↔ TW: stateful session cookie, session in Valkey
- TW BFF ↔ HT backend: `Authorization: Bearer <JWT>`, HS256 (symmetric, shared secret) initially, JWKS later
- JWT is short-lived (minutes), explicit `exp`, generated per downstream call
- HT backend validates `iss` (TW), `aud` (heytalia), `exp`

**Migration path for HT's existing `x-api-key`:**

1. Phase A: TW BFF holds the existing `x-api-key` as a server-side secret and forwards it alongside the JWT. HT validates either. (Unblocks integration without HT code changes.)
2. Phase B: HT adds JWT validation middleware. API key removed from the per-request path; kept only for ops/test.

This matches option **(i)** in HT's question — TW backend performs the equivalent server-side proxy. We are not asking HT to federate to MIMS directly.

---

## 3. Request shape ❓→🟡

HT today expects `pgStaffId`, `pgSchoolId`, `staffEmailAdd`. These are PG-specific identifiers.

**Recommendation:** TW BFF projects the TW user identity into HT's expected shape at the proxy boundary. TW's canonical claims (see §10) are mapped:

| HT field        | TW source                                               |
| --------------- | ------------------------------------------------------- |
| `staffEmailAdd` | TW session `email`                                      |
| `pgStaffId`     | TW session `mims_staff_id` (same MIMS identity PG uses) |
| `pgSchoolId`    | TW session `school_code`                                |

**Caveat:** this only works for users who are _also_ PG users (same MIMS identity, same school taxonomy). For TW users outside that set, see §6. We should rename these fields on HT side to be platform-neutral (`staffId`, `schoolId`) before onboarding non-PG users — flag this to HT as a follow-up.

---

## 4. Draft destination ❓

**Not yet decided.** Two options to put to HT:

- **(a) HT emits drafts to its own draft store, TW renders them in the HT app surface.** Lowest coupling. Matches HT's current behaviour. Drafts only visible inside `/heytalia/*`.
- **(b) HT writes the draft directly into the PG announcement/consent-form draft store via the PG BFF proxy we're already building.** Tighter UX (drafts appear in PG's drafts list) but creates a runtime dependency from HT → PG-proxy and only works for PG-targeted output.

🟡 **My lean: (a) for v1**, with a "Send to PG" button that calls the PG proxy as an explicit user action. Avoids cross-app coupling at the data layer.

---

## 5. UX boundaries ❓

Per RFC-027, HT renders inside the TW shell using TW's shared components. So:

| HT feature            | Verdict                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| Rich-text editing     | Keep, but use TW shared editor (not HT's current one)                   |
| File upload           | Keep, via TW shared upload component                                    |
| Conversation history  | Keep, backed by HT's existing DDB                                       |
| Feedback thumbs       | 🟡 see §9 — likely routed via TW's platform feedback, not HT's own      |
| Modals                | Keep, via TW shared modal — escapes the app pane, not the sidebar       |
| Placeholder filling   | Keep                                                                    |
| Sidebar-docked layout | ❓ depends on whether HT is a full-page app or a sidebar agent — see §8 |

The conflict HT is worried about ("other LLMs' UI") is real and is a TW platform decision, not an HT decision.

---

## 6. User base ❓

Two distinct concerns:

**(a) Data isolation when TW users ≠ PG users.** HT's KB is school-tagged. If a TW teacher belongs to a school not present in HT's KB, retrieval should return empty (not leak another school's data). We need HT to confirm the KB query is school-scoped at the retrieval layer, not just at the UI. **Action:** ask HT to document the KB ACL model.

**(b) Broader TW data feeding HT's KB.** 🟡 Out of scope for the migration itself. Worth a follow-up RFC once TW's data model stabilises. Don't block migration on this.

---

## 7. Ownership of chat input ❓

**Not yet decided by TW platform team.** Two models:

- **TW owns a global chat input** (like Cursor/Copilot) and routes to whichever agent is active. Agents are "skills."
- **Each app brings its own chat input** within its own surface. HT's input lives in `/heytalia/*`.

🟡 **My lean: each app brings its own for v1.** The global router pattern is a much bigger platform commitment and isn't on the RFC-027 roadmap. Revisit when there are 2+ chat agents.

**Action:** confirm with @YimingIsCOLD before answering HT.

---

## 8. Features (modals, screen takeover, file upload) 🟡

- **Modals:** yes, via TW shared modal system. They escape the app pane.
- **Screen takeover:** apps own their assigned route subtree (`/heytalia/*`). Within that, HT can use full width. HT cannot take over TW chrome (top bar, nav).
- **File upload:** yes, via TW shared component. HT backend keeps its S3 + extraction pipeline.
- **Sidebar-docked-only mode:** ❓ depends on §7. If HT is a sidebar agent rather than a full app, the constraints in §11 apply.

---

## 9. Monitoring & Ops ❓

**Triage ownership — proposed split:**

- TW shell breaks (layout, routing, session) → TW platform team
- HT-specific functionality breaks (generation, KB, drafts) → HT team
- Boundary issues (HT renders wrong because TW shell changed) → joint, TW platform first responder because they own the breaking change

**Required to make this work:**

- Tracing across TW BFF → HT backend (TW will propagate a request ID; HT logs must include it)
- HT's existing CloudWatch dashboards stay; TW adds a "HT health" panel sourced from BFF-side metrics

**Feedback routing:** 🟡 Recommend TW owns a single platform feedback widget. Submissions are tagged with the active app + route, then fanned out:

- HT-tagged feedback → HT's existing feedback DDB table (TW BFF writes via HT's `feedback-handler`)
- TW-tagged feedback → TW's own store

This means HT removes its in-chat thumbs UI but keeps its feedback backend. HT loses no data; users get one consistent feedback path.

---

## 10. Claims available about an authenticated user 🟡

**Proposed canonical TW claims** (subject to platform team confirmation):

| Claim                  | Source    | Notes                                      |
| ---------------------- | --------- | ------------------------------------------ |
| `sub` (stable user id) | MIMS      | opaque, stable across sessions             |
| `email`                | MIMS      |                                            |
| `name`                 | MIMS      | full name                                  |
| `roles`                | MIMS / TW | array, e.g. `["teacher"]`                  |
| `school_code`          | MIMS      | single value for v1; array later if needed |
| `org_id`               | MIMS      | MOE org identifier                         |
| `mims_staff_id`        | MIMS      | for HT's `pgStaffId` mapping (§3)          |

These flow into the JWT TW BFF mints for HT. ❓ **needs platform team confirmation** — the RFC-028 example only lists `User ID` and `Email` explicitly.

---

## 11. Session lifetime ❓

**Not specified in RFC-028.** What we know:

- Stateful sessions in Valkey
- PG session is ~30 min and TW silently re-auths via MIMS on 401 (see PG-BFF-DESIGN §PG Session Expiry)

🟡 **Recommendation for HT:**

- TW session lifetime: TBD (action: ask platform team — propose 8h sliding)
- JWT TW→HT: minted per downstream call, 5 min `exp`
- HT does **not** maintain its own session. There is nothing for HT to refresh. Every request from TW BFF carries a fresh JWT.
- Result: HT cannot log a user out before TW does, because HT has no session of its own.

---

## 12. Existing reference + context intelligence layer ❓

- **Reference integration:** PG is the first and currently only app being integrated under RFC-027/028. Plans in this repo (`PG-*.md`) are the reference. Point HT at `PG-BFF-DESIGN.md` and `RFC-028` directly.
- **Context intelligence layer:** ❓ I don't have visibility into what was discussed at the DXD town hall. **Action: needs input from you / @YimingIsCOLD before answering.** Don't speculate to HT.

---

## Cross-cutting: HT's architecture concerns (the meta-question)

HT raises a real tension: RFC-027 puts HT's FE code inside the TW monolith, which is the opposite of HT's "embeddable across platforms" vision.

**Honest answer to put to HT:**

> RFC-027 is explicit about this trade-off (see Drawbacks: "Independent deployment not supported without future architectural changes"). The bet is that for the next 12 months, all HT use cases worth supporting live inside TW. If HT needs to embed in a non-TW host later, the path is a future RFC to introduce runtime bundle integration — RFC-027 §Alternatives leaves that door open but explicitly doesn't fund it now.

This is a platform-level call, not something we should soften. Flag it as a known constraint, not a bug.

---

## Open items needing your input before sending to HT

1. **§4** Draft destination — confirm lean toward (a)
2. **§7** Chat input ownership — needs @YimingIsCOLD
3. **§9** Feedback routing — confirm single TW widget with fan-out is acceptable to HT product
4. **§10** Canonical claims — needs platform team confirmation
5. **§11** TW session lifetime — needs platform team
6. **§12** Context intelligence layer — needs your context from DXD town hall
7. **§3** Renaming `pgStaffId`/`pgSchoolId` on HT side — is this in scope for migration or a follow-up?
