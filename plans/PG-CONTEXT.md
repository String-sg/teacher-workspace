# Parents Gateway (PG) Clone — Project Context

**Purpose:** AI-agent context for vibe-coding the PG portal within teacher-workspace.
Read this alongside `VIBECODE.md` (coding standards) and `PG-specs.md` (full feature spec).

---

## What We're Building

A clone of Singapore's Parents Gateway (PG) portal — a school-to-parent communication platform used by MOE teachers. We reverse-engineer its UI and API contract to produce a fully functional staff-facing SPA within this repo's existing stack:

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + Vite (in `/web`)
- **Backend:** Go API server (in `/server`)

---

## Modules in Scope

| Module             | Route prefix                | Purpose                                        |
| ------------------ | --------------------------- | ---------------------------------------------- |
| Announcements      | `/announcements`            | Create/edit/post announcements to parents      |
| Forms (Consent)    | `/consentForms`             | Collect Yes/No/custom responses from parents   |
| Meetings (PTM)     | `/meetings`                 | 4-step wizard for parent-teacher meeting slots |
| Groups             | `/groups`                   | Assigned classes + custom student groups       |
| Reports            | `/staff/reports`            | Onboarding & travel declaration reports        |
| Account            | `/account`                  | Staff profile + recent logins                  |
| Notification Prefs | `/notification-preferences` | Per-event notification toggles                 |
| HeyTalia AI        | (right sidebar)             | AI assistant for drafting announcements/forms  |

---

## Key Architectural Decisions

- **Auth:** Cookie-based session. Every page load calls `GET /api/web/2/staff/session/current`. 401 → redirect to login.
- **Feature flags:** `GET /api/configs` gates HeyTalia, duplicate/schedule actions, and the web notification banner.
- **Rich text:** ProseMirror JSON format — `{type:"doc", content:[...]}` — not plain HTML strings.
- **URL state:** Tab state lives in query params (e.g. `?tab=sharedWithYou`), not React component state.
- **API prefix:** All staff endpoints under `/api/web/2/staff/…`
- **Layout:** Fixed navbar + scrollable content (max-width ~1100px, centred) + footer. HeyTalia panel slides in from the right and shifts main content left.

---

## Spec References

| File                                                                           | Contents                                                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `PG-specs.md`                                                                  | Full module-by-module FE spec: UI layouts, field definitions, validation rules, API endpoints, data model shapes |
| [GitHub issue #104](https://github.com/String-sg/teacher-workspace/issues/104) | Canonical source of the spec                                                                                     |

> **Before building any PG feature, read the relevant section in `PG-specs.md` first.**
