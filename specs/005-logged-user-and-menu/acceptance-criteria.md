# Acceptance Criteria: Logged User & Menu

> **Status:** Draft — created 2026-07-05.

## Product behaviour

- [ ] FR-001 User chip is visible on every authenticated page.
- [ ] FR-002 Display name resolves to trimmed `name` > trimmed `email` > fallback.
- [ ] FR-003 No `sub`, `accessToken`, `refreshToken`, `idToken` read or rendered.
- [ ] FR-004 Chip is server-rendered. `data-user-chip-display` and `title` carry the full value.
- [ ] FR-005 Names longer than 48 chars get `text-overflow: ellipsis` and a `title` attribute.
- [ ] FR-006 User menu opens on chip click; entries: identity header (decorative), theme row, sign-out row.
- [ ] FR-007 Click outside and Escape close the menu. Focus returns to trigger on close. Focus moves to first row on open. Chevron rotates.
- [ ] FR-008 Sign-out calls `next-auth/react`'s `signOut` with the spec 004 callback URL.
- [ ] FR-009 Theme row delegates to spec 006's `toggleTheme` helper.
- [ ] FR-010 Missing session → chip and menu omitted entirely.
- [ ] FR-011 Accessibility: ARIA-correct chip, trigger, panel, rows. Chevron and identity header are `aria-hidden`.
- [ ] FR-012 Failure modes logged server-side; no client-side error leakage.

## Privacy and security

- [ ] No OAuth tokens, no `sub`, no claims beyond `name`/`email`/`image` reach the chip or menu.
- [ ] No `NEXT_PUBLIC_*` env vars introduced.

## Engineering

- [ ] Lint / build / tests pass.
- [ ] SSR/hydration deterministic.
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.