# Open Questions

1. Should the menu include a "Profile" entry that links to Authentik's
   profile page? (Current decision: no — Authentik handles profile.)
2. Should the chip be hidden on the `/auth/signin` page? (Current decision: yes — sign-in page is pre-auth.)
3. Should the menu auto-close on route change? (Current decision: yes, via `useEffect` on pathname.)
4. Should the menu support keyboard shortcuts (e.g. `Alt+T` for theme,
   `Alt+L` for sign-out)? (Current decision: no — keyboard is via Tab navigation.)