# TW ↔ PG Audit Findings

Tracking issue: [#5](https://github.com/rezailmi/teacher-workspace/issues/5)

Audit of gaps between Teacher Workspace and the actual Parents Gateway backend at `/Users/shin/Desktop/projects/pgw-web/`, conducted 2026-04-15 after local pgw-web setup was validated end-to-end.

## Priority summary

| Severity    | Category  | Finding                                                                                                               |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | Mappers   | `richTextContent` type mismatch will crash — TW treats as string, PG sends `Record<string, any> \| null`              |
| 🔴 Critical | Types     | Missing `POSTING` enum value in status types — announcements/consent forms in transit will break UI                   |
| 🔴 Critical | Auth      | `X-TW-Staff-ID` header is ignored by PG; production cross-domain cookies won't work                                   |
| 🟠 High     | Endpoints | `/announcements/{postId}/readStatus` not actually exposed by PG (read status only in detail response)                 |
| 🟠 High     | Mappers   | `extractTextFromTiptap` has no null guard — crashes on null richTextContent                                           |
| 🟠 High     | Types     | Many fields missing `\| null` (consentByDate, reminderDate, etc.)                                                     |
| 🟡 Medium   | Types     | Detail fields declared `unknown[]` should be typed (images, attachments, target, customQuestions, consentFormHistory) |
| 🟡 Medium   | Errors    | `-4031` is a redirect (302), not JSON — TW proxy/FE must handle                                                       |
| 🟡 Medium   | Endpoints | Many roadmap gaps (PTM, HeyTalia, file uploads, draft rescheduling, consent form replies)                             |

---

## 1. API contracts ([web/api/types.ts](../web/api/types.ts))

### Announcements

- **Missing `POSTING` status.** TW declares `'POSTED' | 'SCHEDULED' | 'DRAFT'`; PG also returns `'POSTING'` during send transition.
- **`richTextContent` wrong type.** TW: `string`. PG: `Record<string, any> | null` (raw Tiptap JSON).
- **`createdByName` declared optional, but PG always sends it** on summaries — tighten to required.
- **`images`, `attachments`, `websiteLinks` typed as `unknown[]`.** PG actually sends `{ imageId, isCover, name, size, thumbnailUrl, url }[]` for images (similar for others).
- **Missing `target` field on detail.** PG sends array: `{ announcementId, announcementTargetId, createdAt, isDeleted, targetAcadYear, targetId, targetName, targetSchool, targetType, updatedAt }[]`.

### Consent forms

- **Missing `consentByDate` on summaries** — essential for "form closes on" display; PG sends it.
- **Missing `eventStartDate`, `eventEndDate`, `eventReminderDate` on summaries.**
- **Missing `POSTING` status** (same issue as announcements).
- **`responseType` declared plain `string`** — should be a union of known response types (`'YES_NO'`, `'ACKNOWLEDGE'`, etc.).
- **Missing `venue` on detail.**
- **`customQuestions` and `consentFormHistory` typed `unknown[]`.** PG sends structured objects.
- **`reminderDate` declared `string`, PG returns `Date | null`.**
- **Missing `addReminderType` on detail.**

### Groups & school data

- **Assigned groups shape mismatch.** TW expects `{ classes, ccas, levels, school }`; PG returns `{ classes, ccaGroups }` with field name `ccaDescription` (not `ccaName`).
- **Class detail `formTeachers` declared but PG doesn't consistently return it** — verify and tighten.
- **Staff list has `schoolEmail` declared but PG only sends `email`.**

### Session / user

- **`displayUpdatedBy`, `displayUpdatedAt` declared required** — PG sends empty strings, TW should treat as `string | null` or accept `""`.
- **`staffSchoolId` missing on `PGApiUserProfile`** (present on `PGApiSession`).

### General

- **Null handling** is weak across the board. Many fields can be `null` but aren't declared that way.
- **Date format inconsistency.** All dates are ISO 8601 in Asia/Singapore tz — declare consistently.

---

## 2. Mappers ([web/api/mappers.ts](../web/api/mappers.ts))

### `mapAnnouncementSummary` (lines 21–51)

- **Missing `POSTING` handling.** `.toLowerCase()` works fine for the 3 known states, but cast `as PGStatus` will mask `POSTING` and downstream UI will break.
- **No null guard on `readMetrics`.** `Math.round` on undefined will throw if PG omits the field.
- **Draft status has no timestamp routing** — only `'posted'` → `postedAt` and `'scheduled'` → `scheduledAt`. `draft` falls through; `createdAt` is used as a generic fallback which may mislead.

### `mapAnnouncementDetail` (lines 56–102)

- 🔴 **`extractTextFromTiptap(detail.richTextContent)` will crash.** Function expects a string but PG sends a `Record` object. `JSON.parse()` on a non-string throws.
- **Null `richTextContent` unhandled.** Same function crashes on null.
- **`pgStatus: 'onboarded'` hardcoded** on recipients. PG sends `onBoardedCategory` with real values.

### `extractTextFromTiptap` (lines 141–148)

- 🔴 **No type guard.** Signature is `json: string` but must accept `Record | string | null`.
- **Nested Tiptap nodes (lists, tables, blockquotes) concatenate without separators** — produces unreadable plain text.

### `mapConsentFormSummary` (lines 107–112)

- **Returns input with minimal validation.** No null guards on `consentByDate`, `reminderDate` which PG can send as null.

---

## 3. Auth/session flow

### Login endpoints

| Path                                 | Purpose                     | Prod/Dev      |
| ------------------------------------ | --------------------------- | ------------- |
| `GET /session/login`                 | Real Singpass/MIMS redirect | Both          |
| `GET /identity/login/MIMScallback`   | MIMS OAuth callback         | Both          |
| `GET /identity/login/ad/tp/callback` | Azure AD TP callback        | Both          |
| `GET /identity/login/ad/np/callback` | Azure AD NP callback        | Both          |
| `GET /identity/login/BypassMIMS`     | MIMS bypass                 | Non-prod only |
| `GET /identity/login/ad/tp/bypass`   | AD TP bypass                | Non-prod only |
| `GET /identity/login/ad/np/bypass`   | AD NP bypass                | Non-prod only |

### Cookies set on login

| Cookie        | httpOnly           | Path | SameSite | Purpose                   |
| ------------- | ------------------ | ---- | -------- | ------------------------- |
| `session`     | via cookie-session | `/`  | `lax`    | Encrypted session payload |
| `session.sig` | via cookie-session | `/`  | `lax`    | HMAC SHA384 signature     |
| `session.id`  | **false**          | `/`  | none     | Encrypted sessionId       |
| `sessionType` | **true**           | `/`  | none     | `"school"` or `"hq1"`     |

- **Encryption:** AES-256-CBC via `ENCRYPTION_KEY` env var
- **Signing:** Keygrip SHA384 via `COOKIE_SESSION_KEY` (supports rotation via comma-separated keys)
- **Payload contents:** staffId, sessionId, staffName, schoolId, role, schoolEmail, is2FAAuthorized, sessionExpiryDate, csrfSecret, etc.

### CSRF

- **Required for** state-mutating requests (POST/PUT/DELETE) under `/api/web/*`
- **Request header name:** `xsrf-token`
- **Rotated** after each state-mutating request
- **Bypass in dev:** send `xsrf-token: csrfbypass`

### Session middleware chain

1. `ensureNotIhlMiddleware`
2. `ensureAuthenticatedMiddleware` — checks `session` cookie
3. `validateCookieTamperedMiddleware` — verifies `session.sig`
4. `extractCookieDataMiddleware` — decrypts into `req.user`
5. `validateCookieExpirationMiddleware`
6. `validateSessionDataMiddleware` — DB/Redis lookup
7. `validateSessionTypeMiddleware`
8. `validateStaffActivationStatusMiddleware`
9. `verifyRoleAccessMiddleware`
10. `extendSessionMiddleware` — sliding-window refresh (writes to Redis + DB)
11. Rate limit

### Session extension

- **Sliding**, extends by `SESSION_EXTEND_DURATION` (default 30 min) on every protected request
- **Absolute cap** via `absoluteExpiryDate` in DB
- **Debounced** via Redis key `sessionExpiry:lastupdatedat:{sessionId}` (only extends if >1s since last update)
- **Skip extension** via `X-No-Extend` request header

### 🔴 Production integration issues

1. **Proxy's `X-TW-Staff-ID` header is ignored.** PG middleware only reads `req.cookies.session`. Currently works locally because both TW and PG are on `localhost` and cookies leak across ports.
2. **Cross-domain cookies fail in production.** With TW on `tw.example.sg` and PG on `pg.example.sg`, browser won't send PG cookies to TW's proxy. Options:
   - Deploy under shared parent domain (`*.example.sg`) and set cookie `domain` attribute
   - Add a PG-side middleware that accepts `X-TW-Staff-ID` from whitelisted internal IPs
   - Service-to-service auth token, TW exchanges it for a PG session cookie
3. **CSRF propagation.** TW needs to read the `csrf` token from responses and echo it back as `xsrf-token` on writes, or bypass via IP allowlist.

---

## 4. Endpoint gaps

### 🔴 Unreachable endpoints TW frontend calls

- **`GET /announcements/{postId}/readStatus`** — TW calls `fetchAnnouncementReadStatus(postId)`. PG **does not expose this standalone**; read status is embedded in the detail response (`GET /announcements/{postId}`). TW must consume it from the detail instead.

### Path parameter / method mismatches

- **`PUT /{staffId}/updateDisplayEmail` / `updateDisplayName`** — these paths are at the root level (no `/users` prefix) and may collide with other routes via Go's ServeMux; verify ordering.
- **Draft scheduling:** TW uses `POST /announcements/drafts/schedule` (create flow). For **rescheduling** existing scheduled drafts, PG exposes `PUT /announcements/drafts/:announcementDraftId/rescheduleSchedule` — TW doesn't use this.

### Endpoints TW's old proxy list had but PG doesn't implement

- **`POST /api/files/2/preUploadValidation`** and **`GET /api/files/2/postUploadVerification`** — TW's plan listed these; they don't exist in pgw-web. File upload validation is unimplemented server-side.

### Roadmap gaps (PG has, TW doesn't use)

| Area                 | Endpoints                                                                       | Notes                                 |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| Draft scheduling     | `/announcements/drafts/{id}/rescheduleSchedule` (PUT), `/cancelSchedule` (POST) | For post-creation schedule management |
| Announcement sharing | `/announcements/{id}/addStaffInCharge`, `/removeAccess`                         | Multi-staff collaboration             |
| Post-publish edits   | `/announcements/{id}/enquiryEmailAddress` (PUT)                                 | Update email on sent announcements    |
| Consent form replies | `/consentForms/{formId}/student/{studentId}/reply` (PUT)                        | Staff-submitted responses             |
| PTM                  | `/ptm/*` (~20 endpoints)                                                        | Parent-teacher meeting scheduling     |
| HeyTalia             | `/heytalia/*` (~8 endpoints)                                                    | AI assistant                          |
| Group utilities      | `/groups/custom/validateStudents`, `/groups/student/count`                      | Custom group management               |
| Travel declaration   | `/school/travelDeclaration`                                                     | Staff travel tracking                 |

---

## 5. Error handling

### Response shapes

Success:

```
{ body: <T>, resultCode: number, message: string, metadata?: {...} }
```

Error:

```
{ resultCode: number, error: { errorId, errorReason, customMessage? }, body?, metadata? }
```

### Result code catalog (abridged — TW-relevant codes)

| Code                    | HTTP    | Meaning                                     | TW behavior                         |
| ----------------------- | ------- | ------------------------------------------- | ----------------------------------- |
| `1`, `2001`, `2002`     | 200     | Success                                     | Pass through                        |
| `-1`, `-400`            | 400     | Generic failure / validation                | Show error toast                    |
| `-4001`                 | 400     | Email missing                               | Form-level error                    |
| `-4002`                 | 400     | Concurrent request                          | Debounce / retry guidance           |
| `-4003`                 | 400     | Invalid rich text schema                    | Form error — Tiptap output rejected |
| `-4004`                 | 400     | Rich text length exceeded                   | Form error                          |
| `-401`                  | 401     | Session expired                             | Trigger re-auth                     |
| `-4011`                 | 401     | Wrong session type                          | Logout + re-auth                    |
| `-4013`                 | 401     | Invalid CSRF                                | Refresh CSRF token, retry once      |
| `-403`                  | 403     | Unauthorized access                         | Error page                          |
| `-4031`                 | **302** | 🔴 **Redirect** to `/error/-4031`, not JSON | Must handle `Location` header       |
| `-4032`                 | 403     | Insufficient permission                     | Error page                          |
| `-4033`                 | 403     | 2FA required                                | Prompt MFA                          |
| `-404`                  | 404     | Not found                                   | Not-found view                      |
| `-429`                  | 429     | Rate limited                                | Backoff + retry                     |
| `-500`, `-5001`–`-5005` | 500     | Server / upstream MIMS failures             | Generic error                       |

### 🟡 Special case: `-4031` is a 302 redirect, not JSON

Auth failures during login callback redirect the browser to `/error/-4031` (HTTP 302). TW's reverse proxy and frontend need to distinguish this from regular JSON errors — otherwise the user sees a broken JSON parse error instead of a login-failed page.

### Metadata

Every response includes `metadata.sessionExpDate` — TW can proactively show "session expiring soon" UI without an extra request.

---

## Things we deliberately skipped

See [docs/local-pgw-web-setup.md](local-pgw-web-setup.md#known-issues-and-considerations) — AWS S3, Firebase push, Sendbird, Google Calendar, SendGrid, WOGAA analytics. These are not blockers for core API testing.

## Recommended next steps

1. **Fix the critical mapper bugs first** (`extractTextFromTiptap` type + null handling, `POSTING` status). These cause runtime crashes.
2. **Tighten types** around nullability and enum values — prevents the next round of bugs.
3. **Decide production auth strategy** — this is the biggest unknown and needs alignment with the PG team.
4. **Remove the `/readStatus` frontend call** — consume from detail response instead.
5. **Decide roadmap for feature gaps** (PTM, sharing, scheduling) — product decision, not tech blocker.
