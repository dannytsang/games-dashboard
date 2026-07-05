# Data Contracts: Logged User & Menu

> **Status:** Draft — created 2026-07-05.
> Mirrors `meals-dashboard/lib/user-chip.ts` and `meals-dashboard/lib/user-menu.ts`.

## Session shape (subset consumed)

```ts
export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
```

The session JWT MAY include other claims, but the chip and menu MUST NOT
read them. (See spec 004 FR-007.)

## Pure helpers

```ts
// lib/user-chip.ts

export const USER_NAME_FALLBACK: 'authorised traveller';

export function resolveUserChipName(
  user: SessionUser | null | undefined,
  fallback?: string,
): string;
```

Resolution order:

1. Trimmed `user.name` if non-empty.
2. Trimmed `user.email` if `name` is empty.
3. Trimmed `fallback` (default: `USER_NAME_FALLBACK`).

The function MUST trim whitespace and MUST treat `null`/`undefined` as
empty. It MUST return a non-empty string in all cases.

## Component contracts

```ts
// components/user-chip.tsx
export interface UserChipProps {
  /** Pre-resolved display name (call resolveUserChipName first). */
  userName: string;
}

// components/user-menu.tsx
export interface UserMenuProps {
  userName: string;
  initialTheme?: 'dark' | 'light';  // default 'dark' to match ThemeProvider
}
```

The chip is server-rendered (no `'use client'`). The menu is a thin
client wrapper (`'use client'`) that owns open/close state.

## Menu row data-testids

| Row | testid |
|---|---|
| Trigger button | `user-menu-trigger` |
| Panel | `user-menu-panel` |
| Theme row | `user-menu-theme-row` |
| Sign-out row | `user-menu-signout-row` |

## Pure helper for theme toggle

```ts
// lib/user-menu.ts
export type Theme = 'dark' | 'light';

export function toggleTheme(
  currentTheme: Theme,
  storage?: Storage | null,
  doc?: Document | null,
): Theme;
```

The localStorage key is `'games-dashboard-theme'` (mirrors the
`'meals-dashboard-theme'` key in `meals-dashboard`). The helper writes
the new value to localStorage AND sets `document.documentElement.setAttribute('data-theme', next)`.

## Verification commands

```bash
# Confirm no OAuth claims surface in the chip
git ls-files | xargs grep -lE "session\?\.user\.(sub|accessToken|refreshToken|idToken)" && exit 1 || echo clean

# Confirm fallback string is the public contract
grep -q "authorised traveller" lib/user-chip.ts && echo "fallback ok"

# Confirm localStorage key is the games-dashboard key, not the meals-dashboard one
grep -q "games-dashboard-theme" lib/user-menu.ts && echo "storage key ok"
```