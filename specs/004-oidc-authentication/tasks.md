# Tasks: OIDC Authentication

## Ready-now preparation tasks

- [x] Draft this spec (004) from templates.
- [ ] Cross-link from spec 001 FR-005 ("Authentication required").

## Implementation batch tasks

- [ ] Add `next-auth` and `next-auth/providers/authentik` to `dependencies`.
- [ ] Create `lib/auth.ts` (authOptions + helpers).
- [ ] Create `app/api/auth/[...nextauth]/route.ts`.
- [ ] Create `middleware.ts` at repo root with the documented matcher.
- [ ] Create `app/auth/signin/page.tsx` (thin route → component).
- [ ] Create `components/auth-signin-page.tsx` with the Authentik button.
- [ ] Add `getServerSession` calls to `app/page.tsx`, `app/played/page.tsx`, `app/news-monitor/page.tsx`.
- [ ] Add redirect on missing session.
- [ ] Render "auth not configured" page when env vars are missing.

## Verification tasks

- [ ] Lint / build / tests pass.
- [ ] Privacy/secret scan clean.
- [ ] No `NEXT_PUBLIC_AUTHENTIK_*` or `NEXT_PUBLIC_NEXTAUTH_*` in the codebase.
- [ ] No real Authentik URLs in the codebase.
- [ ] Middleware matcher covers all dashboard routes.
- [ ] Sign-in page renders without crashing when env vars are missing.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.