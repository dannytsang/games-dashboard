# Spec 006: Light/Dark Theme

> **Status note:** Draft created 2026-07-05 alongside specs 003 (Data
> Architecture), 004 (OIDC Authentication), and 005 (Logged User & Menu).
> Modeled on `meals-dashboard`'s theme layer, adapted to the games
> dashboard's narrower scope.
>
> **State:** Draft (no implementation yet).
> **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
> **Created:** 2026-07-05.
> **Last updated:** 2026-07-05.

## Summary

Provide a two-state (light, dark) theme with no FOUC and deterministic
SSR. The theme is persisted in `localStorage` and applied to the
`<html data-theme>` attribute. A toggle is mounted on the sign-in page
(spec 004) and inside the user menu (spec 005).

This is the visual-layer contract for the games dashboard. The auth
provider is owned by spec 004. The user menu shell is owned by spec 005.
The data-plane contract is spec 003.

## Status

- **State:** Draft.
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
- **Created:** 2026-07-05.
- **Last updated:** 2026-07-05.

## Goals

1. Two-state theme (light, dark) with deterministic SSR.
2. No flash of unstyled / wrong-theme content (FOUC).
3. Persistence in `localStorage` under a dashboard-scoped key.
4. Toggle available on the sign-in page (pre-auth) and in the user menu (post-auth).
5. Theme tokens exposed as CSS custom properties.
6. Privacy: no theme value in the client URL, no theme in the snapshot data.

## Non-goals

- No high-contrast theme, no system-preference auto-detection (other than the default).
- No per-component theme overrides (no `useTheme` for individual cards).
- No theme animation/transition library.
- No theme export / import (a single device is the only consumer).
- No CSS-in-JS — the implementation uses CSS custom properties on `:root[data-theme=...]`.

## Relationship to other specs

- **Depends on:** none (can be implemented first), but spec 004 expects the
  sign-in page to mount the toggle, and spec 005 expects the menu to call
  the toggle helper.
- **Required by:** spec 004 (sign-in page), spec 005 (menu entry).
- **Implementation reference:** `meals-dashboard/lib/theme.tsx`, `meals-dashboard/components/theme-toggle.tsx`, `meals-dashboard/components/auth-signin-page.tsx` (theme toggle in the corner).

## Users

- **Danny:** the only user. Sees the same theme on every page within a single browser.

## Functional requirements

### FR-001 Two states: dark (default), light

The two states are `'dark'` and `'light'`. Default is `'dark'` — the
server-rendered HTML carries `data-theme="dark"` on `<html>` so there is
no FOUC for first-time visitors.

### FR-002 No-FOUC SSR contract

The server-rendered HTML MUST carry `data-theme="dark"` on `<html>` for
first-time visitors (no localStorage on the server). After hydration,
the `ThemeProvider` reads localStorage and, if a value is present,
updates `<html data-theme>` to match. If localStorage has no value, the
default `'dark'` stays.

### FR-003 Persistence

Theme is persisted in `localStorage` under the key
`'games-dashboard-theme'` (matches `meals-dashboard`'s
`'meals-dashboard-theme'` pattern, namespaced for this dashboard). The
key is part of the public contract.

### FR-004 ThemeProvider (client component)

```ts
// lib/theme.tsx
'use client';

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element;
export function useTheme(): { theme: Theme; toggleTheme: () => void };
```

The provider:

1. Initialises with `'dark'`.
2. On mount, reads localStorage and updates `<html data-theme>` accordingly.
3. Exposes `theme` and `toggleTheme` via context.

### FR-005 toggleTheme helper

```ts
// lib/user-menu.ts (mirrors meals-dashboard)
export type Theme = 'dark' | 'light';

export function toggleTheme(
  currentTheme: Theme,
  storage?: Storage | null,
  doc?: Document | null,
): Theme;
```

Behaviour:

1. Compute `next = currentTheme === 'dark' ? 'light' : 'dark'`.
2. If `storage` is provided, write `next` to `localStorage` under `'games-dashboard-theme'`.
3. If `doc` is provided, set `document.documentElement.setAttribute('data-theme', next)`.
4. Return `next`.

The helper is pure at the call site (the caller does `setState(next)`).
Both the inline `<ThemeToggle />` and the menu row's click handler go
through this same helper.

### FR-006 CSS tokens

All theme-dependent values are CSS custom properties scoped to
`html[data-theme=dark]` and `html[data-theme=light]`:

```css
:root[data-theme='dark'] {
  --bg-primary: #0b1220;
  --bg-secondary: #111a2e;
  --bg-tertiary: #1a2440;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border-color: #1e293b;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --shadow-md: 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.4);
}

:root[data-theme='light'] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border-color: #e2e8f0;
  --accent-emerald: #059669;
  --accent-amber: #d97706;
  --accent-rose: #e11d48;
  --shadow-md: 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.08);
}
```

The token values mirror `meals-dashboard` so the dashboards feel like
siblings.

### FR-007 ThemeToggle component

A small button rendered on the sign-in page (top-right corner) and as
an inline button in any other context. Icon: Sun in dark mode, Moon in
light mode. The icon reflects the CURRENT state (the icon shows what
you'll flip TO if you click).

### FR-008 Menu row integration

The user menu (spec 005) mounts a theme row that:

1. Calls `toggleTheme` from this spec.
2. Updates its local `theme` state with the returned value.
3. Closes the menu on toggle.

The row's icon mirrors the `<ThemeToggle />` icon contract.

### FR-009 Hydration safety

The server-rendered HTML MUST NOT depend on the user's stored theme.
It MUST render with `data-theme="dark"` and the `ThemeProvider` MUST
hydrate without causing a visible jump for users whose stored value
matches the default. Users whose stored value is `light` will see one
visual update on first paint after hydration; this is acceptable and is
the same trade-off as `meals-dashboard`.

### FR-010 Privacy: no theme in client URL or snapshot

- No theme query parameter, no theme path segment.
- No theme field in any snapshot (played, news-monitor).
- No theme value in cookies (localStorage only).

### FR-011 Failure modes

| Failure | Behaviour |
|---|---|
| localStorage unavailable (private browsing) | `toggleTheme` returns the new value but skips the storage write. The DOM attribute is still updated. |
| `document` unavailable (SSR) | `toggleTheme` skips the DOM write. The helper is safe to call server-side (returns the next value). |
| `useTheme` outside provider | Throws an error with a clear message. |

## Non-functional requirements

- The theme switch MUST update the DOM within one frame (no animation by default).
- CSS custom properties MUST be defined on `:root` so every component
  can consume them without a wrapper.
- The toggle MUST be accessible via keyboard (Tab + Enter/Space).

## Resolved design decisions

| Question | Decision |
|---|---|
| States | `'dark'` (default), `'light'`. No system-preference auto-detect. |
| Persistence | `localStorage` under `'games-dashboard-theme'`. |
| Default theme | `'dark'` for first-time visitors. |
| No-FOUC mechanism | Server renders `data-theme="dark"`; client hydrates and updates if needed. |
| Token system | CSS custom properties on `:root[data-theme=...]`. |
| Icon contract | Sun in dark mode, Moon in light mode. |
| Toggle surface | Sign-in page (spec 004) and user menu (spec 005). |
| Theme in URL/data | None. localStorage only. |

## Open questions

See `open-questions.md`.

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.