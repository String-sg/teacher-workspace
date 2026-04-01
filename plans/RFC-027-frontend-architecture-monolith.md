# RFC-027: Teacher Workspace - Frontend Architecture (Monolith)

**Author:** Yi Ming Peh / @YimingIsCOLD
**Status:** OPEN
**Source:** transformteamsg/design-documents#27

## Discussion & Voting Timeline

- Discussion open until 2026-03-31
- Voting starts when the author calls for it
- Voting ends on 2026-04-08 or when consensus is reached

## Summary

Adopt an App Folder architecture where all apps live inside the TW repository under `web/apps/*`, share a common design system and platform tooling under `web/platform/*` and `web/shared/*`, and ship as a single build and deploy artefact. The TW platform owns routing and layout, while each app contributes route definitions under its assigned base path.

## Motivation

Building TW as a unified web platform that consolidates multiple frontend applications into a single cohesive product experience.

Key goals:

- Strict SPA behaviour with correct deep linking and browser history
- Unified navigation and platform chrome
- Long term design system consistency
- Scalable onboarding of new apps (4–5 apps within 12 months)
- Clear ownership across multiple teams
- Architectural simplicity for initial rollout
- Efficient local development experience

## Detailed Design

### Architectural Principles

1. **Unified Platform Experience** — Single cohesive UX across all apps: consistent layout, navigation, platform chrome, interaction behaviour, accessibility.
2. **Navigation Correctness and Continuity** — True SPA: correct deep linking, refresh, back/forward, seamless transitions.
3. **Shared Foundations for Consistency** — Shared UI components, design primitives, utilities, platform capabilities across apps.
4. **Clear Ownership and Boundaries** — Enforced ownership between apps and platform; independent evolution, loose coupling.

### Repository Structure

```
web/apps/*        — Application folders (owned by respective app teams)
web/platform/*    — Platform shell, routing, layout, navigation (owned by Platform Team)
web/shared/*      — Shared components, design system, utilities (owned by Platform Team)
```

Example:

- `web/apps/students/*`
- `web/apps/teachers/*`
- `web/platform/*`
- `web/shared/*`

### Routing Architecture

Platform (`web/platform/*`) owns the central routing system:

- Defines root layout and global navigation
- Imports route definitions from each app
- Composes all app routes into a single route tree
- Manages global routing behaviour

Each app contributes routes via `routes.tsx` under its assigned base path:

- `/students/*` → Students app
- `/teachers/*` → Teachers app

Apps do not define top-level routing systems.

### Data Loading and Hydration

Bootstrap data injected via non-executable JSON script tag:

```html
<script id="preloaded-data" type="application/json">
  { "featureFlags": { "example": true }, "context": {} }
</script>
```

- Frontend reads synchronously during boot — no additional network requests
- Treated as immutable input
- May include: initial route data, platform feature flags, config

Client-side navigation: routes load their own data via standard client-side fetching.

### Application Boundaries

Dependency rules:

- Apps may import from `web/shared/*`
- Apps may import from approved public interfaces in `web/platform/*`
- Platform may import from `web/shared/*`
- Shared must NOT import from apps or platform
- Apps must NOT import from other apps

Ownership:

- `web/apps/*` → respective App Teams
- `web/platform/*` → Platform Team
- `web/shared/*` → Platform Team

### Development Standards and Governance

Platform Team owns and enforces commit, branching, and merge standards across the repo.

Platform Team responsibilities:

- Maintaining architectural integrity
- Defining and enforcing dependency boundaries
- Maintaining shared and platform infrastructure
- Reviewing architectural changes impacting platform stability

App Teams responsibilities:

- Maintaining app code under `web/apps/*`
- Following platform conventions and architectural standards
- Ensuring compatibility with platform and shared layers

## Alternatives Considered

| Approach                                     | Engineering Effort | UX Quality | Timeline  | Risks                                                          |
| -------------------------------------------- | ------------------ | ---------- | --------- | -------------------------------------------------------------- |
| **App Folder Architecture (Proposed)**       | Low to Moderate    | Excellent  | Fast      | Deployment coupling; governance required                       |
| Runtime Bundle Integration (Micro Frontends) | High               | Excellent  | Slow      | Runtime failures, bundle compatibility, operational complexity |
| SDK Rendered by Apps                         | Moderate           | Good       | Moderate  | SDK version drift, inconsistent UX                             |
| Script Tag Integration (Launcher Model)      | Very Low           | Poor       | Very Fast | Fragmented UX, no shared layout                                |
| Iframe Integration (Not Recommended)         | Moderate to High   | Poor       | Moderate  | Fragile integration, routing inconsistencies                   |

### Runtime Bundle Integration

Each app as an independent bundle, mounted by TW at runtime. Rejected: higher initial complexity, integration contracts, operational overhead, slower local dev.

### SDK Rendered by Apps

Apps import a TW SDK and render platform layout within them. Rejected: SDK version drift, coordination overhead, can't enforce platform changes immediately.

### Script Tag Integration

Apps on own domains; TW acts as launcher with a floating "back to TW" button. Rejected as primary strategy (valid for legacy systems that can't be rebuilt into TW architecture).

### Iframe Integration

Apps rendered in iframes. Rejected: complex URL/history sync, cross-window comms, fragile deep linking.

## Drawbacks

- All apps and TW platform deployed as a single artefact — coupled release cadence
- Changes in one app may require full platform redeployment
- Platform team governance responsibility increases
- Repository size and complexity grow over time
- Strict architectural boundaries must be maintained
- Independent deployment not supported without future architectural changes
- Breaking change in one app can affect entire platform

## Open Questions

- Should strict boundary enforcement via lint rules be implemented immediately or phased in?
- What is the minimal stable structure of the bootstrap data JSON script tag?
- Under what conditions should independent application deployment be reconsidered?
