# Spec 005: Logged User & Menu

> **Status note:** Draft created 2026-07-05 alongside specs 003 (Data
> Architecture), 004 (OIDC Authentication), and 006 (Light/Dark Theme).
> Modeled on `meals-dashboard` specs 023 (User Chip) and 026 (User Menu),
> adapted to the games dashboard's narrower scope (no debug-mode row).
>
> **State:** Draft (no implementation yet).
> **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
> **Created:** 2026-07-05.
> **Last updated:** 2026-07-05.

## Summary

Display the signed-in user's identity in a small header chip and provide
a click-to-open dropdown menu with three actions: theme toggle, sign out.
The chip is the at-a-glance identity confirmation; the menu is the
interactive surface for the actions the user can take from any page.

This is the identity-and-account-menu contract for the games dashboard.
The auth provider is owned by spec 004. The theme toggle entry in the
menu is owned by spec 006 (this spec only specifies that the entry
exists; the toggle implementation lives in spec 006).

## Status

- **State:** Draft.
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
- **Created:** 2026-07-05.
- **Last updated:** 2026-07-05.

## Goals

1. Persistent header chip showing the signed-in user's display name.
2. Click-to-open dropdown menu anchored on the chip.
3. Menu entries: theme toggle, sign out.
4. Server-rendered chip with no client-side identity claims.
5. Privacy by default: chip reads only `name`, `email`; never `sub`, `accessToken`, etc.
6. Accessibility: keyboard navigable, focus-managed, ARIA-correct.

## Non-goals

- No debug-mode menu row (meals-dashboard has one; the games dashboard does not need it).
- No account management (password change, MFA setup) — that lives in Authentik.
- No "Signed in as" footer or banner (already covered by the chip).
- No language or locale switcher.
- No notification settings.

## Relationship to other specs

- **Depends on:** spec 004 (auth provider, session shape).
- **Required by:** spec 006 (theme toggle mounts inside the menu).
- **Cites:** spec 004 (session claims contract).
- **Implementation reference:** `meals-dashboard/lib/user-chip.ts`, `meals-dashboard/lib/user-menu.ts`, `meals-dashboard/components/user-chip.tsx`, `meals-dashboard/components/user-menu.tsx`.

## Users

- **Danny:** the only user. Sees his own chip on every page.

## Functional requirements

### FR-001 User chip (always visible)

A small, read-only `<span>` rendered in the dashboard header on every
authenticated page. Content: 👤 emoji + "Welcome, " + display name. The
chip is server-rendered — no `'use client'`, no hooks, no `fetch`.

### FR-002 Display name resolution

The display name is resolved by `resolveUserChipName(session.user)`:

1. Trimmed `name` if non-empty.
2. Trimmed `email` if `name` is empty.
3. `USER_NAME_FALLBACK` ("authorised traveller") otherwise.

The fallback is the literal string `"authorised traveller"` and is part
of the public contract.

### FR-003 Session claim restriction

The chip MUST NOT read or render any of:

- `sub`
- `accessToken`, `refreshToken`, `idToken`
- Any custom claim (e.g. `dashboardRole`, `groups`, `permissions`)
- The raw email address beyond the fallback derivation

This is the same restriction as `meals-dashboard/lib/user-chip.ts` FR-006.

### FR-004 Privacy boundary

The chip is server-rendered. The HTML MUST contain only the display name
and the emoji. The full name is also exposed via the `title` attribute
(tooltip on hover) and via the `data-user-chip-display` data attribute
for tests.

### FR-005 Long-name handling

Names longer than 48 characters get a CSS `text-overflow: ellipsis` and
a `title={display}` so the full value is available as a hover-tooltip.
The `data-user-chip-display` attribute always carries the full value
for tests regardless of truncation.

### FR-006 User menu (click-to-open)

A click-to-open dropdown menu anchored on the chip. The chip becomes a
button when this menu wraps it.

Menu entries (in DOM order):

1. **Identity header row** — decorative. "Signed in as" + display name.
2. **Theme menu row** — opens the theme cycle (spec 006).
3. **Sign out menu row** — calls `signOut({ callbackUrl: '/auth/signin?callbackUrl=/' })`.

### FR-007 Menu behaviour

- Click outside the menu closes it.
- `Escape` key closes it.
- On open, focus moves to the first interactive row.
- On close, focus returns to the trigger.
- Clicking a row fires its action and closes the menu.
- The chevron rotates 180° when open.

### FR-008 Sign-out entry

The sign-out entry calls NextAuth.js's `signOut` with
`{ callbackUrl: '/auth/signin?callbackUrl=/' }` (matches spec 004
sign-in redirect contract).

### FR-009 Theme entry

The theme entry delegates to spec 006's `toggleTheme` helper. This spec
only specifies that the row exists and that clicking it flips the theme.

### FR-010 Empty / null session handling

If the session is missing for any reason (race condition during sign-in
callback, expired JWT mid-request), the chip is omitted entirely — it
does NOT render with the fallback string. The menu is also omitted. The
middleware (spec 004) is the primary gate; this is defence-in-depth.

### FR-011 Accessibility

- The chip is `aria-label="Signed in as {display}"`.
- The trigger button is `aria-haspopup="menu"`, `aria-expanded={open}`, `aria-controls="user-menu-panel"`.
- Each row is `role="menuitem"`; the theme row toggles state and uses
  `role="menuitem"` (no checkbox behaviour — it's a cycle, not a toggle).
- The chevron is `aria-hidden="true"`.
- The identity header is `aria-hidden="true"` (decorative; the chip's
  accessible name already carries the identity).
- The theme row's icon reflects the CURRENT state (the icon shows what
  you'll flip TO).

### FR-012 Failure modes

| Failure | Behaviour |
|---|---|
| Session is missing | Chip and menu are omitted. Page renders as if logged-out (middleware will redirect). |
| Theme helper throws | Catch in the row handler; close the menu; log `theme_toggle_failed` server-side. |
| Sign-out fails | The NextAuth.js error is caught by the row handler; menu stays open with an inline error message. |
| Menu state desyncs with server | `useEffect` resets on focus loss or route change. |

## Non-functional requirements

- The chip MUST render server-side, not require client hydration for first paint.
- The menu MUST NOT include any client-side fetch on open.
- The chip's data attribute MUST be present in the rendered HTML so test
  harnesses can assert on it without a full DOM render.

## Resolved design decisions

| Question | Decision |
|---|---|
| Chip placement | Top-right of the header, next to the nav. |
| Display name fallback | `"authorised traveller"` (matches `meals-dashboard`). |
| Chip content | "👤 Welcome, {name}" — emoji + "Welcome, " + name. |
| Identity claim surfaced | `name`, `email` only. No `sub`, no tokens. |
| Menu entries | Identity header (decorative), Theme, Sign out. No debug row. |
| Menu trigger | The chip becomes a button when wrapped by the menu. |
| Long-name cap | 48 characters; ellipsis + title attribute. |
| Empty session | Chip and menu are omitted entirely. |

## Open questions

See `open-questions.md`.

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.