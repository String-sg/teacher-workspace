# PG API Contract — Endpoints & Data Shapes

**Purpose:** Complete reference for every PG endpoint TW BFF needs to proxy, including request params and response shapes. Use this to build mock fixtures and the proxy route map.

**Source:** Reverse-engineered from `stable-pg.moe.edu.sg` + `pgw-web` codebase analysis.

**pgw-web base path for staff web:** `/api/web/2/staff/` (note: v2 in codebase is exposed as `/2/` on the wire)

---

## Table of Contents

1. [Session & Config](#1-session--config)
2. [Announcements — Read](#2-announcements--read)
3. [Announcements — Write](#3-announcements--write)
4. [Consent Forms — Read](#4-consent-forms--read)
5. [Consent Forms — Write](#5-consent-forms--write)
6. [Meetings (PTM) — Read](#6-meetings-ptm--read)
7. [Meetings (PTM) — Write](#7-meetings-ptm--write)
8. [Groups — Read](#8-groups--read)
9. [Groups — Write](#9-groups--write)
10. [School Data](#10-school-data)
11. [Account & Notification Prefs](#11-account--notification-prefs)
12. [Files](#12-files)
13. [TW Route Map](#13-tw-route-map)

---

## 1. Session & Config

### GET `/api/web/2/staff/session/current`

Called on every page load to validate session and get user context.

**Response:**
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

**Notes:**
- `isA` = is admin
- `sessionTimeLeft` in seconds (~1800 = 30 min)
- `heyTaliaAccess` gates HeyTalia AI feature in UI
- 401 → redirect to login

---

### GET `/api/configs`

Feature flags and system config. Controls which UI elements are visible.

**Response:**
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
      "endDateTime": "2026-04-01T00:00:00.000Z",
      "message": "",
      "startDateTime": "2026-03-01T00:00:00.000Z"
    }
  }
}
```

**Flag-to-UI mapping:**
| Flag | Controls |
|---|---|
| `duplicate_announcement_form_post.enabled` | Duplicate action in kebab menus |
| `schedule_announcement_form_post.enabled` | Schedule send fields in create/edit forms |
| `heytalia_chat.enabled` AND `session.heyTaliaAccess` | HeyTalia button in navbar |

---

## 2. Announcements — Read

### GET `/api/web/2/staff/announcements`

List of announcements created by the logged-in staff.

**Query params:**
- `page` (int, default 1)
- `pageSize` (int, default 10)
- `search` (string, title search)
- `status` (string: `POSTED` | `DRAFT` | `SCHEDULED`)
- `dateFrom` (ISO string)
- `dateTo` (ISO string)

**Response:**
```json
{
  "posts": [
    {
      "id": "ann_1036",
      "postId": 1036,
      "title": "Term 2 School Camp",
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
  ],
  "total": 34,
  "page": 1,
  "pageSize": 10
}
```

**Status values:** `POSTED` | `DRAFT` | `SCHEDULED`

---

### GET `/api/web/2/staff/announcements/shared`

Announcements shared with the logged-in staff by other staff.

Same response shape as list above. Includes `createdByName` column in UI.

---

### GET `/api/web/2/staff/announcements/:postId`

Full announcement detail including attachments, images, read status.

**Response:**
```json
{
  "announcementId": 1036,
  "title": "Term 2 School Camp",
  "content": null,
  "richTextContent": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Dear Parents,\"}]}]}",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:12:51.000Z",
  "postedDate": "2026-03-24T03:12:51.000Z",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "attachments": [
    {
      "attachmentId": 1,
      "fileName": "schedule.pdf",
      "fileSize": 204800,
      "mimeType": "application/pdf"
    }
  ],
  "images": [
    {
      "imageId": 1,
      "fileName": "photo1.jpg",
      "isCover": true,
      "order": 1
    }
  ],
  "shortcutLink": ["TRAVEL_DECLARATION"],
  "websiteLinks": [
    {
      "url": "https://example.com",
      "description": "Registration link"
    }
  ],
  "staffOwners": [
    { "staffID": 1013, "staffName": "EBI HO BIN BIN" }
  ],
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "isRead": false
    }
  ],
  "status": "POSTED",
  "scheduledSendAt": null,
  "scheduledSendFailureCode": null
}
```

**Notes:**
- `richTextContent` is a JSON string (ProseMirror doc format), NOT an object
- `content` is the legacy plain-text field, use `richTextContent`
- `shortcutLink` values: `"TRAVEL_DECLARATION"` | `"EDIT_CONTACT_DETAILS"`

---

### GET `/api/web/2/staff/announcements/:postId/readStatus`

Read status breakdown per student for the detail page stats row.

**Response:**
```json
{
  "readCount": 1,
  "totalCount": 2,
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "isRead": true,
      "readAt": "2026-03-25T08:00:00.000Z"
    },
    {
      "studentId": 2,
      "studentName": "LEE WEI LIANG",
      "className": "H6-05",
      "isRead": false,
      "readAt": null
    }
  ]
}
```

---

### GET `/api/web/2/staff/announcements/drafts/:announcementDraftId`

Load a saved draft (for edit view).

**Response:** Same shape as announcement detail but with `status: "DRAFT"` and no `postedDate`.

---

### GET `/api/web/2/staff/announcements/prefilled/:announcementPrefilledId`

Load a HeyTalia-generated prefilled draft.

**Response:** Same shape as draft detail.

---

## 3. Announcements — Write

### POST `/api/web/2/staff/announcements`

Publish a new announcement immediately.

**Rate limited.** Requires CSRF token.

**Request body:**
```json
{
  "title": "Term 2 School Camp",
  "richTextContent": "{\"type\":\"doc\",\"content\":[...]}",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "studentGroups": [
    { "type": "CLASS", "id": 101 },
    { "type": "CUSTOM_GROUP", "id": 5 }
  ],
  "staffOwners": [1013, 1014],
  "shortcutLink": ["TRAVEL_DECLARATION"],
  "websiteLinks": [
    { "url": "https://example.com", "description": "Registration" }
  ],
  "attachmentIds": [1, 2],
  "imageIds": [3, 4],
  "coverImageIds": [3]
}
```

**Response:**
```json
{ "announcementId": 1037, "postId": 1037 }
```

---

### POST `/api/web/2/staff/announcements/drafts`

Save as draft.

**Request body:** Same as publish but without required validation enforcement.

**Response:**
```json
{ "announcementDraftId": 55 }
```

---

### PUT `/api/web/2/staff/announcements/drafts/:announcementDraftId`

Update existing draft.

**Request body:** Same as create draft.

**Response:** `{ "announcementDraftId": 55 }`

---

### POST `/api/web/2/staff/announcements/drafts/schedule`

Save draft + schedule for future send.

**Request body:** Create draft body + schedule fields:
```json
{
  "scheduledSendAt": "2026-04-10T01:00:00.000Z"
}
```

---

### POST `/api/web/2/staff/announcements/duplicate`

Duplicate a posted announcement into a new draft.

**Request body:**
```json
{ "announcementId": 1036 }
```

**Response:** `{ "announcementDraftId": 56 }`

---

### DELETE `/api/web/2/staff/announcements/:postId`

Delete a posted announcement. Requires CSRF.

**Response:** `204 No Content`

---

### DELETE `/api/web/2/staff/announcements/drafts/:announcementDraftId`

Delete a draft. Requires CSRF.

**Response:** `204 No Content`

---

## 4. Consent Forms — Read

### GET `/api/web/2/staff/consentForms`

List consent forms created by logged-in staff.

**Query params:** `page`, `pageSize`, `search`, `status`, `dateFrom`, `dateTo`

**Response:**
```json
{
  "posts": [
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
      "scheduledSendFailureCode": null,
      "createdByName": "EBI HO BIN BIN",
      "consentByDate": "2026-03-30T15:59:59.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 10
}
```

**Status values:** `OPEN` | `CLOSED` | `DRAFT` | `SCHEDULED`

---

### GET `/api/web/2/staff/consentForms/shared`

Consent forms shared with logged-in staff. Same shape as list.

---

### GET `/api/web/2/staff/consentForms/:consentFormId`

Full consent form detail.

**Response:**
```json
{
  "consentFormId": 1038,
  "title": "Consent Form for Boxing Competition",
  "richTextContent": "{\"type\":\"doc\",\"content\":[...]}",
  "responseType": "YES_NO",
  "eventStartDate": "2026-04-01T04:00:00.000Z",
  "eventEndDate": "2026-04-01T09:00:00.000Z",
  "consentByDate": "2026-03-30T15:59:59.000Z",
  "addReminderType": "ONE_TIME",
  "reminderDate": "2026-03-29T15:59:59.000Z",
  "postedDate": "2026-03-24T03:08:05.000Z",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "staffName": "EBI HO BIN BIN",
  "createdBy": 1013,
  "createdAt": "2026-03-24T03:08:05.000Z",
  "attachments": [],
  "images": [],
  "websiteLinks": [],
  "customQuestions": [
    {
      "questionId": 1,
      "questionText": "Does your child have any dietary restrictions?",
      "questionType": "TEXT"
    }
  ],
  "staffOwners": [{ "staffID": 1013, "staffName": "EBI HO BIN BIN" }],
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "Boxing",
      "response": "YES",
      "respondedAt": "2026-03-25T09:00:00.000Z"
    }
  ],
  "status": "OPEN",
  "consentFormHistory": []
}
```

**`responseType` values:** `YES_NO` | `ACKNOWLEDGEMENT` | `CUSTOM`

---

### GET `/api/web/2/staff/consentForms/drafts/:consentFormDraftId`

Load a saved consent form draft.

---

## 5. Consent Forms — Write

### POST `/api/web/2/staff/consentForms`

Publish a consent form. Rate limited. Requires CSRF.

**Request body:**
```json
{
  "title": "Consent Form for Boxing Competition",
  "richTextContent": "{\"type\":\"doc\",\"content\":[...]}",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "responseType": "YES_NO",
  "eventStartDate": "2026-04-01T04:00:00.000Z",
  "eventEndDate": "2026-04-01T09:00:00.000Z",
  "consentByDate": "2026-03-30T15:59:59.000Z",
  "addReminderType": "ONE_TIME",
  "reminderDate": "2026-03-29T15:59:59.000Z",
  "studentGroups": [{ "type": "CCA", "id": 10 }],
  "staffOwners": [1013],
  "attachmentIds": [],
  "imageIds": [],
  "customQuestions": [
    { "questionText": "Dietary restrictions?", "questionType": "TEXT" }
  ]
}
```

**Response:** `{ "consentFormId": 1039 }`

---

### POST `/api/web/2/staff/consentForms/drafts`

Save consent form as draft.

**Response:** `{ "consentFormDraftId": 22 }`

---

### PUT `/api/web/2/staff/consentForms/drafts/:consentFormDraftId`

Update existing consent form draft.

---

### PUT `/api/web/2/staff/consentForms/:consentFormId/updateDueDate`

Update consent-by date after publishing.

**Request body:**
```json
{ "consentByDate": "2026-04-05T15:59:59.000Z" }
```

---

### DELETE `/api/web/2/staff/consentForms/:consentFormId`

Delete a consent form. Requires CSRF.

**Response:** `204 No Content`

---

### DELETE `/api/web/2/staff/consentForms/drafts/:consentFormDraftId`

Delete a draft. Requires CSRF.

---

## 6. Meetings (PTM) — Read

### GET `/api/web/2/staff/ptm`

List all meetings (upcoming + past).

**Response:**
```json
{
  "upcoming": [
    {
      "eventId": 1001,
      "title": "Meeting with Boxing Coaches",
      "eventDates": [
        {
          "startDateTime": "2026-04-10T01:00:00.000Z",
          "endDateTime": "2026-04-10T05:00:00.000Z"
        }
      ],
      "bookingWindows": [
        {
          "windowDate": {
            "startDateTime": "2026-04-05T00:00:00.000Z",
            "endDateTime": "2026-04-09T16:00:00.000Z"
          }
        }
      ],
      "bookingSummary": {
        "available": 4,
        "pending": 2,
        "booked": 0
      },
      "targetStudents": 2,
      "createdDate": "2026-03-20T08:00:00.000Z",
      "slotDuration": 30,
      "bookingsPerSlot": 1,
      "status": "BOOKING_OPEN"
    }
  ],
  "past": []
}
```

**`status` values:** `UPCOMING` | `BOOKING_OPEN` | `BOOKING_CLOSED` | `PAST`

---

### GET `/api/web/2/staff/ptm/:eventId`

Meeting event detail.

**Response:**
```json
{
  "eventId": 1001,
  "title": "Meeting with Boxing Coaches",
  "richTextContent": "{\"type\":\"doc\",\"content\":[...]}",
  "venue": "Library",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "eventDates": [
    {
      "startDateTime": "2026-04-10T01:00:00.000Z",
      "endDateTime": "2026-04-10T05:00:00.000Z"
    }
  ],
  "bookingWindows": [
    {
      "windowDate": {
        "startDateTime": "2026-04-05T00:00:00.000Z",
        "endDateTime": "2026-04-09T16:00:00.000Z"
      }
    }
  ],
  "slotDuration": 30,
  "bookingsPerSlot": 1,
  "staffOwners": [{ "staffID": 1013, "staffName": "EBI HO BIN BIN" }],
  "attachments": [],
  "websiteLinks": [],
  "status": "BOOKING_OPEN",
  "createdDate": "2026-03-20T08:00:00.000Z"
}
```

---

### GET `/api/web/2/staff/ptm/timeslots/:eventId`

All timeslots for a meeting event (full schedule grid).

**Response:**
```json
{
  "eventId": 1001,
  "timeslots": [
    {
      "slotId": 1,
      "startDateTime": "2026-04-10T01:00:00.000Z",
      "endDateTime": "2026-04-10T01:30:00.000Z",
      "capacity": 1,
      "booked": 0,
      "isBlocked": false,
      "bookings": []
    },
    {
      "slotId": 2,
      "startDateTime": "2026-04-10T01:30:00.000Z",
      "endDateTime": "2026-04-10T02:00:00.000Z",
      "capacity": 1,
      "booked": 1,
      "isBlocked": false,
      "bookings": [
        {
          "bookingId": 10,
          "studentId": 1,
          "studentName": "TAN XIAO MING",
          "parentName": "TAN AH KOW",
          "bookedAt": "2026-04-06T09:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### GET `/api/web/2/staff/ptm/bookings/:eventId`

Bookings for a specific meeting day.

**Query params:**
- `scheduleDate` (ISO string, required) — the specific meeting day to view

**Response:**
```json
{
  "eventId": 1001,
  "scheduleDate": "2026-04-10T00:00:00.000Z",
  "bookings": [
    {
      "bookingId": 10,
      "slotId": 2,
      "startDateTime": "2026-04-10T01:30:00.000Z",
      "endDateTime": "2026-04-10T02:00:00.000Z",
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "Boxing",
      "parentName": "TAN AH KOW",
      "bookedAt": "2026-04-06T09:00:00.000Z",
      "remark": ""
    }
  ]
}
```

---

### GET `/api/web/2/staff/ptm/serverdatetime`

Server date/time used for meeting creation validation.

**Response:** `{ "serverDateTime": "2026-04-01T08:00:00.000Z" }`

---

## 7. Meetings (PTM) — Write

### POST `/api/web/2/staff/ptm`

Create a new meeting event. Rate limited. Requires CSRF.

**Request body:**
```json
{
  "title": "Meeting with Boxing Coaches",
  "richTextContent": "{\"type\":\"doc\",\"content\":[...]}",
  "venue": "Library",
  "enquiryEmailAddress": "sandwich_pri@moe.edu.sg",
  "slotDuration": 30,
  "bookingsPerSlot": 1,
  "eventDates": [
    {
      "startDateTime": "2026-04-10T01:00:00.000Z",
      "endDateTime": "2026-04-10T05:00:00.000Z"
    }
  ],
  "bookingWindows": [
    {
      "startDateTime": "2026-04-05T00:00:00.000Z",
      "endDateTime": "2026-04-09T16:00:00.000Z"
    }
  ],
  "studentGroups": [{ "type": "CCA", "id": 10 }],
  "staffOwners": [1013],
  "attachmentIds": [],
  "websiteLinks": []
}
```

**Response:** `{ "eventId": 1002 }`

---

### DELETE `/api/web/2/staff/ptm/:eventId`

Delete a meeting event. Requires CSRF.

---

### POST `/api/web/2/staff/ptm/booking/block`

Block a timeslot (staff side). Requires CSRF.

**Request body:**
```json
{ "slotId": 5, "eventId": 1001 }
```

---

### POST `/api/web/2/staff/ptm/booking/unblock`

Unblock a timeslot. Requires CSRF.

**Request body:**
```json
{ "slotId": 5, "eventId": 1001 }
```

---

### POST `/api/web/2/staff/ptm/booking/add`

Add a booking manually (staff adds on behalf of parent). Requires CSRF.

**Request body:**
```json
{
  "slotId": 5,
  "eventId": 1001,
  "studentId": 1
}
```

---

### POST `/api/web/2/staff/ptm/booking/change`

Move a booking to a different slot. Requires CSRF.

**Request body:**
```json
{
  "bookingId": 10,
  "newSlotId": 6
}
```

---

### POST `/api/web/2/staff/ptm/booking/remove`

Remove a booking. Requires CSRF.

**Request body:**
```json
{ "bookingId": 10 }
```

---

## 8. Groups — Read

### GET `/api/web/2/staff/groups/assigned`

Returns all groups assigned to the logged-in staff (form class, co-form class, CCAs, subject groups).

**Query params:**
- `type` = `summary` (returns condensed list for recipient picker)

**Response:**
```json
{
  "classes": [
    {
      "classId": 101,
      "className": "H6-05",
      "level": "SECONDARY 4",
      "year": 2026,
      "role": "FORM_TEACHER",
      "studentCount": 30
    }
  ],
  "ccas": [
    {
      "ccaId": 10,
      "ccaName": "BOXING",
      "studentCount": 15
    }
  ],
  "levels": [
    {
      "levelId": 6,
      "levelName": "SECONDARY 4",
      "year": 2026,
      "studentCount": 120
    }
  ],
  "school": {
    "schoolId": 1001,
    "schoolName": "SANDWICH PRIMARY SCHOOL",
    "studentCount": 600
  }
}
```

---

### GET `/api/web/2/staff/groups/custom`

List custom groups created by or shared with logged-in staff.

**Query params:**
- `type` = `summary`

**Response:**
```json
{
  "customGroups": [
    {
      "customGroupId": 5,
      "name": "My Study Group",
      "studentCount": 8,
      "createdBy": 1013,
      "createdByName": "EBI HO BIN BIN",
      "isShared": false,
      "createdAt": "2026-03-01T08:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/web/2/staff/groups/custom/:customGroupId`

Custom group detail with student list.

**Response:**
```json
{
  "customGroupId": 5,
  "name": "My Study Group",
  "createdBy": 1013,
  "createdByName": "EBI HO BIN BIN",
  "isShared": false,
  "sharedWith": [],
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "indexNumber": 15,
      "ccas": ["BOXING"]
    }
  ],
  "createdAt": "2026-03-01T08:00:00.000Z"
}
```

---

### GET `/api/web/2/staff/groups/classes/:classId`

Single class detail with student list.

---

### GET `/api/web/2/staff/groups/cca/students/:ccaId`

CCA student list.

---

## 9. Groups — Write

### POST `/api/web/2/staff/groups/custom`

Create a custom group. Requires CSRF.

**Request body:**
```json
{
  "name": "My Study Group",
  "studentIds": [1, 2, 3]
}
```

**Response:** `{ "customGroupId": 6 }`

---

### PUT `/api/web/2/staff/groups/custom/:customGroupId`

Update custom group name or students. Requires CSRF.

**Request body:**
```json
{
  "name": "My Study Group (Updated)",
  "studentIds": [1, 2, 3, 4]
}
```

---

### DELETE `/api/web/2/staff/groups/custom/:customGroupId`

Delete custom group. Requires CSRF.

---

### PUT `/api/web/2/staff/groups/custom/:customGroupId/share`

Share group with other staff. Requires CSRF.

**Request body:**
```json
{ "staffIds": [1014, 1015] }
```

---

### PUT `/api/web/2/staff/groups/custom/:customGroupId/removeAccess`

Remove a staff member's access to the shared group. Requires CSRF.

**Request body:**
```json
{ "staffId": 1014 }
```

---

### POST `/api/web/2/staff/groups/custom/validateStudents`

Validate a student list (e.g. from Excel upload) before creating group.

**Request body:** `multipart/form-data` with Excel file.

---

### POST `/api/web/2/staff/groups/student/count`

Get student count for an array of groups (used for meeting creation summary box).

**Request body:**
```json
{
  "groups": [
    { "type": "CLASS", "id": 101 },
    { "type": "CCA", "id": 10 }
  ]
}
```

**Response:** `{ "studentCount": 45 }`

---

## 10. School Data

### GET `/api/web/2/staff/school/staff`

All staff in the same school. Used for recipient/staff-in-charge pickers.

**Response:**
```json
{
  "staff": [
    {
      "staffId": 1013,
      "staffName": "EBI HO BIN BIN",
      "email": "parentsgateway.otp+PGU00391@gmail.com",
      "schoolEmail": "sandwich_pri@moe.edu.sg",
      "assignedClass": "H6-05"
    }
  ]
}
```

---

### GET `/api/web/2/staff/school/students`

All students in the school. Used for custom group student picker and onboarding report.

**Query params:**
- `search` (string)
- `level` (string)
- `className` (string)

**Response:**
```json
{
  "students": [
    {
      "studentId": 1,
      "studentName": "TAN XIAO MING",
      "className": "H6-05",
      "level": "SECONDARY 4",
      "indexNumber": 15,
      "ccas": ["BOXING"]
    }
  ],
  "total": 600
}
```

---

### GET `/api/web/2/staff/school/groups`

All student groups (classes, levels, CCAs) in school. Used for recipient dropdowns.

**Response:**
```json
{
  "classes": [
    { "classId": 101, "className": "H6-05", "level": "SECONDARY 4", "year": 2026 }
  ],
  "levels": [
    { "levelId": 6, "levelName": "SECONDARY 4", "year": 2026 }
  ],
  "ccas": [
    { "ccaId": 10, "ccaName": "BOXING" }
  ]
}
```

---

### GET `/api/web/2/staff/school/students/retrieveReport`

Generate onboarding status report. Returns Excel file.

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

### POST `/api/web/2/staff/school/travelDeclaration`

Generate travel declaration report. Returns Excel file.

**Request body:**
```json
{
  "declarationStatus": "NOT_DECLARED",
  "dateFrom": "2026-04-01",
  "dateTo": "2026-04-07"
}
```

**Response:** Excel file.

---

## 11. Account & Notification Prefs

### GET `/api/web/2/staff/users/me`

Current user profile.

**Response:**
```json
{
  "staffId": 1013,
  "staffName": "EBI HO BIN BIN",
  "email": "parentsgateway.otp+PGU00391@gmail.com",
  "schoolEmail": "sandwich_pri@moe.edu.sg",
  "schoolName": "SANDWICH PRIMARY SCHOOL",
  "displayName": "",
  "displayEmail": "",
  "recentLogins": [
    {
      "loginAt": "2026-03-31T08:00:00.000Z",
      "device": "MacBook Pro",
      "browser": "Chrome 124",
      "ipAddress": "1.2.3.4"
    }
  ]
}
```

---

### PUT `/api/web/2/staff/:staffId/updateDisplayEmail`

Update preferred enquiry/display email. Requires CSRF.

**Request body:**
```json
{ "displayEmail": "personal@schools.gov.sg" }
```

---

### PUT `/api/web/2/staff/:staffId/updateDisplayName`

Update display name. Requires CSRF.

**Request body:**
```json
{ "displayName": "Mr Tan" }
```

---

### GET `/api/web/2/staff/notificationPreference`

Get current notification preference settings.

**Response:**
```json
{
  "preferences": [
    {
      "eventType": "CONSENT_FORM_RESPONSE_YES",
      "label": "When a parent responds 'Yes'",
      "enabled": true
    },
    {
      "eventType": "CONSENT_FORM_RESPONSE_NO",
      "label": "When a parent responds 'No'",
      "enabled": true
    },
    {
      "eventType": "CONSENT_FORM_RESPONSE_CHANGED",
      "label": "When a parent changes their response",
      "enabled": false
    }
  ]
}
```

---

### PUT `/api/web/2/staff/notificationPreference`

Update notification preferences. Requires CSRF.

**Request body:**
```json
{
  "preferences": [
    { "eventType": "CONSENT_FORM_RESPONSE_YES", "enabled": false }
  ]
}
```

---

## 12. Files

File handling uses a separate auth path — existing file routes support token-based auth alongside cookie auth.

### POST `/api/files/2/preUploadValidation`

Validate file before S3 upload. Returns presigned S3 URL.

**Request body:** `multipart/form-data`
- `file`: the file
- `type`: `ANNOUNCEMENT` | `CONSENT_FORM` | `MEETING` | `GROUP`
- `mimeType`: file MIME type
- `fileSize`: bytes

**Response:**
```json
{
  "attachmentId": 99,
  "presignedUrl": "https://s3.amazonaws.com/...",
  "fields": { "key": "...", "policy": "...", "x-amz-signature": "..." }
}
```

---

### GET `/api/files/2/postUploadVerification`

Confirm S3 upload completed.

**Query params:**
- `attachmentId` (int)

**Response:** `{ "verified": true }`

---

### GET `/api/files/2/handleDownloadAttachment`

Download an attachment (returns presigned S3 URL redirect or stream).

**Query params:**
- `attachmentId` (int)

---

## 13. TW Route Map

How TW frontend routes map to TW BFF endpoints, which then proxy to pgw-web.

Convention: TW frontend calls `/<base-path>/<resource>.json` → TW BFF strips base path → forwards to pgw-web.

| TW Frontend | TW BFF endpoint | pgw-web endpoint |
|---|---|---|
| `GET /teachers/session/current.json` | `/teachers/session/current.json` | `GET /api/web/2/staff/session/current` |
| `GET /teachers/configs.json` | `/teachers/configs.json` | `GET /api/configs` |
| `GET /teachers/announcements.json` | `/teachers/announcements.json` | `GET /api/web/2/staff/announcements` |
| `GET /teachers/announcements/shared.json` | `/teachers/announcements/shared.json` | `GET /api/web/2/staff/announcements/shared` |
| `GET /teachers/announcements/:id.json` | `/teachers/announcements/:id.json` | `GET /api/web/2/staff/announcements/:id` |
| `GET /teachers/announcements/:id/readStatus.json` | — | `GET /api/web/2/staff/announcements/:id/readStatus` |
| `GET /teachers/consentForms.json` | — | `GET /api/web/2/staff/consentForms` |
| `GET /teachers/consentForms/shared.json` | — | `GET /api/web/2/staff/consentForms/shared` |
| `GET /teachers/consentForms/:id.json` | — | `GET /api/web/2/staff/consentForms/:id` |
| `GET /teachers/meetings.json` | — | `GET /api/web/2/staff/ptm` |
| `GET /teachers/meetings/:id.json` | — | `GET /api/web/2/staff/ptm/:id` |
| `GET /teachers/meetings/:id/timeslots.json` | — | `GET /api/web/2/staff/ptm/timeslots/:id` |
| `GET /teachers/meetings/:id/bookings.json` | — | `GET /api/web/2/staff/ptm/bookings/:id` |
| `GET /teachers/groups/assigned.json` | — | `GET /api/web/2/staff/groups/assigned` |
| `GET /teachers/groups/custom.json` | — | `GET /api/web/2/staff/groups/custom` |
| `GET /teachers/groups/custom/:id.json` | — | `GET /api/web/2/staff/groups/custom/:id` |
| `GET /teachers/school/staff.json` | — | `GET /api/web/2/staff/school/staff` |
| `GET /teachers/school/students.json` | — | `GET /api/web/2/staff/school/students` |
| `GET /teachers/school/groups.json` | — | `GET /api/web/2/staff/school/groups` |
| `GET /teachers/me.json` | — | `GET /api/web/2/staff/users/me` |
| `GET /teachers/notification-preferences.json` | — | `GET /api/web/2/staff/notificationPreference` |

Write operations follow same pattern but with HTTP method passthrough (POST/PUT/DELETE).

---

## Appendix: ProseMirror Rich Text Format

All `richTextContent` fields store ProseMirror JSON as a **string** (not object).

Example minimal paragraph:
```json
"{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"textAlign\":\"left\"},\"content\":[{\"type\":\"text\",\"text\":\"Dear Parents,\"}]}]}"
```

Node types observed in PG content:
- `doc` — root
- `paragraph` — with `attrs.textAlign`: `"left"` | `"center"` | `"right"` | `"justify"`
- `text` — with optional `marks`: `[{ "type": "bold" }]` | `[{ "type": "italic" }]` | `[{ "type": "underline" }]`
- `bulletList` — unordered list
- `orderedList` — numbered list
- `listItem` — list item
- `hardBreak` — line break

Parse with a ProseMirror-compatible renderer or Tiptap's `generateHTML` on the frontend.

---

## Appendix: Shortcut Link Values

Used in announcement `shortcutLink` array:

| Value | Displayed as |
|---|---|
| `TRAVEL_DECLARATION` | "Declare travels" |
| `EDIT_CONTACT_DETAILS` | "Edit contact details" |

---

## Appendix: Student Group Types

Used in `studentGroups` arrays on create/post endpoints:

| `type` value | Description |
|---|---|
| `CLASS` | Specific form class (by `classId`) |
| `LEVEL` | Entire year level (by `levelId`) |
| `CCA` | CCA group (by `ccaId`) |
| `SCHOOL` | Whole school (by `schoolId`) |
| `CUSTOM_GROUP` | Custom group (by `customGroupId`) |
| `STUDENT` | Individual student (by `studentId`) |
