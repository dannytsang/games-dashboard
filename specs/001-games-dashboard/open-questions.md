# Open Questions

## Resolved by 2026-07-05 spec refinement

1. ~~What exactly does each dashboard page show?~~ → Resolved: `/`, `/played`, `/news-monitor`. `/played` per FR-007, `/news-monitor` per FR-008, `/` per FR-009.
2. ~~Should resolved / shelved / replay games appear in MVP, or only active / backlog?~~ → Resolved: any played game appears on `/played` with a per-row eligibility verdict. `GameStatus` values still cover backlog / playing / completed / shelved / replay / wishlist / unknown.
3. ~~Should the first UI include trend / count summaries, or just the backlog list?~~ → Resolved: Summary (`/`) exposes counts only; per-page lists live on `/played` and `/news-monitor`.
4. ~~Which pages should the dashboard expose?~~ → Resolved: three top-level pages — `/`, `/played`, `/news-monitor`.

## Outstanding

1. **News sources** for the monitor feed. Likely candidates:
   - IGDB (game metadata + release dates)
   - Steam News API (per-game news)
   - RSS feeds (e.g. official publisher feeds)
   - Backloggd (community updates)
   - Manual entries (Danny-curated allow-list)
   What is the source mix? Is there already a producer in place somewhere?
2. **Delivery channel** for news items — Telegram, WhatsApp, Email, RSS, dashboard-only?
3. **Producer location** for `played/latest.json` and `news-monitor/latest.json`:
   - A Hermes skill on the `home` profile?
   - An external cron / GitHub Action?
   - A manual script Danny runs?
   - A combination (per-source producers + an aggregator)?
4. **Storage target** — Vercel Blob (mirror coms-dashboard), Vercel KV, a local SQLite synced to a private bucket, or something else?
5. **Eligibility thresholds** — defaults of `PLAYED_RECENT_DAYS=30` and `LAUNCH_WINDOW_DAYS=90` are written into the spec. Override?
6. **Eligibility rule** — combined (any of three reasons qualifies) vs. stricter (require recent activity AND recent launch, etc.). Override?
7. **Manual opt-in source-of-truth** — a YAML/JSON file in the private Hermes workspace, a Todoist task, a Notion DB, or a Vercel Blob allow-list object?
8. **What auth provider should protect production?** Authentik/OIDC (mirror coms-dashboard) or alternative?
9. **Historical retention** — should we keep dated snapshots, and for how long?
10. **Drift remediation policy** — when a news-monitor entry's eligibility drifts, do we surface only, or also produce a TODO/notification?