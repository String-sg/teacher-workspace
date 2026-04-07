# PG Proxy Integration — Required pgw-web Changes

**From:** TW Platform Team  
**To:** PG Team (Grace / Scott)  
**Date:** 2026-04-07  
**Context:** TW BFF will proxy all PG staff requests through a reverse proxy. pgw-web needs three minimal changes to support this.

---

## What TW BFF does

TW handles its own teacher authentication. When a teacher makes a request through TW, the TW BFF:

1. Validates the teacher's TW session
2. Forwards the request to pgw-web at the same path
3. Attaches a single header identifying the teacher

TW's server IP is fixed — all proxied requests come from the same IP.

---

## Required changes to pgw-web

### 1. IP allowlist

Allowlist TW's server IP in pgw-web's WAF / firewall.

| Environment | TW Server IP |
|---|---|
| Staging | TBD — confirm with TW infra |
| Production | TBD — confirm with TW infra |

Requests from this IP should be routed to pgw-web normally.

---

### 2. Trust `X-TW-Staff-ID` header

For requests originating from TW's allowlisted IP, accept the following header as the authenticated staff identity:

```
X-TW-Staff-ID: <staffId>
```

- `staffId` is an integer matching pgw-web's existing staff records
- Skip session cookie validation for requests from the allowlisted IP that carry this header
- If the header is absent or the staffId does not exist, return `401`

**Security note:** Because this header is only trusted from the allowlisted IP, browser clients cannot spoof it. TW strips any incoming `X-TW-Staff-ID` header from the browser before forwarding.

---

### 3. No CSRF required for allowlisted requests

CSRF protection is a browser-to-server concern. TW BFF is a server-to-server caller. For requests from the allowlisted IP, skip CSRF token validation on POST / PUT / DELETE routes.

---

## What does NOT change

- pgw-web session cookie auth for direct browser access (existing PG app users) — unchanged
- All existing pgw-web endpoints, response shapes, business logic — unchanged
- No new endpoints needed on pgw-web

---

## Questions for PG team

1. What is the pgw-web base URL for staging?
2. When can IP allowlisting be in place for staging testing?
3. Is there an existing mechanism for service-to-service trust, or does this need to be built fresh?
