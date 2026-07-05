# Open Questions

1. Should the theme respect `prefers-color-scheme` for first-time
   visitors, or always default to `'dark'`? (Current decision: always
   `'dark'` for predictability; auto-detect is a future enhancement.)
2. Should the theme persist per-browser or per-account? (Current
   decision: per-browser; account-scoped theme is a future enhancement.)
3. Should the toggle support a "system" third state? (Current decision:
   no — two states only for MVP.)
4. Should the theme be exported via a CSS-in-JS solution for dynamic
   theming? (Current decision: no — CSS custom properties only.)
5. Should the dashboard ship a custom theme picker (e.g. emerald, sapphire)? (Current decision: no — two states only.)