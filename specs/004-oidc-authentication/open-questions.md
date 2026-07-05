# Open Questions

1. Should the sign-in page include a "Powered by Authentik" footer, or
   be entirely branded as the games dashboard? (Current decision: dashboard-branded only.)
2. Should there be a "remember me" toggle on the sign-in page, or rely
   on NextAuth.js's default 30-day cookie? (Current decision: rely on defaults.)
3. Should the `NEXTAUTH_URL` be set automatically by Vercel, or do we
   need to set it explicitly? (Current decision: rely on Vercel auto-detection.)
4. Should the session callback add any custom claim (e.g. a
   `dashboardRole`), or keep it minimal? (Current decision: minimal — `name`, `email`, `image` only.)
5. Should there be a logout-everywhere flow, or rely on per-session
   JWT expiry? (Current decision: per-session JWT expiry, no remote logout.)