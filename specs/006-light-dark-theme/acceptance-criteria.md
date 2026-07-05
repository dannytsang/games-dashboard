# Acceptance Criteria: Light/Dark Theme

> **Status:** Draft — created 2026-07-05.

## Product behaviour

- [ ] FR-001 Two states: `'dark'` (default), `'light'`. No other states.
- [ ] FR-002 Server-rendered HTML carries `data-theme="dark"` on `<html>`.
- [ ] FR-003 Theme persists in `localStorage` under `'games-dashboard-theme'`.
- [ ] FR-004 `ThemeProvider` initialises with `'dark'`, hydrates from localStorage on mount, updates `<html data-theme>`.
- [ ] FR-005 `toggleTheme` is a pure helper. Storage write is optional. Document write is optional. Returns the next value.
- [ ] FR-006 CSS tokens are defined for both themes. Every theme-dependent value is a `var(--token)` reference.
- [ ] FR-007 `<ThemeToggle />` renders Sun in dark mode, Moon in light mode. `aria-label="Toggle theme"`. Keyboard activatable.
- [ ] FR-008 User-menu theme row uses the same `toggleTheme` helper. Icon swap matches.
- [ ] FR-009 No FOUC for first-time visitors. Stored theme causes a one-frame update on hydration (acceptable).
- [ ] FR-010 No theme in URL. No theme in snapshot data. No theme cookie.
- [ ] FR-011 `useTheme` outside provider throws. `toggleTheme` with null storage/doc returns next without throwing.

## Privacy and security

- [ ] localStorage key is `'games-dashboard-theme'` — namespaced to this dashboard.
- [ ] No theme value in cookies, URL, or snapshot data.
- [ ] No `NEXT_PUBLIC_THEME` env var.

## Engineering

- [ ] Lint / build / tests pass.
- [ ] SSR/hydration deterministic.
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.