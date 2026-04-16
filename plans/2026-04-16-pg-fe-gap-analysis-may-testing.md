# TW ↔ PG Frontend Gap Analysis — Announcement Form for May Testing

## Context

Testing the announcement-form flow end-to-end from now through first/second week of May, with a **May decision point** on whether to invest further. PG team assigning an engineer next cycle (4–6 week runway to first announcements-API delivery by end of May). Priority sequence agreed with PG team: **custom groups → announcements → forms → meetings**.

TW currently owns front-end + proxy; PG owns back-end. The question this plan answers: **what does the current TW FE actually lack — versus the production PG FE — to make announcements demonstrable as a confidence signal at the May checkpoint?**

Supersedes prior in-file plans (envelope unwrap, CSRF stub, outbound write mapper, real-data form loader, entity-selector port, detail-fixture array unwrap — all shipped).

## Method

Three read-only audits produced the ground-truth inputs:

| Reference                                       | Role                                                        | Location                                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Production PG FE** (pgw-web)                  | behavioural ground-truth — the real staff portal users know | [/Users/shin/Desktop/projects/pgw-web/src/app](../../pgw-web/src/app)                           |
| **Design prototype** (design-teacher-workspace) | visual/UX reference, mock-data, cleaner abstractions        | [/Users/shin/Desktop/projects/design-teacher-workspace/src](../../design-teacher-workspace/src) |
| **Current TW FE**                               | what we've built so far                                     | [web/](web/)                                                                                    |

The gap = what TW lacks versus **either** reference. Prototype = UI north star; production PG = behaviour north star.

## Three-way summary (announcement module)

| Capability                                            | Production PG                                                                      | Prototype                      | TW (now)                                                                    | Gap severity for May testing                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| List + filter + search                                | ✅ full                                                                            | ✅ design-polished             | ✅ basic (tabs + search only)                                               | Low                                                                  |
| Detail view + read-status table                       | ✅ Excel export, filters, column picker                                            | ✅ same pattern                | ⚠️ placeholder toolbar (search/filter/columns/export all disabled)          | Medium                                                               |
| Recipients selector (Class/Level/CCA/…)               | ✅ real groups + overlap detection                                                 | ✅ EntitySelector with tabs    | ✅ ported (Class + Individual tabs populated; other tabs empty pending API) | Low                                                                  |
| Staff-in-charge picker                                | ✅ Individual/Level/School tabs                                                    | ✅ same                        | ✅ ported (Individual only)                                                 | Low                                                                  |
| Rich-text editor                                      | ✅ Tiptap + full toolbar                                                           | ✅ Tiptap + full toolbar       | ❌ plain `<textarea>` + visual-only toolbar                                 | **High — UX parity gap**                                             |
| Save-draft + autosave (~30s)                          | ✅ with session-extension suppression via `REQUEST_HEADER_NO_EXTEND`               | ✅ autosave, no session nuance | ❌ save-draft exists but **no autosave**, no dirty-state warning            | **High — data-loss risk**                                            |
| Unload warning when dirty                             | ✅ `useUnloadEvent` + react-router `Prompt`                                        | ❌ not present                 | ❌ not present                                                              | Medium                                                               |
| Scheduled publish + reschedule + cancel               | ✅ full (15m–30d bounds, inline reschedule, cancel)                                | ✅ picker + reschedule         | ❌ payload plumbing present; no UI                                          | **High for "scheduled posts" demo**                                  |
| File attachments (PDF/doc)                            | ✅ `preUploadValidation` → S3 presigned PUT → antivirus scan polling → `fileToken` | ❌ local `File` objects only   | ❌ visual-only placeholder                                                  | **Blocker for full confidence; high effort (S3 + scan)**             |
| Photo upload + cover                                  | ✅ image compression + same pipeline                                               | ❌ local only                  | ❌ not present                                                              | Same as above                                                        |
| Website-links section                                 | ✅ with safe-link server validation                                                | ✅ visual-only                 | ❌ mapper supports it; no UI                                                | Medium                                                               |
| Shortcuts (Declare travels / Edit contact)            | ✅ feature-flag-gated                                                              | ✅ component exists            | ❌ not in form                                                              | Medium                                                               |
| Questions (yes-no response type)                      | ✅                                                                                 | ✅ full QuestionBuilder        | ⚠️ QuestionBuilder present but **not included in outbound payload**         | **High if "post-with-response" is in the test flow**                 |
| Duplicate announcement                                | ✅ draft + posted duplicate                                                        | ✅ menu action                 | ✅ endpoint wired, dropdown action present                                  | Low                                                                  |
| Delete (posted/draft)                                 | ✅ with modal confirmation                                                         | ✅ menu action                 | ✅ endpoint wired; **no confirmation modal**                                | Medium                                                               |
| Error routing (-401/-403/-404/-4012/-4031/-4033)      | ✅ `NetworkManagerUtils.handleErrors`                                              | ❌                             | ❌ treats all HTTP `!ok` as generic error                                   | **High — 401 will surface as a generic error today**                 |
| Session-expiry warning + countdown                    | ✅ `TimeoutCountdown` + idle vs active headers                                     | ❌                             | ❌ not present                                                              | Medium (90-day IMA flagged as missing)                               |
| CSRF double-submit                                    | ✅ proper cookie+header                                                            | ❌ (mock)                      | ✅ **bypassed via Docker stub** locally; prod needs PG allowlist            | Locally fine; prod blocked on PG-TEAM-ASKS #3/#4                     |
| PG session cookie propagation                         | ✅ browser cookies                                                                 | ❌                             | ✅ cookie pass-through works locally                                        | Ditto                                                                |
| Toast/notification framework                          | ✅ custom `Notification` + `EToastType`                                            | ✅ sonner                      | ❌ **browser `alert()` used for all failures**                              | **High — looks unprofessional in demos**                             |
| Admin views (staff activation, post oversight, audit) | ✅ separate `AdminAnnouncementList`, hq routes                                     | ❌                             | ❌ not present                                                              | Out of scope for Announcements-first test window; flagged in meeting |
| 90-day inactivity IMA lockout                         | ✅ session layer                                                                   | ❌                             | ❌ not present                                                              | Out of scope for May testing                                         |
| File scan / malware handling                          | ✅ polling + threat state                                                          | ❌                             | ❌                                                                          | Same as file-upload gap                                              |

## What TW already does well (shipped, demo-ready today)

- Real end-to-end list + detail + create flow against pgw-web + MySQL (session 2026-04-15 commits)
- Envelope auto-unwrap works for arrays + objects + bare payloads
- Outbound write mapper (`toPGCreatePayload` in [web/api/mappers.ts](web/api/mappers.ts)) translates grouped recipients → pgw `targets`, renames fields
- Real class/staff/student/session data feeds the form selectors
- EntitySelector ported from prototype with chip UX + search
- Docs refactored: [PG-BFF-DESIGN.md](plans/PG-BFF-DESIGN.md), [PG-TEAM-ASKS.md](plans/PG-TEAM-ASKS.md), [pg-audit-findings.md](docs/pg-audit-findings.md)
- CSRF stub pattern means local writes already work without the prod allowlist

## Gap categories, ordered by testing impact

### 1. Confidence-blockers (fix before May testing)

These are the items that will make the May demo look either broken or unfinished to non-technical stakeholders.

1. **Error UX — replace `alert()`.** Install `sonner`, swap the four `alert()` call sites in [web/containers/CreatePostView.tsx](web/containers/CreatePostView.tsx) (`handleSaveDraft`, `handleSendConfirm`, etc.). Add a tiny `notify.success` / `notify.error` helper in `web/lib/notify.ts`. ~1h.
2. **Rich text editor.** Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` (underline, text-align, link, highlight, task-list). Port [rich-text-editor.tsx](../../design-teacher-workspace/src/components/comms/rich-text-editor.tsx) from prototype (354 LOC, mostly verbatim). Replace textarea + visual-only toolbar in `CreatePostView`. Confirms the `richTextContent: string` payload still works downstream. ~3h.
3. **Questions payload wiring.** [CreatePostView.tsx:295-310](web/containers/CreatePostView.tsx#L295-L310) builds payload without `questions`. Extend the outbound mapper and `PGApiCreateAnnouncementPayload` to include `questions` (as pgw expects). Without this, "post with response" is a dead flow at submit time.
4. **Status enum `POSTING`.** [web/api/types.ts:5](web/api/types.ts#L5) is already fixed — verify rendering handles it.
5. **Scheduled publish UI.** Mirror the prototype's split-button + date/time picker section. Payload (`scheduledSendAt`) already plumbed via `scheduleDraft`; FE just needs the date/time strip the prototype already has.

Total: roughly 6–8h of focused work.

### 2. Polish (mid-May if time allows)

1. **Autosave + dirty-state unload warning.** Port `useUnloadEvent` pattern from pgw-web ([SaveAsDraft.tsx:116-181](../../pgw-web/src/app/pages/Announcements/CreateAnnouncementPage/SaveAsDraft.tsx)). Send autosave with a `X-No-Extend-Session: 1` header parallel to pgw's `REQUEST_HEADER_NO_EXTEND` — the proxy can pass it through unchanged.
2. **Delete/Schedule confirmation modals.** TW already has `~/components/ui/dialog`; mirror the prototype `SendConfirmationSheet` for schedule/delete.
3. **RecipientReadTable toolbar** (search/filter/columns/export). Search is the highest value; CSV export is one-liner using a `toCsv` util.
4. **401-aware error routing.** In [web/api/client.ts](web/api/client.ts) `fetchApi`/`mutateApi`, when `!res.ok` inspect body for `resultCode` and route `-401` / `-4012` to a `/session-expired` route, `-404` to a not-found view, else surface the `errorReason` via toast. Much cleaner than `throw new Response('API error', ...)`.
5. **Outbound field coverage** — website links, shortcuts — wire form sections that the mapper already handles.

### 3. Out of scope for May testing (plan, don't build)

- File uploads (attachments + photos). Production path = pre-upload-validation → S3 PUT → antivirus scan polling → `fileToken`. Locally we have dummy AWS credentials; the real flow needs LocalStack or real S3 + PG engineer willing to patch the file controller. **Defer until file upload enters a priority window; mark the UI as "coming soon"** rather than placeholder.
- Admin views (staff activation, post oversight, audit) — flagged in the meeting as explicit gaps; not announcement-path.
- 90-day IMA inactivity lockout, 2FA prompt, OTP flow — production-PG platform chrome.
- Concurrent edit detection, offline-first, optimistic locking — production PG doesn't have these either; not needed for the testing window.
- Real-time session-expiry countdown — low demo value.

## PG team asks — severity for announcements May testing

Reiterating [PG-TEAM-ASKS.md](plans/PG-TEAM-ASKS.md) in testing-impact order:

| #   | Ask                                       | Impact on May test                                                               |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Staging pgw-web base URL                  | **Blocking staging test** — can run local-only without, but demo story is weaker |
| 2   | IP allowlist timing                       | **Blocking production writes.** Local CSRF stub covers us through May            |
| 4   | CSRF skip for allowlisted IP              | Same as #2                                                                       |
| 5   | Trust `X-TW-Staff-ID` from allowlisted IP | Same — fallback keeps working                                                    |
| 3   | Service-to-service trust mechanism        | Architecture question; won't block a demo                                        |
| 9   | `-4031` 302 redirect                      | Matters the first time auth fails mid-demo                                       |
| 6   | Env flag to bypass CSRF in dev            | Workaround shipped (Docker stub); nice-to-have                                   |
| 7   | MIMS artifact reuse policy                | Doesn't affect local testing                                                     |
| 8   | Session cookie name stability             | Ops-only                                                                         |
| 10  | Accept capture-and-replay as permanent    | Strategic; doesn't gate May                                                      |

**Translation for the weekly sync:** asks 1, 2, 4, 5 and 9 are the ones to land soonest; everything else can wait.

## Recommended starting-point sequence for next session

Given the May window, take the confidence-blockers in this order (each is a single focused session):

1. Toast/notification framework (sonner install + notify helper + swap `alert`s) — 1h, unlocks every subsequent better UX
2. Tiptap rich-text editor port — 3h, largest visible UX uplift
3. Questions payload wiring — 1h, unblocks "post-with-response" variant
4. Scheduled-publish UI (date/time strip + confirm) — 2h, hits a feature the PG team will expect to see working
5. 401/404 error routing in `fetchApi` — 1h, hardens the demo against session drops
6. (optional, if time) autosave + unload warning — 2h

These six are independent and commitable as their own small PRs. Skipping any doesn't break the others.

## Critical files (reference index, by concern)

| Concern                    | TW file                                                                                                    | Production PG reference                                                                                                   | Prototype reference                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Create form shell          | [web/containers/CreatePostView.tsx](web/containers/CreatePostView.tsx)                                     | [CreateAnnouncementPage.tsx](../../pgw-web/src/app/pages/Announcements/CreateAnnouncementPage/CreateAnnouncementPage.tsx) | [announcements.new.tsx](../../design-teacher-workspace/src/routes/announcements.new.tsx)                     |
| Save/publish orchestration | inline in container                                                                                        | [SaveAsDraft.tsx](../../pgw-web/src/app/pages/Announcements/CreateAnnouncementPage/SaveAsDraft.tsx)                       | inline                                                                                                       |
| Rich text                  | ❌ missing                                                                                                 | `FormRichTextAreaDirty` (third-party)                                                                                     | [rich-text-editor.tsx](../../design-teacher-workspace/src/components/comms/rich-text-editor.tsx) ← port this |
| Recipient selector         | [web/components/comms/student-recipient-selector.tsx](web/components/comms/student-recipient-selector.tsx) | `IndividualStudentGroupsComboBoxDirty`                                                                                    | ported                                                                                                       |
| Staff selector             | [web/components/comms/staff-selector.tsx](web/components/comms/staff-selector.tsx)                         | `StaffGroupsComboBoxDirty`                                                                                                | ported                                                                                                       |
| API client                 | [web/api/client.ts](web/api/client.ts)                                                                     | `AnnouncementManager.ts`, `AnnouncementDraftManager.ts`, `AnnouncementScheduleManager.ts`                                 | —                                                                                                            |
| Outbound mapper            | [web/api/mappers.ts#toPGCreatePayload](web/api/mappers.ts)                                                 | `SaveAsDraftUtil.parseXXX`, `GroupsUtil.consolidateSelectedStaffID`                                                       | —                                                                                                            |
| Error routing              | inline `throw new Response`                                                                                | [NetworkManagerUtils.ts handleErrors](../../pgw-web/src/app/util)                                                         | —                                                                                                            |
| Autosave                   | ❌ missing                                                                                                 | `AutoSaveStatesContext` + `useAutoSaveStates`                                                                             | `setInterval` 30s in route                                                                                   |
| Toast                      | ❌ `alert()`                                                                                               | `Notification` component + `showToast(EToastType.*)`                                                                      | sonner                                                                                                       |
| File upload pipeline       | ❌ placeholder only                                                                                        | [fileService.upload.ts](../../pgw-web/src/app/services/fileService/fileService.upload.ts)                                 | — (local only)                                                                                               |

## Verification plan for the May demo

End-to-end script to run at the May check-in, in order:

1. **Login + list** — real staff identity, real PG list data, tabs + search work.
2. **Create view-only announcement** — real classes + students populated, rich text composed, enquiry email picked from user profile, post → see new row in list.
3. **Detail page** — open the announcement we just posted, read-status table populated with seeded students.
4. **Post-with-response (acknowledge)** — type picker → questions authored → post → detail shows acknowledgement UX.
5. **Save draft + reopen** — create, save-draft, navigate away, come back, pick it up, publish.
6. **Schedule a post** — pick a date/time, confirm, see it in list with `SCHEDULED` status.
7. **Delete** — delete a draft with a confirmation modal.
8. **Error path** — kill the Go proxy mid-flow, observe the toast ("network error"), restart, retry succeeds.

Items 1–4 and 6–7 should all pass with the six starter items landed. Item 5 needs autosave or the starter items + navigation-save. Item 8 needs the 401/404 routing work.

## Risks

- **PG engineer assignment slips** → we can't exercise real staging writes. Mitigation: local pgw-web stays functional; screenshots/videos of the local flow are sufficient for the May decision.
- **Rich-text editor port lands buggy** — Tiptap's serialized format drift with pgw's parser. Mitigation: exchange via `JSON.stringify(Tiptap doc JSON)` already matches pgw's accepted shape (verified by our successful announcement creates).
- **CSRF stub fragility** — if pgw-web source changes in the next sibling pull, our docker `sed` might silently break. Mitigation: keep the patch small (one middleware file replacement) and add a CI smoke check.
- **File-upload gap surprises stakeholders** — demo will lack file attachments. Mitigation: show "Attachments coming soon" visibly, or run the demo with an announcement that doesn't need files.

## Non-goals

- Porting the entire prototype verbatim — pick the pieces that actually move the May decision
- Building the production PG's auth chrome (sign-in, OTP, inactivity) — belongs to platform, not this feature
- File uploads — distinct track, blocked by S3/scan infra
- Consent forms, PTM, custom groups UI — next priority per the meeting, not this window

## One-line recap

The core announcement flow is proven end-to-end. To be demoable with confidence at the May decision point, TW needs six small PRs: toast framework, Tiptap editor, questions payload, schedule UI, 401/404 routing, and autosave — roughly 10 focused hours, all independently shippable.
