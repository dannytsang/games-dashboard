# Open Questions

1. Which games data sources are in scope for v1? Likely candidates:
   - Steam (owned games, achievements, recent activity)
   - PlayStation trophies
   - Nintendo Switch (limited public APIs)
   - Backloggd / RAWG / IGDB (third-party metadata)
   - Manual list (fallback / override)
2. Where is the canonical games data stored today, if anywhere?
3. What exact runtime object path should hold the current games snapshot?
   Proposed: `games-dashboard/v1/{source}/latest.json` in Vercel Blob.
4. Should historical snapshots be retained, and if so for how long?
5. What Hermes-side process should publish the normalised snapshot to the runtime store?
6. Which Hermes skills/feeds will produce the source data?
7. Which pages should the dashboard expose — single landing page, or one per source?
8. Should resolved / shelved / replay games appear in MVP, or only active / backlog?
9. Should the first UI include trend / count summaries, or just the backlog list?
10. What auth provider should protect production? (Authentik/OIDC if mirroring coms-dashboard, or alternative.)