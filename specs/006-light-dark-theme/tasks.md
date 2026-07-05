# Tasks: Light/Dark Theme

## Ready-now preparation tasks

- [x] Draft this spec (006) from templates.
- [ ] Cross-link from spec 004 (sign-in page mount).
- [ ] Cross-link from spec 005 (user menu row).

## Implementation batch tasks

- [ ] Update `app/globals.css` with `:root[data-theme='dark']` and `:root[data-theme='light']` tokens.
- [ ] Audit existing components for hard-coded colors; replace with tokens.
- [ ] Create `lib/theme.tsx` with `ThemeProvider` and `useTheme`.
- [ ] Mount `ThemeProvider` in `app/layout.tsx`.
- [ ] Create `lib/user-menu.ts` with `toggleTheme`.
- [ ] Unit-test `toggleTheme` for both states, missing storage, missing document.
- [ ] Create `components/theme-toggle.tsx`.
- [ ] Mount `<ThemeToggle />` on the sign-in page (spec 004).
- [ ] Mount the theme row in the user menu (spec 005).

## Verification tasks

- [ ] Lint / build / tests pass.
- [ ] Server-rendered HTML has `data-theme="dark"`.
- [ ] `<html data-theme>` updates within one frame after toggle.
- [ ] localStorage key is `'games-dashboard-theme'`.
- [ ] No FOUC for first-time visitors (verified via headless screenshot).
- [ ] Theme persists across page reload.
- [ ] Sun/Moon icon swap matches the current state.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.