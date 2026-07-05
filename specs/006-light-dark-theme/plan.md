# Implementation Plan: Light/Dark Theme

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and this SDD; `coder` implements in the games-dashboard repo; `tester` independently verifies against this spec and the related specs 004, 005.

**Goal:** Two-state theme with no FOUC, deterministic SSR, and consistent
tokens across the dashboard. Mirror `meals-dashboard` exactly so the
sibling dashboards look related.

**Architecture:**

```
+----------------------+       +---------------------+
| <html data-theme=    |       | ThemeProvider       |
| "dark"> (server)     |  -->  | useState('dark')    |
+----------------------+       | useEffect: read LS  |
                              +---------------------+
                                       |
                                       v
                              +---------------------+
                              | useTheme()          |
                              | ThemeToggle / Menu  |
                              | uses toggleTheme()  |
                              +---------------------+
```

**Tech stack:** React 19, CSS custom properties on `:root[data-theme=...]`. No
new dependencies; `lucide-react` icons (already in the project via spec 001)
provide Sun and Moon.

---

## Implementation scope

This spec adds:

1. `lib/theme.tsx` — provider + hook.
2. `lib/user-menu.ts` — `toggleTheme` helper (shared with spec 005).
3. `components/theme-toggle.tsx` — inline toggle button.
4. `app/globals.css` — token definitions for both themes.

This spec does NOT add:

- The sign-in page mount (spec 004 adds the placeholder; this spec provides the toggle component).
- The user-menu mount (spec 005 adds the row; this spec provides the helper).

## Phase 1: Tokens

1. Update `app/globals.css` with the token sets under `:root[data-theme='dark']` and `:root[data-theme='light']`.
2. Replace any hard-coded color values in `app/globals.css` with token references.
3. Audit existing components for hard-coded colors and replace with tokens.

## Phase 2: ThemeProvider + hook

1. Create `lib/theme.tsx` with `ThemeProvider`, `useTheme`, and the
   no-FOUC initial state.
2. Mount `ThemeProvider` in `app/layout.tsx` around `{children}`.

## Phase 3: toggleTheme helper

1. Create `lib/user-menu.ts` with the `toggleTheme` pure function.
2. Unit-test the helper for both states, missing storage, missing document.

## Phase 4: ThemeToggle component

1. Create `components/theme-toggle.tsx` (`'use client'`).
2. Render the Sun/Moon icon swap.
3. Confirm accessibility (aria-label, keyboard activation).

## Phase 5: Mount on sign-in page

1. Spec 004 mounts `<ThemeToggle />` in the top-right corner of the sign-in page.
2. Confirm hydration is deterministic.

## Phase 6: Mount in user menu

1. Spec 005 mounts the theme row using `<ThemeToggle />`-equivalent logic.
2. Confirm the menu row and the inline toggle share the same code path.

## Phase 7: Verification

1. Lint / build / tests pass.
2. Confirm server-rendered HTML has `data-theme="dark"`.
3. Confirm `<html data-theme>` updates within one frame after toggle.
4. Confirm localStorage key is `'games-dashboard-theme'`.
5. Hand to `tester` for:
   - FOUC absence for first-time visitors.
   - Theme persistence across reload.
   - Sun/Moon icon swap matches the current state.
   - Sign-in page mount point works without auth.
   - User menu row flips the theme via the same helper as the inline toggle.
6. Fix tester failures before reporting complete.

## Branch and deployment policy

- Default target: `main` (Production).
- Long-lived `preview` branch for higher-risk workstreams.
- Do not default routine work to `preview`. Ask before using it.