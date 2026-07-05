# Implementation Plan: Logged User & Menu

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and this SDD; `coder` implements in the games-dashboard repo; `tester` independently verifies against this spec and the related specs 001, 004, 006.

**Goal:** Render a server-rendered user chip and a click-to-open dropdown
menu (theme toggle + sign out) on every authenticated page. Mirror the
`meals-dashboard` pattern; drop the debug-mode row.

**Architecture:**

```
+--------------------+       +--------------------+
| server component   |       | client component   |
| (page.tsx)         |       | (UserMenu)         |
| resolveUserChipName| ----> | open/close state   |
| render <UserChip>  |       | theme toggle row   |
+--------------------+       | sign-out row       |
                             +--------------------+
                                       |
                                       v
                              +--------------------+
                              | next-auth/react    |
                              | signOut            |
                              +--------------------+
```

**Tech stack:** Next.js 15, React 19, `next-auth/react` for the sign-out
function. No new dependencies beyond what spec 004 adds.

---

## Implementation scope

This spec adds:

1. `lib/user-chip.ts` — pure helpers.
2. `lib/user-menu.ts` — pure helpers (toggleTheme + signOut wrapper).
3. `components/user-chip.tsx` — server-rendered chip.
4. `components/user-menu.tsx` — client menu wrapper.
5. Header layout that mounts the chip + menu on every page.

This spec does NOT add:

- The theme provider or theme toggle implementation (spec 006).
- The sign-out handler logic (spec 004 covers it).
- Account management, MFA, profile pages.

## Phase 1: Pure helpers

1. Create `lib/user-chip.ts` with `USER_NAME_FALLBACK` and `resolveUserChipName`.
2. Create `lib/user-menu.ts` with `toggleTheme` and `signOut` wrappers.

## Phase 2: UserChip component

1. Create `components/user-chip.tsx` (server-rendered).
2. Confirm the chip renders without hydration errors.
3. Confirm `data-user-chip-display` and `title` are present in the HTML.

## Phase 3: UserMenu component

1. Create `components/user-menu.tsx` (`'use client'`).
2. Implement open/close state.
3. Implement click-outside and Escape close.
4. Implement focus-on-open and focus-return-on-close.
5. Wire the theme row (delegates to spec 006's `toggleTheme`).
6. Wire the sign-out row (delegates to `next-auth/react`'s `signOut`).

## Phase 4: Mount in header

1. Update `app/layout.tsx` to render the chip + menu in the header.
2. Pass `userName` from `getServerSession` (spec 004).

## Phase 5: Verification

1. Lint / build / tests pass.
2. Privacy/secret scan clean.
3. Confirm no `sub`, `accessToken`, etc. are read in chip/menu code.
4. Hand to `tester` for:
   - Server-rendered chip on every authenticated page.
   - Menu opens on click, closes on outside-click and Escape.
   - Sign-out redirects to `/auth/signin?callbackUrl=/`.
   - Theme row delegates to spec 006's helper.
5. Fix tester failures before reporting complete.

## Branch and deployment policy

- Default target: `main` (Production).
- Long-lived `preview` branch for higher-risk workstreams.
- Do not default routine work to `preview`. Ask before using it.