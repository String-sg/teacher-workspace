# FE → API Wiring Instructions

**For:** Reza's AI agent  
**Branch:** feat/pg-mock-proxy (merge into feat/posts-list-page or rebase on top)  
**Context:** The Go BFF now serves mock PG data at real API endpoints. The FE should fetch from these instead of importing hardcoded mock data files.

---

## What changed on the backend

A new mock proxy is live at `/api/web/2/staff/*`. These routes mirror the real PG API paths exactly — when real pgw-web integration is wired up, the URLs will not change.

Currently available:

| Method | URL | Returns |
|--------|-----|---------|
| `GET` | `/api/web/2/staff/announcements` | `{ items: PGAnnouncement[] }` |

---

## What needs to change in the FE

### 1. `web/containers/PostsView.tsx`

**Remove** the mock data import:
```ts
import {
  mockPGAnnouncements,
  type PGAnnouncement,
  type ResponseTypeWithResponse,
  requiresResponse,
} from '~/data/mock-pg-announcements';
```

**Replace** with a `fetch` call to the API:
```ts
const [announcements, setAnnouncements] = React.useState<PGAnnouncement[]>([]);

React.useEffect(() => {
  fetch('/api/web/2/staff/announcements')
    .then((res) => res.json())
    .then((data: { items: PGAnnouncement[] }) => setAnnouncements(data.items));
}, []);
```

Then replace all references to `mockPGAnnouncements` with `announcements`.

Keep the `PGAnnouncement` type and helper imports — move them from `~/data/mock-pg-announcements` into a standalone types file (e.g. `~/apps/pg/types/announcements.ts`) since the mock data file should eventually be deleted.

### 2. `web/data/mock-pg-announcements.ts`

The mock data array (`mockPGAnnouncements`) can be removed once PostsView is wired up. Keep the **types and helpers** — move them out first:

- `PGAnnouncement`, `PGStatus`, `PGOwnership`, `PGRecipient`, `PGAnnouncementStats`, `ResponseType`, `ResponseTypeWithResponse` → move to `web/apps/pg/types/announcements.ts`
- `requiresResponse()` helper → move with the types

---

## Response shape

`GET /api/web/2/staff/announcements` returns:

```json
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "posted" | "scheduled" | "draft",
      "responseType": "view-only" | "acknowledge" | "yes-no",
      "ownership": "mine" | "shared",
      "role": "owner" | "viewer",        // optional
      "postedAt": "ISO8601",             // optional
      "scheduledAt": "ISO8601",          // optional
      "createdAt": "ISO8601",
      "createdBy": "string",
      "stats": {
        "totalCount": number,
        "readCount": number,
        "responseCount": number,
        "yesCount": number,
        "noCount": number
      },
      "recipients": [
        {
          "studentId": "string",
          "studentName": "string",
          "classId": "string",
          "parentName": "string",
          "readStatus": "read" | "unread",
          "respondedAt": "ISO8601",      // optional
          "formResponse": "yes" | "no"  // optional
        }
      ]
    }
  ]
}
```

This matches the existing `PGAnnouncement` TypeScript types in `web/data/mock-pg-announcements.ts` exactly — no type changes needed.

---

## Dev setup

The Go server must be running alongside Vite for API calls to work locally:

```bash
# Terminal 1 — Go BFF
go run ./server/cmd/tw

# Terminal 2 — Vite dev server
pnpm dev
```

Vite proxies `/api/*` calls to the Go server. If the proxy isn't configured yet, add this to `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```
