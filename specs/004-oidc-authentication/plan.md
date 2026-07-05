# Implementation Plan: OIDC Authentication

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and this SDD; `coder` implements in the games-dashboard repo; `tester` independently verifies against this spec and the related specs 001, 003, 005.

**Goal:** Gate the games dashboard behind Authentik OIDC via NextAuth.js.
Mirror the `meals-dashboard` pattern. Page-level checks as defence in depth.

**Architecture:**

```
Browser  --->  middleware.ts (withAuth)  --->  protected page
                     |
                     | (no session)
                     v
                /auth/signin
                     |
                     v (Authentik)
                /api/auth/[...nextauth]  (callback)
                     |
                     v (JWT cookie set)
                back to /
```

**Tech stack:** Next.js 15 App Router, NextAuth.js 4.x, `next-auth/providers/authentik`. No database. JWT-only sessions.

---

## Implementation scope

This spec adds:

1. `lib/auth.ts` — NextAuth.js options + Authentik provider.
2. `app/api/auth/[...nextauth]/route.ts` — NextAuth.js handler.
3. `middleware.ts` — at repo root.
4. `app/auth/signin/page.tsx` and `components/auth-signin-page.tsx` — sign-in UI.
5. Server-side session resolution at the top of every protected page.
6. The "auth not configured" error page.

This spec does NOT add:

- The user chip / menu (spec 005).
- The theme toggle (spec 006) — though spec 006 mounts the toggle on the sign-in page.

## Phase 1: Wire NextAuth.js

1. Add `next-auth` and `next-auth/providers/authentik` to `dependencies` in `package.json`.
2. Create `lib/auth.ts` with `authOptions`, `getMissingAuthEnvironment`, `assertAuthConfigured`.
3. Create `app/api/auth/[...nextauth]/route.ts` with the standard handler.

## Phase 2: Wire middleware

1. Create `middleware.ts` at repo root with `withAuth` and the matcher.
2. Confirm the matcher covers `/`, `/played`, `/news-monitor`.
3. Confirm the matcher excludes `/auth/signin` and `/api/auth/:path*`.

## Phase 3: Wire sign-in page

1. Create `app/auth/signin/page.tsx` (thin route → component).
2. Create `components/auth-signin-page.tsx` with the Authentik sign-in button.
3. Mount the theme toggle on the sign-in page (defer the actual toggle implementation to spec 006; this spec only adds the placeholder mount point).

## Phase 4: Page-level checks

1. Add `getServerSession(authOptions)` to `app/page.tsx`, `app/played/page.tsx`, `app/news-monitor/page.tsx`.
2. Redirect on missing session.
3. Confirm the build still passes with the auth gate in place.

## Phase 5: Verification

1. Run lint / build / tests.
2. Run the privacy/secret scan.
3. Hand to `tester` for independent verification:
   - Visiting `/` without a session redirects to `/auth/signin`.
   - Visiting `/played` without a session redirects.
   - Visiting `/auth/signin` shows the sign-in button (no crash even with missing env vars — the "auth not configured" page is shown).
   - Visiting `/api/auth/[...nextauth]/providers` returns the Authentik provider metadata (or 500 if env vars are missing — both are acceptable for the unauthenticated smoke test).
4. Fix tester failures before reporting complete.

## Branch and deployment policy

- Default target: `main` (Production).
- Long-lived `preview` branch for higher-risk workstreams that warrant Vercel Preview.
- Auth wiring MUST land on `main`; do not merge to `preview` without explicit confirmation.
- Preview deployments must satisfy the same no-secrets rule.