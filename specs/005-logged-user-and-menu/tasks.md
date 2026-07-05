# Tasks: Logged User & Menu

## Ready-now preparation tasks

- [x] Draft this spec (005) from templates.
- [ ] Cross-link from spec 001 (header composition).
- [ ] Cross-link from spec 004 (session claims contract).

## Implementation batch tasks

- [ ] Create `lib/user-chip.ts` with `USER_NAME_FALLBACK` and `resolveUserChipName`.
- [ ] Create `lib/user-menu.ts` with `toggleTheme` and `signOut` wrappers.
- [ ] Create `components/user-chip.tsx` (server-rendered).
- [ ] Create `components/user-menu.tsx` (`'use client'`).
- [ ] Update `app/layout.tsx` to mount the chip + menu.
- [ ] Pass `userName` from `getServerSession` (spec 004).
- [ ] Implement click-outside and Escape close.
- [ ] Implement focus-on-open and focus-return-on-close.

## Verification tasks

- [ ] Lint / build / tests pass.
- [ ] Privacy/secret scan clean.
- [ ] No `sub`, `accessToken`, `refreshToken`, `idToken` referenced in chip/menu code.
- [ ] `data-user-chip-display` and `title` present in rendered HTML.
- [ ] Sign-out redirects to `/auth/signin?callbackUrl=/`.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.