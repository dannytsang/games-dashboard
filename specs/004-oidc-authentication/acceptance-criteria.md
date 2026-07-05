# Acceptance Criteria: OIDC Authentication

> **Status:** Draft — created 2026-07-05.

## Product behaviour

- [ ] FR-001 Auth provider is Authentik via NextAuth.js. Provider metadata visible at `/api/auth/providers`.
- [ ] FR-002 Session strategy is JWT.
- [ ] FR-003 `/auth/signin` is publicly reachable and renders the sign-in button.
- [ ] FR-004 `/api/auth/[...nextauth]` is implemented as a six-line Next.js App Router route.
- [ ] FR-005 Middleware matcher covers `/`, `/played`, `/news-monitor`. Visiting any of these without a session redirects to `/auth/signin`.
- [ ] FR-006 Page-level `getServerSession` check on each dashboard page redirects on missing session.
- [ ] FR-007 Session claims surfaced are `name`, `email`, `image` only. No `sub`, `accessToken`, `refreshToken`, `idToken`.
- [ ] FR-008 Sign-out is via the user menu (deferred to spec 005).
- [ ] FR-009 No `next-auth` secrets in the client bundle.
- [ ] FR-010 "Auth not configured" page lists missing env-var NAMES only. No values.

## Privacy and security

- [ ] No `AUTHENTIK_CLIENT_SECRET` or `NEXTAUTH_SECRET` value in the public repo.
- [ ] No real Authentik instance URL in the public repo.
- [ ] No `NEXT_PUBLIC_AUTHENTIK_*` or `NEXT_PUBLIC_NEXTAUTH_*` in the codebase.
- [ ] Session JWT does not encode OAuth tokens.

## Engineering

- [ ] Lint / build / tests pass.
- [ ] SSR/hydration deterministic.
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.