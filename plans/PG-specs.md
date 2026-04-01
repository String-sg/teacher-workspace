# Parents Gateway (PG) Portal — Complete Frontend Specification

**Version:** 2.0 — Combined & Reconciled  
**Date:** 25 Mar 2026  
**Source:** Reverse-engineered from `stable-pg.moe.edu.sg`  
**Purpose:** AI-agent-ready FE spec for vibe-coded PG clone within Teacher Workspace (TW) context

---

## TABLE OF CONTENTS

1. [Global Architecture & Tech Stack](#1-global-architecture--tech-stack)
2. [Global Layout & Shell](#2-global-layout--shell)
3. [HeyTalia AI Sidebar](#3-heytalia-ai-sidebar)
4. [Announcements Module](#4-announcements-module)
5. [Forms (Consent Forms) Module](#5-forms-consent-forms-module)
6. [Meetings (PTM) Module](#6-meetings-ptm-module)
7. [Groups Module](#7-groups-module)
8. [Reports Module](#8-reports-module)
9. [Account & Profile](#9-account--profile)
10. [Notification Preferences](#10-notification-preferences)
11. [Error / 404 Page](#11-error--404-page)
12. [API Reference & Data Models](#12-api-reference--data-models)

---

## 1. GLOBAL ARCHITECTURE & TECH STACK

### 1.1 Tech Stack (Observed)

- **SPA (Single Page Application)** — React (inferred from build artefacts: `runtime.[hash].js`, `vendors.[hash].js`, `app.[hash].js`)
- **Routing:** Client-side with URL-based state (e.g. `?tab=sharedWithYou` for tab sync). The server returns the same `index.html` shell for all paths. A nonce ID is embedded in the DOM (`<div id="nonceId">`) for CSP.
- **Build:** Webpack (hashed asset filenames)
- **Fonts:** Custom `.woff2` and `.ttf` font files served from `/assets/fonts/`
- **Analytics:** Google Analytics 4 (`G-6JMM65B0WY`), WOGAA (Singapore government analytics via `assets.dcube.cloud`)
- **Sentiment widget:** `sentiments.esm.js` from dcube.cloud (floating smiley feedback button in bottom-left)
- **Rich text:** ProseMirror-compatible JSON schema (content stored as JSON with `{type: "doc", content: [...]}`)

### 1.2 Base URL Structure

```
https://stable-pg.moe.edu.sg/
  /announcements                    → Announcements list (default landing)
  /announcements/new                → Create announcement form
  /announcements/edit/:id           → Edit announcement draft
  /announcements/details/:id        → Announcement detail / read status
  /announcements/preview            → Announcement preview (phone mockup)
  /announcements/drafts/:id         → Draft view (auto-saved from HeyTalia)
  /consentForms                     → Forms list
  /consentForms/new                 → Create form
  /consentForms/edit/:id            → Edit form draft
  /consentForms/details/:id         → Form detail / responses
  /consentForms/drafts/:id          → Draft view (auto-saved from HeyTalia)
  /meetings                         → Meetings list
  /meetings/new                     → Create meeting (multi-step wizard)
  /meetings/details/:id             → Meeting detail / schedule
  /groups                           → Groups overview
  /groups/customGroups/new          → Create custom group
  /groups/customGroups/:id          → Custom group detail
  /groups/customGroups/:id/edit     → Edit custom group
  /groups/customGroups/:id/edit/addStudents → Add students to group
  /staff/reports                    → Reports (Onboarding + Travel Declaration)
  /account                          → Profile page
  /notification-preferences         → Notification preferences
  /admin/...                        → Admin view (role-gated)
  /[404]                            → Branded 404 page
```

### 1.3 Authentication & Session

- Session managed server-side with cookie (no JWT in localStorage observed)
- On every page load the app calls `GET /api/web/2/staff/session/current` to validate session and get user context
- Session expires at a specific datetime (`metadata.sessionExpDate`)
- `sessionTimeLeft` field in session response (in seconds, e.g. 1799 = ~30 min)
- `is2FAAuthorized` flag exists (2FA capability in system)
- `isIhl` flag (Institution of Higher Learning context)
- `heyTaliaAccess` boolean flag for AI feature gating
- On 401 responses → redirects to login/SSO

**Session payload shape:**

```json
{
  "staffId": 1013,
  "staffName": "EBI HO BIN BIN",
  "isA": true,
  "staffSchoolId": 1001,
  "staffEmailAdd": "parentsgateway.otp+PGU00391@gmail.com",
  "is2FAAuthorized": false,
  "schoolEmailAddress": "sandwich_pri@moe.edu.sg",
  "schoolName": "SANDWICH PRIMARY SCHOOL",
  "sessionTimeLeft": 1799,
  "displayName": "",
  "displayEmail": "",
  "displayUpdatedBy": "",
  "displayUpdatedAt": "",
  "isAdminUpdated": false,
  "isIhl": false,
  "heyTaliaAccess": true
}
```

### 1.4 Feature Flags / Config

**API call:** `GET /api/configs`

Returns feature flags and configs controlling which UI elements are visible:

```json
{
  "flags": {
    "absence_submission": { "enabled": true },
    "duplicate_announcement_form_post": { "enabled": true },
    "heytalia_chat": { "enabled": true },
    "schedule_announcement_form_post": { "enabled": true }
  },
  "configs": {
    "absence_notification": { "blacklist": [] },
    "two_way_comms": {
      "isTwoWayCommsBetaEnabled": true,
      "twoWayCommsBetaSchoolWhiteList": []
    },
    "web_notification": {
      "enabled": false,
      "endDateTime": "...",
      "message": "",
      "startDateTime": "..."
    }
  }
}
```

**Flag-to-UI logic:**

- `flags.duplicate_announcement_form_post.enabled` → show/hide Duplicate action in kebab menus
- `flags.schedule_announcement_form_post.enabled` → show/hide Schedule Send fields in create/edit forms
- `flags.heytalia_chat.enabled` AND `session.heyTaliaAccess` → show/hide HeyTalia button in navbar

---

## 2. GLOBAL LAYOUT & SHELL

### 2.1 Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ NAVBAR (fixed top, white bg, subtle bottom shadow)       │
│ [PG logo] [Announcements] [Forms] [Meetings] [Groups]   │
│           [Reports]                   [HeyTalia] [👤]    │
├──────────────────────────────────────────────────────────┤
│ PAGE CONTENT (scrollable)                                │
│ max-width: ~1100px, centered                             │
│                                                          │
│ [HeyTalia slide-in panel, right side, ~860px wide]       │
├──────────────────────────────────────────────────────────┤
│ FOOTER (white, bottom)                                   │
│ © 2018 Ministry of Education, Singapore. All rights      │
│ reserved. Last updated on [date]       Help & Support ↗  │
│                                              Report Vulnerability ↗ │
└──────────────────────────────────────────────────────────┘
```

A circular smiley-face emoji button (🙂) floats at the bottom-left corner — this is a feedback/widget element (Freshdesk/WOGAA Sentiments).

### 2.2 Top Navigation Bar

- **Left:** PG logo (SVG, acts as link to `/announcements`)
- **Center nav links (horizontal):** Announcements | Forms | Meetings | Groups | Reports
  - Each is an `<a>` link; active page link has an orange/coral underline indicator (2px)
- **Right:**
  - **HeyTalia button:** pill-shaped, shows avatar + "HeyTalia" label + "Beta" badge in lavender/purple — toggles the AI chat sidebar. Only visible when `flags.heytalia_chat.enabled && session.heyTaliaAccess`.
  - **User avatar icon:** grey circular person icon (far right) — opens profile dropdown on click

### 2.3 User Profile Dropdown

Clicking the avatar circle opens a dropdown with:

- Displays: `{staffName}`
- **View Profile** → `/account`
- **Switch to Admin View** (icon: shuffle arrows) — only if user has admin role → `/admin/...`
- **Notification Preferences** (icon: mail envelope) → `/notification-preferences`
- **What's New** (icon: gift box) → opens a changelog/news modal
- **Help & Support** (icon: question circle) → external link (`https://go.gov.sg/pgsupport`)
- **Logout** (in orange/coral, destructive) → ends session

### 2.4 Footer

```
© 2018 Ministry of Education, Singapore. All rights reserved.
Last updated on [date]                    Help & Support   Report Vulnerability
```

- Help & Support → `https://go.gov.sg/pgsupport`
- Report Vulnerability → `https://www.tech.gov.sg/report_vulnerability`

### 2.5 Global Alerts & Banners

- **Network connectivity banner (orange):** "You seem to have a bad network connection. Some functionality will be unavailable until your network is restored." — persistent, dismissible only via `X` button. Appears when JS detects fetch failures.
- **Session warning:** Inferred from `sessionTimeLeft` — likely modal or banner when <5 min left. Redirects to login/SSO on 401.
- **Web notification banner:** Rendered from `configs.web_notification` when `enabled: true`. Shown between `startDateTime` and `endDateTime`.
- **Success toast notifications (green, top of page):** E.g., "'[Title]' has been duplicated successfully. You can view it here." (with a blue hyperlink to the new draft)

### 2.6 Floating Feedback Widget

- Bottom-left: Animated smiley face emoji button (`sentiments.esm.js` from dcube.cloud)
- Submits satisfaction feedback to WOGAA/Snowplow

---

## 3. HEYTALIA AI SIDEBAR

### 3.1 Overview

HeyTalia is an AI assistant sidebar that slides in from the right side of the viewport (~860px wide panel). The main content shifts left when the panel is open. Gated by `flags.heytalia_chat.enabled && session.heyTaliaAccess`.

**Important disclaimer shown at the bottom of all states:**

> "Use HeyTalia only for information up to Official Closed / Sensitive Normal. She's still learning and may make mistakes. Always check responses before use."

### 3.2 Toolbar (Top of Panel)

```
[HeyTalia avatar] Hey Talia  [BETA badge]        [✏️] [🕐] [💬] [—]
```

| Icon               | Action                                                             | Tooltip         |
| ------------------ | ------------------------------------------------------------------ | --------------- |
| ✏️ (pencil)        | Starts a new conversation; resets panel to welcome state           | "New chat"      |
| 🕐 (clock)         | Opens "Conversation History" modal                                 | —               |
| 💬 (speech bubble) | Opens "Share your feedback" modal                                  | —               |
| — (dash/minimise)  | Collapses the sidebar entirely (back to HeyTalia button in navbar) | "Minimize chat" |

### 3.3 Welcome State

Displayed when no active conversation exists (new chat or after "New chat" reset):

```
[Talia avatar]
Hey, [STAFF NAME]!
How can I help you today?

[Create announcement]  [Create form]

Enter only the intended title of your announcement or form.
e.g. Term 4 letter 2026. You can add on details later!

📎 [How can I help?]                              [↑ send]
```

- Hint text is persistent below the quick action buttons
- Text input at bottom: placeholder "How can I help?"
- Paperclip icon (📎) for file attachment (triggers file input)
- Send button (arrow icon) + "Enter to send" hint

### 3.4 "Create Announcement" Quick Action Flow

**Trigger:** Click "Create announcement" button

**Step 1** — User message bubble (lavender/purple): "I want to create a draft Announcement"

**Step 2** — AI response: "Let's get started! Tell me the title of the announcement."

- Hint bubble (💡 bulb icon, light blue): "Enter only the intended title of your announcement or form. e.g. Term 4 letter 2026."

**Step 3** — User types title, presses Enter

**Step 4** — AI generates draft response:

```
Here's your Announcement draft:

Title: [Title entered by user]
Description:
[AI-generated multi-paragraph announcement content]
[May include bullet points, [For input] placeholders for missing data]

[Reference file/image placeholder if relevant]

[Instructional footer note about [For input] fields + hyperlink restriction]
```

**Action buttons (bottom of AI response bubble):**

```
[📋 Copy]  [✏️ Edit]  [👍]  [👎]          [Send email]  [Use draft]
```

#### 👍 (Thumbs up) behaviour:

- Tooltip: "Good response"
- Expands "Tell us more:" feedback panel below response
- Tag chips (click to select): "Tone matched school style" | "Contains all key details" | "Concise and clear" | "Factually correct" | "Others"
- X to close the feedback panel

#### 👎 (Thumbs down) behaviour:

- Tooltip: "Bad response"
- Expands "Tell us more:" panel with negative tags: "Tone doesn't match school style" | "Missing key details" | "Too wordy / unclear" | "Not factually correct" | "Others"
- X to close

#### 📋 (Copy) behaviour:

- Copies full draft text to clipboard. No visible feedback/toast observed.

#### ✏️ (Edit) behaviour:

- Response bubble transforms into an inline rich text editor
- Toolbar appears: **B** (bold) | _I_ (italic) | A (colour) | ≡ (list)
- Cancel and Confirm buttons appear
- Cancel: reverts to static response view
- Confirm: saves edits and returns to static view

#### Send email button:

- Opens "Add email recipient(s)" modal
- Shows **Recent recipients** as clickable pill chips (past emails used)
- Text input: "email@schools.gov.sg" placeholder; press Enter to add
- Instruction: "Type an email and press Enter to add"
- Buttons: "× Cancel" | "Preview" (disabled until ≥1 recipient added)
- "Preview" shows an email preview before sending

#### Use draft button:

- Navigates to `/announcements/drafts/:id` — a pre-populated announcement edit form
- The form is pre-filled with AI-generated title and description
- Auto-save is active: "Last saved today at HH:MM AM"

### 3.5 "Create Form" Quick Action Flow

**Trigger:** Click "Create form" button

- User message bubble: "I want to create a draft Form"
- AI response: "Let's get started! Tell me the title of the form."
- Hint bubble: "Enter only the intended title of your form! e.g. Consent for Learning Journey. You can add on details later!"

**Generated form draft structure:**

```
Here's your Form draft:

Title: [Title]
Description: [AI-generated multi-paragraph description]
[What to bring: bulleted list if event-related]

Response type: Yes / No
Questions:
  1. [Question 1]
  2. [Question 2]
  3. [Question 3]
Event start: [For input] at [For input]
Event end: [For input] at [For input]
Venue: [For input]
Due date to respond by: [For input]

Your draft is missing some details. Do check out the [For input] fields
and use the Edit tool to update them! Hyperlinks are **not supported** in
the Description field when using 'Use draft'.
```

Same action buttons as announcement: Copy | Edit | 👍 | 👎 | Send email | Use draft

"Use draft" for forms → navigates to `/consentForms/drafts/:id`

### 3.6 Conversation History Modal

- **Trigger:** Click 🕐 toolbar button
- **Title:** "Conversation History (N)" (N = number of past conversations)
- **Content:** Scrollable list of past conversation sessions
- Edit button next to each entry (to resume/rename)
- **Close:** X button

### 3.7 Feedback Modal

- **Trigger:** Click 💬 toolbar button
- **Title:** "Share your feedback"
- **Content:** 5-star rating widget + textarea for comments
- **Buttons:** Cancel | Submit

---

## 4. ANNOUNCEMENTS MODULE

### 4.1 Announcements List Page (`/announcements`)

**Page Header:**

- H1: "Announcements"
- Top-right CTA: "+ New announcement" button (orange/coral solid) → navigates to `/announcements/new`

**Tab Navigation:**

- Tab 1: "Created by you" (default, URL param: none or `?tab=createdByYou`)
- Tab 2: "Shared with you" (URL param: `?tab=sharedWithYou`)
- Active tab has blue/orange underline indicator

**Search & Filter Bar:**

- Search input (full width minus filter button)
  - Placeholder: "Search for announcement title"
  - Left icon: magnifying glass
  - Triggers live search filtering (debounced) or on-submit
- "Filter" button (right, grey, with sliders icon) → opens Filter modal

**Filter Modal:**

- Title: "Filter" with close X
- Section: "Posted / Edited / Scheduled Date"
  - Date from (DD/MM/YYYY picker) — to — Date to (DD/MM/YYYY picker)
- Section: "Status"
  - Checkbox options: `[ ] Posted`, `[ ] Draft`, `[ ] Scheduled`
- Actions: "Apply filters" (orange button), "Clear all filters" (orange link text)

**Announcements Table — "Created by you" tab:**

| Column        | Details                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| TITLE         | Truncated title text (ellipsis), bold. Clickable → navigates to `/announcements/details/:postId`       |
| Date          | "Posted on DD Mon YYYY" or "Edited on DD Mon YYYY" (two-line cell)                                     |
| STATUS        | Pill badge — "Posted" (green outline), "Draft" (grey/blue outline), "Scheduled" (yellow/amber outline) |
| TO PARENTS OF | Comma-separated group/class names                                                                      |
| # READ        | "X / Y" format + progress bar below                                                                    |
| (Actions)     | Three-dot menu icon (kebab ⋮)                                                                          |

**"Shared with you" tab adds a column:**

| Column     | Details                                 |
| ---------- | --------------------------------------- |
| CREATED BY | Staff name who created the announcement |

**Kebab Menu Actions (per row):**

| Status    | Available Actions                           |
| --------- | ------------------------------------------- |
| Draft     | Edit, Duplicate, Delete (red text)          |
| Posted    | Duplicate only                              |
| Scheduled | Edit, Cancel schedule, Duplicate (inferred) |

**Pagination:**

- Rows per page selector: dropdown (values: 10, 25, 50 — inferred)
- "Showing X - Y of Z posts" summary
- Prev/Next + numbered page buttons
- Observed 34+ posts in production

**API Endpoints:**

- `GET /api/web/2/staff/announcements` → "Created by you" tab
- `GET /api/web/2/staff/announcements/shared` → "Shared with you" tab

**List Item Data Shape:**

```json
{
  "id": "ann_1036",
  "postId": 1036,
  "title": "...",
  "date": "2026-03-24T03:12:51.000Z",
  "status": "POSTED",
  "toParentsOf": ["Boxing", "H6-05"],
  "readMetrics": {
    "readPerStudent": 0,
    "totalStudents": 2
  },
  "scheduledSendFailureCode": null,
  "createdByName": "STACY WU YONG GUANG"
}
```

---

### 4.2 Create/Edit Announcement (`/announcements/new`, `/announcements/edit/:id`)

**Page Header:** "Create new announcement" (or "Edit announcement")  
**Subheading:** "Share information with parents"

**Bottom Bar (sticky):** "Save as draft" (orange outline) | "Preview" button (orange filled)

#### Section 1: RECIPIENTS (PARENTS)

- **Students\*** (required) — "Clear all" link top-right
  - Helper text: "You may select student groups, individual students or both."
  - Note: "Note: Parents of these students will receive the announcement"
  - Autocomplete search input: placeholder "Search students or student groups here"
  - Dropdown shows categorised results with tabs:

| Tab         | Examples                                              |
| ----------- | ----------------------------------------------------- |
| **All**     | All options combined                                  |
| **Class**   | H6-05 (2026), P1 HAPPINESS (2026), P1 KINDNESS (2026) |
| **Level**   | PRIMARY 1 (2026), PRIMARY 6 (2026), PRE-U 1 (2026)    |
| **CCA**     | AEROBICS, AIR RIFLE / SHOOTING, DANCE & DRAMA CLUB    |
| **School**  | SANDWICH PRIMARY SCHOOL                               |
| **Group**   | Custom groups created by the teacher                  |
| **Student** | Individual students by name                           |

- Selected items appear as removable chips/tags

#### Section 2: RECIPIENTS (SCHOOL STAFF)

- **Staff-in-charge** (optional) — "Clear all" link top-right
  - Info tooltip (ⓘ) on label
  - Helper: "These staff will be able to view read status, and delete the announcement"
  - Autocomplete input: placeholder "Who are the other staff involved?"
  - Dropdown categorised by tabs: **Individual**, **Level**, **School**
  - Lists all staff with their assigned class (e.g. "ANGELINE LIM HUI HUI - H6-05") and email

#### Section 3: ENQUIRY DETAILS

- **Enquiry email\*** (required)
  - Helper: "Select the preferred email address to receive enquiries from parents. You may set your default enquiry email address under [your account] (link to `/account`)."
  - Radio buttons:
    1. Staff's OTP/gateway email (e.g. `parentsgateway.otp+PGU00391@gmail.com`)
    2. School email (e.g. `sandwich_pri@moe.edu.sg`)
    3. "Other (please specify)" → reveals a free-text input

#### Section 4: CONTENT

- **Title\*** (required)
  - Single-line text input
  - Placeholder: "What would you like to say?" (alt observed: "What is this announcement about?")
  - Character counter: "120 characters left" (max 120)

- **Description\*** (required)
  - Rich text editor with toolbar:
    - **B** (Bold), _I_ (Italic), U (Underline)
    - Alignment dropdown (left/center/right/justify)
    - List dropdown (bullet list, numbered list)
  - Content area placeholder: "What should parents know about?" (alt: "Provide more information")
  - Character counter: "2000 characters left" (max 2000)
  - Stores as ProseMirror JSON: `{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"left"},"content":[...]}]}`

- **Shortcuts** (optional)
  - Label: "Direct parents to existing features within Parents Gateway app"
  - Checkboxes:
    - `[ ] Declare travels`
    - `[ ] Edit contact details`

- **Website link** (optional)
  - Info tooltip on label
  - Helper: "You may add up to 3 website links"
  - For each link: two fields in a row:
    - **Link** input (placeholder: "What is the URL?")
    - **Link description** input with tooltip (placeholder: "What is the link about?")
  - "+ Add website link" button (adds another row, up to 3 max)

- **File attachment** (optional)
  - Info tooltip on label
  - Helper: "You may add up to 3 files, less than 5 MB each"
  - Drag-and-drop zone: "Drag file here to upload"
  - "Add files" orange CTA button inside zone

#### Section 5: GALLERY

- **Photo gallery** (optional)
  - Info tooltip on label
  - Helper: "You may add up to 12 photos, and select up to 3 photos as cover images."
  - Drag-and-drop zone: "Drag photos here to upload"
  - "Add photos" orange CTA inside zone
  - After upload: each photo shown as thumbnail, select-as-cover toggle

#### Section 6: SETTINGS

- **Schedule send** (optional) — "Clear all" link top-right
  - Helper: "Select a date and time to send this post later. Leave blank to post right after preview."
  - Send announcement (required, radio):
    - ⬤ **Now** — posts immediately on clicking Publish
    - ⬤ **Later** — reveals date picker + time picker (dropdown with 15-min increments: 7:00AM to 9:45PM range)
  - Default reminders to parents (read-only, auto-computed based on send time). Shows "-" when not yet determined.
  - Only shown if `flags.schedule_announcement_form_post.enabled === true`

**Validation Rules:**

- Students field required — cannot preview/post without recipients
- Title required, max 120 chars
- Description required, max 2000 chars
- File size limit: 5MB per file, max 3 files
- Photo limit: 12 photos, max 3 cover images
- URL links: max 3, must be valid URLs
- Enquiry email: required, one option must be selected

**Draft expiry notice:** When loading a saved draft with uploaded files: "For security reasons, your uploaded file(s) in this draft will expire on [date]."

**Preview flow:** Clicking "Preview" validates all fields → navigates to `/announcements/preview` showing a phone mockup of the parent app view. From preview: "Post Now" button (disabled if required fields missing) or "Back" link. Auto-save ticker: "Last saved today at HH:MM AM".

---

### 4.3 Announcement Detail Page (`/announcements/details/:postId`)

**Page Header:**

- H1: Full announcement title (large)
- "To custodians of: [group/class names]" (orange label + value)
- Tab switcher: **Read Status** | **Details**

#### Read Status Tab (default)

**Stats row (clickable filter cards):**

| Card           | Behaviour                            |
| -------------- | ------------------------------------ |
| **[N] Total**  | Blue outline when selected (default) |
| **[N] Read**   | Grey, click to filter table          |
| **[N] Unread** | Grey, click to filter table          |

**Filter controls:**

- Status dropdown: "All Students" | Read | Unread | Not Onboarded (inferred)
- Class dropdown: "All Students" | individual classes
- Show Columns multiselect: "X columns selected"
  - Available columns: Name, Class/Index, Read Status, Read Time, First Read By, Status
- "Export to Excel" button (orange outline, export icon) — downloads `.xlsx`

**Response table:**

| Column        | Details                                                           |
| ------------- | ----------------------------------------------------------------- |
| Name          | Student full name + parent role in parens e.g. "(Pre-P1 Student)" |
| Class/Index   | e.g. "2027 Primary 1", class #index                               |
| Read Status   | "Read" or "Unread"                                                |
| Read Time     | DateTime or "—"                                                   |
| First Read By | Parent/staff name or "—"                                          |
| Status        | e.g. "Not Onboarded" (custodian onboarding status)                |

#### Details Tab

- "Posted on DD Mon YYYY, HH:MMam/pm by [StaffName]."
- **Staff-in-charge** section:
  - Lists current staff names
  - "+ Add" button (small, grey pill) → opens **"Add Staff-in-charge" Modal**
- **Enquiry Email** section:
  - Shows current email address
  - "Edit" button (small, grey pill, pencil icon) → opens **"Edit Enquiry Email" Modal**
- **Description** section: Rendered rich text content

- **OTHER ACTIONS** section (grey divider label):
  - "Duplicate this announcement" card → "Duplicate" button (orange outline)
  - On click: instant action; green success toast: "'[Title]' has been duplicated successfully. You can view it here." New draft created with "Copy of [Title]".

#### "Add Staff-in-charge" Modal

- **Title:** "Add Staff-in-charge"
- **Input:** "Who are the other staff involved?" (search/autocomplete)
- **Warning:** "Only add staff who need to have access to student details and to delete the announcement."
- **Buttons:** Cancel | Add

#### "Edit Enquiry Email" Modal

- **Title:** "Edit Enquiry Email"
- **Body:** "Select the preferred email address to receive enquiries from parents."
- **Radio options:**
  1. `parentsgateway.otp+PGU00391@gmail.com`
  2. `sandwich_pri@moe.edu.sg`
  3. "Other (please specify)" → free-text input
- **Buttons:** Cancel | "Edit" (disabled until a different radio is selected)

### 4.4 Delete Draft Confirmation Modal

- **Trigger:** Actions kebab → Delete (Drafts only)
- **Title:** "Delete draft?"
- **Body:** "Once you delete this draft, you will not be able to get it back again. This cannot be undone."
- **Buttons:** "No, not now" (link/text) | "Delete draft" (orange filled)
- No checkbox required — single-click confirmation

**API Endpoints:**

- `GET /api/web/2/staff/announcements/:postId` — announcement detail
- `GET /api/web/2/staff/announcements/:postId/readStatus` — read status per student

**Announcement Detail Data Shape:**

```json
{
  "announcementId": 1036,
  "content": null,
  "richTextContent": "{...prosemirror json...}",
  "title": "...",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:12:51.000Z",
  "postedDate": "2026-03-24T03:12:51.000Z",
  "enquiryEmailAddress": "...",
  "attachments": [],
  "images": [],
  "shortcutLink": [],
  "staffOwners": [{ "staffID": 1013, "staffName": "..." }],
  "students": [...]
}
```

---

## 5. FORMS (CONSENT FORMS) MODULE

### 5.1 Forms List Page (`/consentForms`)

**Page Header:** "Forms" + "+ New form" button (orange)

**Layout:** Identical pattern to Announcements list.

**Tab Navigation:**

- Tab 1: "Created by you" (default)
- Tab 2: "Shared with you"

**Search:** "Search for form title"  
**Filter button** → same modal pattern (date range + status)

**Table columns:**

| Column        | Details                                                          |
| ------------- | ---------------------------------------------------------------- |
| TITLE         | Form title, clickable                                            |
| Date          | "Posted on" / "Edited on" + date                                 |
| STATUS        | Pill: **Open** (green), **Draft** (grey-blue), **Closed** (grey) |
| TO PARENTS OF | Group/class names                                                |
| # RESPONDED   | "X / Y" + progress bar                                           |
| (Actions)     | Kebab menu                                                       |

**Status logic:**

- `OPEN` = posted and within the consent/response window (equivalent to "Active")
- `CLOSED` = response deadline passed
- `DRAFT` = not yet posted

**Kebab Actions:**

| Status      | Available Actions       |
| ----------- | ----------------------- |
| Draft       | Edit, Duplicate, Delete |
| Open/Closed | Duplicate only          |

**API:**

- `GET /api/web/2/staff/consentForms`
- `GET /api/web/2/staff/consentForms/shared`

**List Item Data Shape:**

```json
{
  "id": "cf_1038",
  "postId": 1038,
  "title": "Consent Form for Boxing Competition 1 April 2026",
  "date": "2026-03-24T03:08:05.000Z",
  "status": "OPEN",
  "toParentsOf": ["Boxing"],
  "respondedMetrics": {
    "respondedPerStudent": 0,
    "totalStudents": 2
  },
  "scheduledSendFailureCode": null
}
```

---

### 5.2 Create/Edit Form (`/consentForms/new`, `/consentForms/edit/:id`)

**Page Header:** "Create new form"  
**Subheading:** "Send forms to collect responses from parents"  
**Bottom Bar:** "Save as draft" (orange outline) | "Preview" button (orange filled)

#### Sections 1–3: Identical to Announcements

- **Recipients (Parents)** — same student groups combobox
- **Recipients (School Staff)** — same, but helper text differs: "These staff will be able to **view and edit responses**, and delete the form"
- **Enquiry Details** — same radio options

#### Section 4: CONTENT

Identical to Announcements: Title (120 char), Description (2000 char, rich text), Shortcuts, Website links, File attachments, Gallery.

#### Section 5: RESPONSE (unique to Forms)

- **Response type\*** (required)
  - Visual card selector (two options shown as phone mockup thumbnails):
    - **Yes or No** — parents can respond "Yes" or "No" with optional comment (default)
    - **Acknowledge** — parents tap to acknowledge, no Yes/No
    - **Custom** — defines custom response options (inferred from Doc 1)

- **Questions** (optional, repeatable):
  - Free-text question input
  - "+ Add question" button
  - Each question has a trash icon to delete

#### Section 6: EVENT DETAILS (unique to Forms)

- **Event start** (optional)
  - Date picker (placeholder: "Start date")
  - Time picker (dropdown, 30-min increments, 12:00AM to 11:30PM)
  - Arrow `→` separator between start and end

- **Event end** (optional)
  - Date picker (placeholder: "End date")
  - Time picker (30-min increments, same range)

- **Venue** (optional)
  - Text input
  - Placeholder: "Where would the location be?"
  - Character counter: "120 characters left"

#### Section 7: SETTINGS (unique to Forms)

- **Due date to respond by\*** (required)
  - Date picker (placeholder: "Due date")
  - Info tooltip: explains cutoff behaviour
  - **Default reminder:** "Default reminder will be sent on [date - 1 day] and [due date] (default)" — auto-computed

- **Send additional reminder(s) to parents\*** (required)
  - Radio options:
    - `( ) None`
    - `( ) One Time` — reveals "on [date picker]"
    - `( ) Daily` — reveals "from [date picker]"

- **Schedule send** (optional) — same as Announcements (gated by feature flag)

---

### 5.3 Form Detail Page (`/consentForms/details/:id`)

**Page Header:**

- H1: Form title
- Date range: "[DD Mon YYYY, HH:MM am — HH:MM pm]"
- "To custodians of: [groups]"
- Tabs: **Responses** | **Details**

#### Responses Tab

**Stats row (clickable cards):**

| Card            | Notes                         |
| --------------- | ----------------------------- |
| **[N] Total**   | Selectable                    |
| **[N] Yes**     | (or N/A for Acknowledge type) |
| **[N] Pending** | Not yet responded             |
| **[N] No**      | (for Yes/No type)             |

**Filter controls:** Status dropdown | Class dropdown | Show Columns | Export to Excel

**Table columns:**

| Column            | Notes                                              |
| ----------------- | -------------------------------------------------- |
| Name              | Student name + optionally "Edit Response" sub-link |
| Class/Index       |                                                    |
| Gender            | M/F                                                |
| Response          | "Pending" / "Yes" / "No" / "Acknowledged"          |
| Comments          | Parent's free text comment or "—"                  |
| Last responded by | Parent name who last responded                     |

**"Edit Response" Modal (for active forms):**

- **Title:** "Edit response for [Student Name] ([Student Type])"
- **Parent's response\*** (radio):
  - For Yes/No: "Yes" / "No"
  - For Acknowledgement: "Acknowledged" / "Not Acknowledged"
- **Comments** (textarea, 500 char max): "Visible to parents"
- **Buttons:** Cancel | "Update response" (orange)

#### Details Tab

- "Published on DD Mon YYYY, HH:MMam/pm by [StaffName]."
- "Response due: [date]"
- **Staff-in-charge** + "+ Add" button → same modal as Announcements
- **Enquiry Email** + "Edit" button → same modal as Announcements
- **Description** (rich text)
- **Venue**
- **Type of response:** "Acknowledge" or "Yes or No"
- **Response Due Date and Reminders** (with "Edit" button):
  - "Due date on [orange date]"
  - "Reminder on [date] and [date] (default)"

**"Edit Due Date" Modal:**

- **Title:** "Edit Due Date"
- **Warning banner:** "Parents will be notified of the new due date."
- Current due date (read-only display)
- New due date\* (date picker)
- Default reminder (auto-computed, read-only)
- Send additional reminders (radio): None | One Time | Daily
- **Buttons:** Cancel | "Update" (orange)

**OTHER ACTIONS section:**

- "Duplicate this form" → "Duplicate" button (orange outline)
- "Delete this form" card:
  - Warning text: "This will delete the form for all staff and parents. You can **never** get it back."
  - Checkbox: "I am sure I want to delete this form."
  - "Delete Forever" button (disabled until checkbox checked, then red/orange)

**Form Detail Data Shape:**

```json
{
  "consentFormId": 1038,
  "title": "...",
  "venue": "Temasek Secondary School",
  "content": null,
  "richTextContent": "{...prosemirror json...}",
  "responseType": "ACKNOWLEDGEMENT",
  "eventStartDate": "2026-04-01T04:00:00.000Z",
  "eventEndDate": "2026-04-01T09:00:00.000Z",
  "consentByDate": "2026-03-30T15:59:59.000Z",
  "addReminderType": "ONE_TIME",
  "reminderDate": "2026-03-29T15:59:59.000Z",
  "postedDate": "2026-03-24T03:08:05.000Z",
  "enquiryEmailAddress": "...",
  "staffName": "...",
  "createdBy": 1013,
  "createdAt": "...",
  "customQuestions": [],
  "consentFormHistory": [...]
}
```

---

## 6. MEETINGS (PTM) MODULE

### 6.1 Meetings List Page (`/meetings`)

**Page Header:** "Meetings" + "+ New meeting event" button (orange)

**Two sections:**

#### Upcoming meeting events

Table with enriched row layout:

| Element       | Details                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Date badge(s) | Month abbreviation + day number, e.g. "MAR 26" (or "MAR 26 — MAR 28" range)                       |
| Title         | Bold                                                                                              |
| Sub-info row  | Calendar icon + "N meeting days", clock icon + "N min per slot", grid icon + "N slots per timing" |
| Status line   | "Booking period has ended" (grey italic) or "Booking period: [date] - [date]" (active)            |
| Stats         | Available count, ✓ Booked count, ? Pending count, 👥 Total students                               |

**Status badges:** Upcoming | Booking Open | Booking Closed | Past

#### Past meeting events

Same layout but greyed out/muted styling (dates in grey instead of orange/blue)

**Row Click:** Navigates to `/meetings/details/:eventId`

**Actions kebab:** View | Edit | Delete (inferred)

**API:** `GET /api/web/2/staff/ptm` — returns both upcoming and past events

**List Item Data Shape:**

```json
{
  "eventId": 1001,
  "title": "Meeting with Boxing Coaches",
  "eventDates": [{ "startDateTime": "...", "endDateTime": "..." }],
  "bookingWindows": [{ "windowDate": { "startDateTime": "...", "endDateTime": "..." } }],
  "bookingSummary": { "available": 4, "pending": 2, "booked": 0 },
  "targetStudents": 2,
  "createdDate": "...",
  "slotDuration": 30,
  "bookingsPerSlot": 1
}
```

---

### 6.2 Create Meeting Wizard (`/meetings/new`)

**Page Header:** "Create new meeting event"  
**Subheading:** "Invite parents of selected students to book a meeting with you"

**4-step progress stepper:**

```
● Basic Info ——— ○ Meeting Details ——— ○ Booking Period ——— ○ Preview
```

Steps shown as connected circles; active step is orange-filled, completed steps show ✓ (orange checkmark), future steps are empty grey circles.

**"Quick tips" modal** (appears on first load):

- Body: "You can create meeting event: • for meetings on [date] onwards • that parents can book from [date] onwards"
- "Ok" button (orange)

#### Step 1: Basic Info

**Section heading:** "Basic meeting event information"  
**Subheading:** "Inform other staff and parents about this event"

- **Recipients (Parents) — Student groups\*** (required)
  - Note: "Note: Parents will be able to select from the available slots." (alt: "Parents of these students will choose from the same set of available slots")
  - Same autocomplete search as Announcements (All/Class/Level/CCA/School/Group)

- **Recipients (School Staff) — Staff-in-charge** (optional)
  - Helper: "These staff will be able to view and edit responses, and delete the meeting"
  - Input: "Add staff to manage this event"
  - Tabs: Individual | Level | School

- **Enquiry Details — Enquiry Email\*** (required): same radio options

- **Content:**
  - **Title\*** — 120 char limit. Placeholder: "E.g. 'PTM with Form/Math Teacher' or 'Meeting with Form & Co-Form Teachers'"
  - **Description\*** — 2000 char limit (rich text). Placeholder: "Additional details"
  - **Venue** (optional) — 120 char limit. Placeholder: "Where will the meeting be held?"
  - **Website link** (optional) — up to 3
  - **File attachment** (optional) — up to 3 files, 5MB each

- **Bottom:** "Next" button (orange)

#### Step 2: Meeting Details

**Section heading:** "Set meeting details"  
**Subheading:** "Define the duration and meetings available per time slot"

- **Meeting duration\*** (dropdown/combobox)
  - Options: 10 min to 720 min in 5-minute increments (143 total options)
  - Placeholder: "Select"

- **Max. number of meetings per time slot\*** (radio cards, 3 options):
  - "One" — 1 meeting per slot
  - "Two" — 2 meetings per slot
  - "Three" — 3 meetings per slot
  - Helper text: "E.g. if Form and Co-Form Teachers choose to meet the parents of 2 students at the same time, they may select the option 'Two'"

- **"Set meeting event date and time" section:**
  - Note: "You will be able to block out time for lunch and other matters separately after creating the meeting event"
  - For each Day (Day 1, Day 2, etc.):
    - Day N\* label (required)
    - Date picker — calendar widget, DD MMM YYYY format
    - From\* (start time input) — time picker with dropdown; options in 10-minute increments
    - → arrow separator
    - To\* (end time input) — time picker with dropdown (same 10-min increment options)
    - 🗑️ trash icon (to delete the day row)
  - "+ Add day" button — adds another Day row

- **SUMMARY box (live-updating, orange/light bg):**
  - "Based on your inputs"
  - "There will be [N] meeting available for booking by the parents of [M] students."
  - N = computed: (hours × 60 / duration_minutes) × max_slots_per_timeslot
  - M = total students in selected groups

- **Bottom:** "Back" (orange outline) | "Next" (orange filled)

#### Step 3: Booking Period

**Section heading:** "Set booking period"  
**Subheading:** "Parents will be able to book a meeting within this period"

- **Meeting event details** (read-only summary box, white card):
  - "You have selected N meeting day(s)"
  - Lists each day: "[Day of week], [DD MMM YYYY]" / "[HH:MM AM] – [HH:MM AM]"

- **Booking opens\*** (date + time, side by side):
  - Start date — calendar widget (only dates from "today onwards" selectable)
  - Start time — dropdown in 30-minute increments (12:00AM to 11:30PM, 48 options)

- → arrow separator

- **Booking closes\*** (date + time):
  - End date — calendar widget (only dates up to the meeting day selectable; meeting day and later are disabled)
  - End time — dropdown in 30-minute increments

- **Default reminders to parents** ℹ️ (info icon with tooltip):
  - Auto-computed: "On [1 day before booking opens]" and "On [1 day before booking closes]"
  - Shows "-" when booking dates not yet filled

- **Bottom:** "Back" (orange outline) | "Preview" (orange filled)

#### Step 4: Preview of Parent's View

**Section heading:** "Preview of parent's view"  
**Subheading:** "This is how parents will see your meeting on the Parents Gateway App."

**Carousel with 4 slides** (dot pagination + left/right arrows):

**Slide 1 — "On publish"**

- Label: "On publish"
- Date: [day of week, DD MMM YYYY]
- Push notification mock (dark, iOS-style):
  ```
  [PG app icon] Parents Gateway
  💬 Meeting invitation
  [Meeting Title]
  ```
- Phone mockup showing parent app view:
  - Title (bold, large)
  - "[DD MMM YYYY, HH:MMAM] • [Staff Name]"
  - [Student Name] (person icon)
  - EVENT DATES section
  - BOOKING badge: "NOT STARTED"
  - "You can book between: [date-time range]" (blue hyperlink)
  - EVENT DETAILS: [description]
  - "For enquiries on this post, please contact [email]"
  - "Booking not started" footer

**Slide 2 — "Booking opens"**

- Label: "Booking opens"
- Date: [booking open date]
- "No push notifications" placeholder (dashed grey box)
- Phone mockup with BOOKING OPEN badge (orange text)

**Slide 3 — "Booking closes"**

- Label: "Booking closes"
- Date: [booking close date]
- "No push notifications" placeholder
- Phone mockup showing a booked appointment:
  - YOUR APPOINTMENT DETAILS section: ✅ "[date/time]" (green checkmark, blue link)
  - Sample parent comment text
  - "View / Edit" link (blue)
  - BOOKING CLOSED badge

**Slide 4 — "Meeting starts"**

- Label: "Meeting starts"
- No date shown below
- "No push notifications" placeholder
- Illustration image (two people talking, chat bubbles)
- "Day N: [Day of week, DD MMM YYYY] / [HH:MMAM – HH:MMAM]" card overlay

**Bottom:** "Back" (orange outline) | "Publish" (orange filled)

---

### 6.3 Meeting Detail Page (`/meetings/details/:eventId`)

**Page Header:**

- H1: Event title
- "To custodians of: [groups]"
- Tabs: **Schedule** | **Details**

#### Schedule Tab

- "Total of N meeting day(s)"
- Date selector/navigation: "[DD MMM YYYY]" with left/right arrows (or dropdown for available days)
- "Export to Excel" button (top right)
- Status line: "You have [N] confirmed meetings on [Bold Date] (as at [HH:MM AM])."

**Timeslots list:** Each slot row:

- Left: time (e.g. "4:00 PM")
- Right panel: "Available" (white) or booked parent names
- **Action icons:**
  - ⊕ (plus) — Opens **"Add/edit details for slot" Modal**
  - ⊘ (block/circle-slash) — Immediately toggles slot to "Blocked" state (grey, "Blocked" label). No confirmation dialog. Clicking again on a blocked slot unblocks it.

**"Add/edit details for [Date/Time] slot" Modal:**

- **Title:** "Add/edit details for [Day DD MMM YYYY, HH:MM AM] slot"
- **Student search input:** "Search by student name" (autocomplete)
- **Parent comments textarea:** Placeholder for pre-filling parent-side notes (1500 char max, inferred)
- **Buttons:** Cancel | Save

#### Details Tab

- "Posted on DD Mon YYYY, HH:MM AM by [StaffName]." (right-aligned)
- **Meeting Details section:**

| Field                    | Value                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Meeting date(s) & time   | "Fri 3 Apr 2026 · 4:00 PM – 6:00 PM"                                                                                       |
| Meeting duration         | "30 min"                                                                                                                   |
| Meeting(s) per time slot | "1 meeting slot"                                                                                                           |
| Available meeting slots  | "4 meeting slots (as at HH:MM AM)"                                                                                         |
| Booking period           | "Mon 30 Mar 2026, 12:00 AM – Thu 2 Apr 2026, 12:00 PM"                                                                     |
| Default reminders        | "On Sun, 29 Mar 2026 (1 day before start of booking period)" and "On Wed, 1 Apr 2026 (1 day before end of booking period)" |

- **Staff Details section:**

| Field           | Value                                   |
| --------------- | --------------------------------------- |
| Staff-in-charge | [name] with "+ Add" button → same modal |
| Enquiry email   | [email] with "Edit" button → same modal |

- **OTHER ACTIONS:**
  - "Delete this meeting event" → "Delete" button → confirmation modal (inferred similar to other delete flows)

**API Endpoints:**

- `GET /api/web/2/staff/ptm/:eventId` — event detail
- `GET /api/web/2/staff/ptm/timeslots/:eventId` — timeslot schedule
- `GET /api/web/2/staff/ptm/bookings/:eventId?scheduleDate=[ISO date]` — bookings for a day

**Timeslot Data Shape:**

```json
{
  "eventDays": [
    {
      "date": "2026-04-02T16:00:00.000Z",
      "slots": [{ "slotId": 2592, "startDateTime": "2026-04-03T08:00:00.000Z" }]
    }
  ],
  "durationPerSlot": 30,
  "bookingsPerSlot": 1,
  "totalCount": 4
}
```

---

## 7. GROUPS MODULE

### 7.1 Groups Overview Page (`/groups`)

**Page Header:** "Groups"  
**CTA:** "+ Create custom group" (orange, top right)

#### Assigned Groups (AY [year])

- Info icon tooltip on heading
- Dark navy/indigo background panel
- 2-column responsive card grid
- Each card (white bg, slight shadow, rounded corners):
  - Group/Class name (bold, large)
  - Type label: "Form Class" or "CCA" (grey subtitle)
  - Level/class label (e.g., "P1 HAPPINESS")
  - Year (e.g., "2026")
- These are system-assigned (classes, CCAs) — read-only, cannot be deleted/edited

**Observed types:** Form Class (P1 KINDNESS), CCA (Untitled CCA, AIR RIFLE / SHOOTING, ARCHERY)

#### Custom Groups

- Section heading: "Custom Groups" (with info icon tooltip) + "Create New" button (orange)
- Shows "N custom group(s) created"
- Table:

| Column          | Notes                                              |
| --------------- | -------------------------------------------------- |
| Group name      | Clickable, navigates to `/groups/customGroups/:id` |
| No. of students | Right-aligned, people icon + number                |
| Created on      | Date                                               |
| Created by      | Staff name                                         |
| (Actions)       | Kebab: View, Edit, Delete                          |

**API:**

- `GET /api/web/2/staff/groups/assigned?type=summary` — assigned classes/CCAs
- `GET /api/web/2/staff/groups/custom?type=summary` — custom groups list

**Assigned Groups Data Shape:**

```json
{
  "classes": [
    {
      "classId": 1005,
      "classCode": "P1-02",
      "className": "P1 KINDNESS",
      "schoolId": 1001,
      "academicYear": "2026"
    }
  ],
  "ccaGroups": [
    { "ccaId": 1007, "ccaDescription": "" },
    { "ccaId": 1001, "ccaDescription": "AIR RIFLE / SHOOTING" }
  ]
}
```

**Custom Groups Data Shape:**

```json
[
  {
    "id": 1010,
    "groupName": "Boxing",
    "numberOfStaff": 1,
    "numberOfStudents": 6
  }
]
```

---

### 7.2 Custom Group Detail (`/groups/customGroups/:id`)

**Page Header:**

- H1: Group name (large, bold)
- Subtitle: "Custom Group"
- Tabs: **Students (N)** | **Details**

#### Students Tab

Students grouped by class section. Each class section:

```
[CLASS NAME (count)]  e.g. "P1 HAPPINESS (1)"
┌─────────────────────────────────────────────────────────┐
│ Student/Index                    Onboarded & Can Respond │
├──────────────────────────────────────────────────────────┤
│ [Student Name] ([Type])          [✓ or ✗]               │
│ [IC Number] | [Gender]                                  │
│ [× remove icon]                                         │
└──────────────────────────────────────────────────────────┘
```

- **Student types observed:** "(Pre-P1 Student)", "(MK2 + Pre-P1 Student)"
- **Onboarded & Can Respond** column: ✓ (checkmark) = parent is onboarded and can respond; ✗ (X) = not onboarded
- ℹ️ icon next to column header (tooltip explaining what this means)
- Each student row has a × icon to remove from group (immediate, no confirmation)

#### Details Tab

- "Created on DD Mon YYYY HH:MM am/pm by [StaffName]."
- **Group shared with:** [Staff names list]
- **OTHER ACTIONS section** (3 action cards):

| Card                     | Description                                                                              | Button                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Edit this custom group   | —                                                                                        | "Edit Group" (orange outline) → `/groups/customGroups/:id/edit` |
| Share this custom group  | "You will be granting access to edit this group. Please be certain."                     | "Share Group" (orange outline) → opens Share Group modal        |
| Delete this custom group | "Once you delete this custom group, you can never get it back again. Please be certain." | "Delete Forever" (orange outline) → opens Delete modal          |

---

### 7.3 Edit Group Page (`/groups/customGroups/:id/edit`)

**Page Header:** "Edit group"

- **Title\*** (text input, 120 char max, pre-filled)
- **Students section:**
  - "N students added."
  - "+ Add Students" button (orange outline) — opens dropdown:
    - "Add manually" → navigates to Add Students search page
    - "Upload via Excel" → disabled if group already has students ("Cannot be selected when the list has students")
  - Results table: "Showing N results"
    - Columns: Name + ID | Class/Index | CCA(s) | 🗑️ trash icon
    - "Delete All" link (orange) — removes all students from list
    - Each row has individual 🗑️ trash icon
- **Bottom:** "Cancel" (link) | "Save" (orange, disabled when no changes)

---

### 7.4 Add Students Page (`/groups/customGroups/:id/edit/addStudents`)

**Page Header:** "Add students" + X close button

- **Select a filter section:**
  - Groups radio: "All Students" | "CCA"
- **Search section:**
  - Text input: "Search student name or class name"
  - Level dropdown: "All levels" (with options for each level)
  - Form Class dropdown: "All classes" (with options for each class)
- **Results:**
  - "Showing N results / N students already added"
  - Table: checkbox | Name (+ ID) | Class/Index | CCA(s)
  - Select-all checkbox in header
  - Pagination if >N results
- **Bottom:** Cancel | "Add [N] selected" (orange, enabled when ≥1 checked)

---

### 7.5 Share Group Modal

- **Title:** "Share group"
- **Input:** "Which other staff to share with?" (search/autocomplete)
- **Information bullets:** "By sharing this group, other staff members will have access to:"
  - "- View and send to the group"
  - "- Edit the group name"
  - "- Add or delete students"
  - "- Share the group with other staff"
- **Buttons:** "Cancel" (link) | "Share group" (orange filled, disabled until ≥1 staff selected)

### 7.6 Delete Custom Group Modal

- **Title:** "Delete custom group?"
- **Body:** "Are you sure you want to delete "[Group Name]"?"
- **Checkbox:** "I understand that this action cannot be undone. This will permanently delete the custom group as I am the only staff with access to the group."
- **Button:** "Delete" (orange filled) — disabled until checkbox is ticked
- No Cancel button visible — only X to close

### 7.7 Create Custom Group (`/groups/customGroups/new`)

**Page Header:** "Create new group" (alt: "Create custom group")

- **Title\*** input (120 char max). Placeholder: "What would you like to call your group?"
- **Students section:**
  - "N students added." counter
  - "+ Add Students" button (orange outline with + icon) — same dropdown:
    - "Add manually"
    - "Upload via Excel" (enabled for new groups without students)
  - Empty state: "No students added yet." in grey box
  - Populated state: lists students with remove X
- **Bottom:** "Cancel" (text link) | "Create Now" / "Save" (orange, disabled until title + ≥1 student)

---

## 8. REPORTS MODULE

### 8.1 Reports Overview (`/staff/reports`)

**Page Header:** "Reports"  
**Tabs:** **Onboarding** | **Travel Declaration**

#### Onboarding Tab

- **Description:** "Form and Co-Form teachers are able to generate custodian onboarding status reports for their form class. To allow or remove PG access for custodians, please do so in School Cockpit. Updates will be reflected within 24 hours."
- "Generate onboarding status report for [ClassName]" — shows the teacher's form class
- **Filters:** Level dropdown | Class dropdown
- **"Export to Excel" button** (orange outline, export icon)

**Table columns:** Class | Total Students | Onboarded | % Onboarded | Not Onboarded

Can click a row to drill into class-level detail.

#### Travel Declaration Tab

- **Description:** "Form and Co-Form teachers are able to generate travel declaration reports for their form class."
- "Generate travel declaration report for [ClassName]"

**REPORT FILTERS section:**

- "Select declaration status" — radio options:
  - `(●) Did Not Declare (No declarations made)` (default)
  - `( ) Declared (Include travelling and not travelling)`
- "For the date range" — Start date → End date pickers
- **"Export to Excel" button**

**Table columns:** Student details + declaration details (inferred)

---

## 9. ACCOUNT & PROFILE

### 9.1 Account Page (`/account`)

**Page Header:** "My Account"  
**Tabs:** **Display Details** | **Recent Logins**

#### Display Details Tab

| Field    | Value           |
| -------- | --------------- |
| Name     | Staff Full Name |
| Staff ID | ID              |
| School   | School Name     |
| Email    | email address   |

- "You may set your default enquiry email address here" (explanatory text)
- **Preferred Enquiry Email** field with Edit functionality (same radio options as create forms)

#### Recent Logins Tab

Table showing recent login history:

- Columns: Date/Time | Device | Browser | Location/IP (inferred)

---

## 10. NOTIFICATION PREFERENCES

**URL:** `/notification-preferences`  
**Page Header:** "Notification Preferences"

**Settings for Yes/No form notifications:**

Checkbox list for different notification scenarios:

- "When a parent responds 'Yes'"
- "When a parent responds 'No'"
- "When a parent changes their response" (inferred — document truncated)

---

## 11. ERROR / 404 PAGE

- Centered layout
- PG logo (sad/confused variant)
- **"Page Not Found"** heading
- "The page you're looking for could not be found."
- **"Back to previous page"** link (orange, navigates to `window.history.back()`)

---

## 12. API REFERENCE & DATA MODELS

### 12.1 Session & Config

| Endpoint                           | Method | Description                           |
| ---------------------------------- | ------ | ------------------------------------- |
| `/api/web/2/staff/session/current` | GET    | Validate session, get user context    |
| `/api/configs`                     | GET    | Feature flags and config              |
| `/api/web/2/staff/configs`         | GET    | Staff-specific configs (alt endpoint) |

### 12.2 Announcements

| Endpoint                                            | Method | Description             |
| --------------------------------------------------- | ------ | ----------------------- |
| `/api/web/2/staff/announcements`                    | GET    | List (created by you)   |
| `/api/web/2/staff/announcements/shared`             | GET    | List (shared with you)  |
| `/api/web/2/staff/announcements/:postId`            | GET    | Detail                  |
| `/api/web/2/staff/announcements/:postId/readStatus` | GET    | Read status per student |

### 12.3 Forms (Consent Forms)

| Endpoint                               | Method | Description            |
| -------------------------------------- | ------ | ---------------------- |
| `/api/web/2/staff/consentForms`        | GET    | List (created by you)  |
| `/api/web/2/staff/consentForms/shared` | GET    | List (shared with you) |
| `/api/web/2/staff/consentForms/:id`    | GET    | Detail                 |

### 12.4 Meetings (PTM)

| Endpoint                                                    | Method | Description            |
| ----------------------------------------------------------- | ------ | ---------------------- |
| `/api/web/2/staff/ptm`                                      | GET    | List (upcoming + past) |
| `/api/web/2/staff/ptm/:eventId`                             | GET    | Event detail           |
| `/api/web/2/staff/ptm/timeslots/:eventId`                   | GET    | Timeslot schedule      |
| `/api/web/2/staff/ptm/bookings/:eventId?scheduleDate=[ISO]` | GET    | Bookings for a day     |

### 12.5 Groups

| Endpoint                                        | Method | Description           |
| ----------------------------------------------- | ------ | --------------------- |
| `/api/web/2/staff/groups/assigned?type=summary` | GET    | Assigned classes/CCAs |
| `/api/web/2/staff/groups/custom?type=summary`   | GET    | Custom groups list    |

### 12.6 Key Data Models

#### Session

```json
{
  "staffId": 1013,
  "staffName": "EBI HO BIN BIN",
  "isA": true,
  "staffSchoolId": 1001,
  "staffEmailAdd": "parentsgateway.otp+PGU00391@gmail.com",
  "is2FAAuthorized": false,
  "schoolEmailAddress": "sandwich_pri@moe.edu.sg",
  "schoolName": "SANDWICH PRIMARY SCHOOL",
  "sessionTimeLeft": 1799,
  "displayName": "",
  "displayEmail": "",
  "displayUpdatedBy": "",
  "displayUpdatedAt": "",
  "isAdminUpdated": false,
  "isIhl": false,
  "heyTaliaAccess": true
}
```

#### Announcement (List Item)

```json
{
  "id": "ann_1036",
  "postId": 1036,
  "title": "...",
  "date": "2026-03-24T03:12:51.000Z",
  "status": "POSTED",
  "toParentsOf": ["Boxing", "H6-05"],
  "readMetrics": { "readPerStudent": 0, "totalStudents": 2 },
  "scheduledSendFailureCode": null,
  "createdByName": "STACY WU YONG GUANG"
}
```

#### Announcement (Detail)

```json
{
  "announcementId": 1036,
  "content": null,
  "richTextContent": "{...prosemirror json...}",
  "title": "...",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:12:51.000Z",
  "postedDate": "2026-03-24T03:12:51.000Z",
  "enquiryEmailAddress": "...",
  "attachments": [],
  "images": [],
  "shortcutLink": [],
  "staffOwners": [{ "staffID": 1013, "staffName": "..." }],
  "students": [...]
}
```

#### Consent Form (List Item)

```json
{
  "id": "cf_1038",
  "postId": 1038,
  "title": "Consent Form for Boxing Competition 1 April 2026",
  "date": "2026-03-24T03:08:05.000Z",
  "status": "OPEN",
  "toParentsOf": ["Boxing"],
  "respondedMetrics": { "respondedPerStudent": 0, "totalStudents": 2 },
  "scheduledSendFailureCode": null
}
```

#### Consent Form (Detail)

```json
{
  "consentFormId": 1038,
  "title": "...",
  "venue": "Temasek Secondary School",
  "content": null,
  "richTextContent": "{...prosemirror json...}",
  "responseType": "ACKNOWLEDGEMENT",
  "eventStartDate": "2026-04-01T04:00:00.000Z",
  "eventEndDate": "2026-04-01T09:00:00.000Z",
  "consentByDate": "2026-03-30T15:59:59.000Z",
  "addReminderType": "ONE_TIME",
  "reminderDate": "2026-03-29T15:59:59.000Z",
  "postedDate": "2026-03-24T03:08:05.000Z",
  "enquiryEmailAddress": "...",
  "staffName": "...",
  "createdBy": 1013,
  "createdAt": "...",
  "customQuestions": [],
  "consentFormHistory": [...]
}
```

#### Meeting (List Item)

```json
{
  "eventId": 1001,
  "title": "Meeting with Boxing Coaches",
  "eventDates": [{ "startDateTime": "...", "endDateTime": "..." }],
  "bookingWindows": [{ "windowDate": { "startDateTime": "...", "endDateTime": "..." } }],
  "bookingSummary": { "available": 4, "pending": 2, "booked": 0 },
  "targetStudents": 2,
  "createdDate": "...",
  "slotDuration": 30,
  "bookingsPerSlot": 1
}
```

#### Timeslot Schedule

```json
{
  "eventDays": [
    {
      "date": "2026-04-02T16:00:00.000Z",
      "slots": [{ "slotId": 2592, "startDateTime": "2026-04-03T08:00:00.000Z" }]
    }
  ],
  "durationPerSlot": 30,
  "bookingsPerSlot": 1,
  "totalCount": 4
}
```

#### Assigned Groups

```json
{
  "classes": [
    {
      "classId": 1005,
      "classCode": "P1-02",
      "className": "P1 KINDNESS",
      "schoolId": 1001,
      "academicYear": "2026"
    }
  ],
  "ccaGroups": [
    { "ccaId": 1007, "ccaDescription": "" },
    { "ccaId": 1001, "ccaDescription": "AIR RIFLE / SHOOTING" }
  ]
}
```

#### Custom Group (List Item)

```json
{
  "id": 1010,
  "groupName": "Boxing",
  "numberOfStaff": 1,
  "numberOfStudents": 6
}
```

#### Feature Flags

```json
{
  "flags": {
    "absence_submission": { "enabled": true },
    "duplicate_announcement_form_post": { "enabled": true },
    "heytalia_chat": { "enabled": true },
    "schedule_announcement_form_post": { "enabled": true }
  },
  "configs": {
    "absence_notification": { "blacklist": [] },
    "two_way_comms": { "isTwoWayCommsBetaEnabled": true, "twoWayCommsBetaSchoolWhiteList": [] },
    "web_notification": {
      "enabled": false,
      "endDateTime": "...",
      "message": "",
      "startDateTime": "..."
    }
  }
}
```

---

_End of Combined Specification_
