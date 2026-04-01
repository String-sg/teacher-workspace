# RFC-028: Teacher Workspace - Backend Architecture

**Author:** Yi Ming Peh / @YimingIsCOLD
**Status:** OPEN
**Source:** transformteamsg/design-documents#28

## Discussion & Voting Timeline

- Discussion open until 2026-03-31
- Voting starts when the author calls for it
- Voting ends on 2026-04-08 or when consensus is reached

## Summary

Adopt a Backend For Frontend (BFF) architecture where the TW backend owns the browser-facing integration layer, while each app maintains its own backend service for domain logic and data ownership.

## Motivation

TW integrates multiple apps into a single cohesive SPA. Without a defined backend model, services may be integrated inconsistently, leading to fragmented auth, routing, and data loading. Many apps already have existing backends — requiring full migration into TW backend would be costly and reduce team autonomy.

The TW BFF:

- Presents a single cohesive backend interface to the TW SPA
- Centralises authentication and identity
- Preserves app-level domain ownership
- Enables scalable onboarding of independently owned apps

## Detailed Design

### Architectural Principles

1. **Unified Frontend Integration Interface** — Single HTTP interface tailored to TW frontend; consistent routing, response contracts, error semantics.
2. **Centralised Authentication and Identity Authority** — Auth and user identity managed centrally by TW backend; identity propagated to downstream services.
3. **Clear Domain Ownership and Independent Evolution** — Platform integration concerns separated from app domain logic; app teams retain ownership of business logic and data.
4. **Consistent Data Loading and Hydration Model** — Consistent model for initial hydration and client-side navigation; predictable rendering, correct deep linking.

### Architecture Overview

TW backend = BFF = single browser-facing backend for TW SPA.

TW backend owns:

- HTML responses for initial page loads
- Route-specific JSON endpoints for client-side navigation
- Platform authentication and session enforcement
- Frontend integration contracts and response shaping

Each app maintains its own backend service:

- Domain business logic and data ownership
- Private — only reachable by TW backend over private network
- Not exposed publicly

Request flow: Browser → TW BFF (validates session, routes by base path, fetches from app service) → HTML/JSON response.

### Responsibilities and Boundaries

#### TW Backend (BFF)

- Public HTTP interface for TW frontend
- Mapping frontend routes to backend integration behaviour
- Serving HTML for initial page loads + bootstrap data injection
- Route-specific JSON endpoints for client-side navigation
- Authentication enforcement and session validation
- Identity propagation to downstream services
- Response shaping and normalisation
- Consistent error handling and HTTP status semantics
- Platform cross-cutting concerns: timeouts, logging, metrics, tracing, rate limiting

#### App Backend Services

- Business logic and workflows specific to the app
- Validation and authorisation within app scope
- Data ownership and persistence
- Internal service APIs consumed by TW backend

#### Enforced Boundaries

- TW backend is the only backend exposed to the browser
- App backend services remain private
- Authentication and identity authority reside exclusively in TW backend
- Identity propagated to app services via platform-defined mechanism

### Routing and Contract Model

Each app assigned a base path:

- `/students/*` → Students
- `/teachers/*` → Teachers

#### Browser-facing Routes (HTML)

- `GET /students/profile/123` → TW backend validates session, fetches from Students service, returns HTML

#### Route-specific JSON Endpoints (client-side nav)

- Convention: `/<app-base-path>/<route>.json`
- `GET /students/profile/123.json` → TW backend returns JSON for that route

#### Downstream Request Mapping

TW backend strips base path when calling app service:

- Browser: `GET /students/profile/123.json`
- TW backend → Students service: `GET /profile/123.json`

TW backend may adapt/normalise downstream responses to preserve stable frontend contracts.

#### Contract Ownership

- TW backend owns browser-facing contract (routes, JSON shapes, status semantics)
- App services own service-internal APIs and domain behaviour
- Mapping between frontend contracts and service-internal APIs is explicit integration contract between platform and app team

### Data Hydration and Navigation Data Loading

#### Initial Page Load

1. Browser requests route (e.g. `/students/profile/123`)
2. TW backend validates session
3. TW backend fetches data from app service(s)
4. TW backend injects bootstrap data into HTML:

```html
<script id="preloaded-data" type="application/json">
  { "featureFlags": { "example": true }, "context": {} }
</script>
```

Bootstrap data is read synchronously during init; treated as immutable input.

#### Client-side Navigation

Frontend requests: `GET /<app-base-path>/<route>.json`

TW backend:

1. Validates session
2. Propagates identity to app service(s)
3. Retrieves/composes route data
4. Returns stable JSON response

### Authentication and Identity Propagation

#### Session Model

- Stateful sessions stored in Valkey
- Browser authenticates via session cookie
- Session state stored server-side (identity + session metadata)
- TW backend validates session on all authenticated requests
- App services do not manage sessions or perform interactive auth with browser

#### Identity Propagation to App Services

Internally signed JWT containing:

- User ID
- Email
- (?) Session ID
- Issuer (TW backend)
- Audience (target app service)
- Issued-at and expiration timestamps

Transmitted as `Authorization: Bearer <token>` or platform-defined identity header.

#### Signing, Expiry, and Key Management

- JWTs must include explicit `exp` claim
- Short-lived (order of minutes)
- Generated per request or per downstream call
- App services must validate expiration and reject expired tokens
- Initial implementation: symmetric signing (HS256) with shared secret
- Future: asymmetric signing + JWKS-based key distribution

## Alternatives Considered

### Full Backend Consolidation into TW Backend

All app domain logic migrated into TW backend (Go). Single backend artefact, no inter-service calls.

Rejected: reduces team autonomy, forces costly migration of existing systems, creates large tightly-coupled monolith.

### Frontend Directly Calls App Backend Services

Frontend calls each app service directly; each service publicly accessible.

Rejected: fragments authentication, forces frontend to understand service boundaries, inconsistent error handling, complicates initial hydration, weakens platform-level control.

## Drawbacks

- Extra network hops (browser → TW BFF → app service) may increase latency
- Requires platform-owned identity propagation (JWT signing/verification + key management)
- TW backend is a potential bottleneck/single point of failure — requires resilience, timeouts, capacity planning
- Multi-hop request paths complicate debugging — requires consistent tracing + observability
- Data aggregation in BFF can increase coupling if routes depend on many downstream services

## Open Questions

- When should we migrate from symmetric signing to asymmetric signing with JWKS-based key distribution?
