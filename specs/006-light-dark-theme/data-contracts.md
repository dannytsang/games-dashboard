# Data Contracts: Light/Dark Theme

> **Status:** Draft — created 2026-07-05.
> Mirrors `meals-dashboard/lib/theme.tsx` and `meals-dashboard/lib/user-menu.ts`.

## Theme type

```ts
export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

export const THEME_STORAGE_KEY = 'games-dashboard-theme';
```

`THEME_STORAGE_KEY` is part of the public contract; renaming it is a
breaking change.

## Pure helpers

```ts
// lib/user-menu.ts (shared with spec 005)
export function toggleTheme(
  currentTheme: Theme,
  storage?: Storage | null,
  doc?: Document | null,
): Theme;
```

Behaviour:

1. `next = currentTheme === 'dark' ? 'light' : 'dark'`
2. If `storage` provided: `storage.setItem(THEME_STORAGE_KEY, next)`
3. If `doc` provided: `doc.documentElement.setAttribute('data-theme', next)`
4. Return `next`

The helper MUST NOT throw on `storage === null` or `doc === null`; both
parameters are optional and gracefully skipped.

## React context

```ts
// lib/theme.tsx
'use client';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element;
export function useTheme(): ThemeContextValue;  // throws if outside provider
```

Initial state: `theme: 'dark'`. On mount, the provider reads
`localStorage.getItem(THEME_STORAGE_KEY)` and, if it is `'light'` or
`'dark'`, sets the state and updates `<html data-theme>`.

## CSS tokens

The token set is duplicated under both selectors. Values mirror
`meals-dashboard` so the dashboards look like siblings.

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

## Component contracts

```ts
// components/theme-toggle.tsx
'use client';

export function ThemeToggle(): JSX.Element;
```

The component:

1. Calls `useTheme()`.
2. Renders a `<button>` with `aria-label="Toggle theme"`.
3. Shows the Sun icon when `theme === 'dark'`, Moon icon otherwise.

## Verification commands

```bash
# Confirm storage key is games-dashboard-scoped
grep -q "games-dashboard-theme" lib/user-menu.ts && echo "storage key scoped"

# Confirm no theme in URL or snapshot
git ls-files | xargs grep -lE 'theme=(dark|light)' && exit 1 || echo clean

# Confirm server-side default is 'dark'
grep -q 'data-theme="dark"' app/layout.tsx && echo "server default ok"

# Confirm both theme variants are defined
grep -q ":root\[data-theme='light'\]" app/globals.css && echo "light variant ok"
```