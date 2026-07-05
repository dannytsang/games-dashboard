# Spec 004: OIDC Authentication

> **Status note:** Draft created 2026-07-05 alongside specs 003 (Data
> Architecture), 005 (Logged User & Menu), and 006 (Light/Dark Theme).
> Modeled on `meals-dashboard`'s NextAuth.js + Authentik pattern
> (specs 015/022/023 there), adapted to the games dashboard's narrower
> scope.
>
> **State:** Draft (no implementation yet).
> **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
> **Created:** 2026-07-05.
> **Last updated:** 2026-07-05.

## Summary

Gate every dashboard surface behind an OIDC sign-in. The dashboard is a
private, read-only tool — it must not be publicly readable. This spec
records the Authentik configuration, the NextAuth.js wiring, the
middleware matcher, the protected routes, the public-by-design routes,
the env-var requirements, and the failure modes.

This is the auth-plane contract for the games dashboard. The user-menu
shell is owned by spec 005. The data-plane contract is spec 003. The
storage layer (spec 003) is reached only after this gate succeeds.

## Status

- **State:** Draft.
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
- **Created:** 2026-07-05.
- **Last updated:** 2026-07-05.

## Goals

1. Single sign-in flow (Authentik) gating the entire dashboard.
2. Predictable, testable middleware matcher covering all dashboard routes.
3. Clear public-by-design allowlist (sign-in page, NextAuth routes, public assets).
4. Server-side session resolution; client receives only what the session claims require.
5. Graceful degradation: missing env vars → readable error page that does NOT leak secrets.
6. Privacy by default: never log OAuth tokens, never echo client secrets, never expose `sub` to the UI.

## Non-goals

- No new auth provider (Authentik is the chosen provider per spec 001 "Resolved decisions").
- No MFA, no step-up auth, no role/permission system.
- No rate-limiting beyond what NextAuth.js provides by default.
- No CSRF tokens beyond NextAuth.js's built-in protection.
- No account linking, social login, or signup flows.

## Relationship to other specs

- **Depends on:** none (can be implemented before spec 005).
- **Required by:** spec 001 (FR-005), spec 005 (user chip and menu read session claims), spec 006 (sign-in page hosts a theme toggle).
- **Cites:** spec 003 (env-var registry).
- **Implementation reference:** `meals-dashboard/lib/auth.ts` (NextAuth.js + Authentik provider), `meals-dashboard/middleware.ts`, `meals-dashboard/app/api/auth/[...nextauth]/route.ts`.

## Users

- **Danny:** the only authorised user.
- **Operator (Danny):** provisions Authentik client, sets env vars, rotates the NextAuth secret.
- **Tester:** verifies middleware matcher, sign-in redirect, session propagation.

## Functional requirements

### FR-001 Provider: Authentik via NextAuth.js

The auth provider is **Authentik** (matching the existing `coms-dashboard` and `meals-dashboard` pattern). The integration is via the official `next-auth/providers/authentik` adapter.

Required env vars:

| Variable | Purpose |
|---|---|
| `AUTHENTIK_CLIENT_ID` | OAuth client ID issued by Authentik. |
| `AUTHENTIK_CLIENT_SECRET` | OAuth client secret. Server-side only. |
| `AUTHENTIK_ISSUER` | Authentik instance URL, e.g. `https://authentik.example.com/application/o/dashboard/`. |
| `NEXTAUTH_SECRET` | NextAuth.js session encryption secret. Server-side only. |

When any of these is missing, the dashboard MUST render a server-side
"auth not configured" page that lists the missing variable names but
MUST NOT include any value.

### FR-002 Session strategy

Sessions are JWT-based (`strategy: 'jwt'`). No database-backed session
store is required.

### FR-003 Sign-in page

Path: `/auth/signin`. The page renders:

- A heading explaining the dashboard's purpose (read-only, private).
- A single `signIn('authentik', { callbackUrl: '/' })` button.
- A theme toggle in the top-right corner (per spec 006) — the sign-in page is the first thing an unauthenticated user sees, and a theme toggle there is a UX nicety that matches `meals-dashboard`'s `AuthSignInPage`.

The page is publicly reachable (not behind middleware).

### FR-004 NextAuth route

Path: `/api/auth/[...nextauth]`. Implemented as a Next.js App Router route that delegates to `NextAuth(authOptions)`. This is the standard NextAuth.js wiring; the file is six lines (see `meals-dashboard/app/api/auth/[...nextauth]/route.ts`).

### FR-005 Middleware matcher

The middleware (`middleware.ts` at repo root) MUST protect every dashboard
route. The default matcher:

```ts
export const config = {
  matcher: [
    '/',
    '/played',
    '/news-monitor',
    '/api/dashboard/:path*',
    '/api/build-info',
  ],
};
```

Public-by-design (NOT matched):

- `/auth/signin`
- `/api/auth/:path*` (NextAuth.js itself)
- `/_next/*` (Next.js assets)
- `/favicon.ico`, `/icon.png`, `/icon.svg`, `/apple-icon.png`
- Static files under `/public/*`

The matcher MUST be revisited when new routes are added; omitting a route
from the matcher is a privacy regression.

### FR-006 Page-level session check

Each protected page (`app/page.tsx`, `app/played/page.tsx`,
`app/news-monitor/page.tsx`) MUST call `getServerSession(authOptions)` at
the top of its server component. If the session is missing, the page
MUST `redirect('/auth/signin?callbackUrl=/...')`.

This is defence-in-depth: even if the middleware is misconfigured, the
page-level check still gates the data.

### FR-007 Session claims surfaced

The dashboard reads ONLY the following session claims:

- `session.user.name` (display name)
- `session.user.email` (fallback display name)
- `session.user.image` (avatar URL, optional)

It MUST NOT read or render `session.user.sub`, `accessToken`,
`refreshToken`, `idToken`, or any other claim. This is the same
restriction as `meals-dashboard/lib/user-chip.ts` FR-006.

### FR-008 Sign-out flow

Sign-out is provided by NextAuth.js (`signOut({ callbackUrl: '/auth/signin?callbackUrl=/' })`).
The button lives in the user menu (spec 005), not as an inline component.

### FR-009 Privacy: no secrets in client bundle

- `next-auth` MUST remain in `dependencies` (server-side evaluation).
- The client bundle MUST NOT include `next-auth/react` in pages that do
  not need it; use dynamic import if needed.
- The NextAuth.js session callback MUST NOT serialise OAuth tokens into
  the JWT (use `jwt: { encode/decode }` carefully; only `name`, `email`,
  `image` and a small set of whitelist fields are encoded).

### FR-010 Failure modes

| Failure | Behaviour |
|---|---|
| Missing `AUTHENTIK_CLIENT_ID` | Dashboard renders server-side "auth not configured" page listing missing vars by name. |
| Missing `AUTHENTIK_CLIENT_SECRET` | Same as above. |
| Missing `AUTHENTIK_ISSUER` | Same as above. |
| Missing `NEXTAUTH_SECRET` | Same as above. |
| Authentik returns 401 | Redirect to `/auth/signin?error=...`. |
| Authentik returns 5xx | Redirect to `/auth/signin?error=...`. |
| Session JWT expires | NextAuth.js redirects to `/auth/signin` automatically. |
| Misconfigured matcher (route not protected) | Page-level check (FR-006) catches it. |
| Sign-in callback loop | Operator-configured: redirect URI in Authentik must match `NEXTAUTH_URL`. |

The "auth not configured" page MUST list the **names** of missing env
vars and MUST NOT echo any value.

## Non-functional requirements

- Sign-in flow MUST complete within 3 seconds on a warm network (median).
- The middleware MUST add < 50ms to every protected request.
- The middleware MUST NOT block on Authentik for each request — the JWT is verified locally.
- All errors from the auth flow MUST be logged server-side with the request ID; the client receives only a sanitised message.

## Resolved design decisions

| Question | Decision |
|---|---|
| Auth provider | Authentik via NextAuth.js (matches `coms-dashboard` and `meals-dashboard`). |
| Session strategy | JWT only. No database. |
| Page-level vs middleware-only | Both. Defence-in-depth. |
| Sign-in page | `/auth/signin`, public, includes a theme toggle (spec 006). |
| Session claims surfaced | `name`, `email`, `image` only. No tokens, no `sub`. |
| Public allowlist | Sign-in page, NextAuth routes, Next.js assets, icons, public files. |
| Failure-mode UX | Server-side "auth not configured" page listing var NAMES only. |
| Sign-out | Via the user menu (spec 005), not inline. |

## Open questions

See `open-questions.md`.

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.