# Open Questions

> **Note:** As of 2026-07-05, most of the original open questions are resolved — see `spec.md` § "Resolved design decisions" for the full table. This file is kept for traceability of what was decided and why.

## Resolved by 2026-07-05 unblock

| Question | Decision | Where decided |
|---|---|---|
| Which dashboard pages? | `/`, `/played`, `/news-monitor` | spec 001 (refinement) |
| Which news sources for the monitor? | Steam (default); RSS / patch-note future extensions | spec 001 (unblock) + spec 004 of `gaming-news` |
| Delivery channel for news items | Out of dashboard scope; existing `cron_daily_news.py` (Telegram) + `weekly_digest.py` continue to own it | spec 001 (unblock) |
| Producer location | `~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py` (thin adapter on top of existing skill) | spec 001 (unblock) + spec 002 |
| Storage target | Vercel Blob, same store as `coms-dashboard`, auth via `GAMES_DASHBOARD_DATA_SECRET` | spec 001 (unblock) + spec 002 |
| Eligibility rule | Reuse upstream `_determine_news_eligibility`; see FR-003 mapping table in spec 002 | spec 002 |
| Eligibility thresholds | `playedRecentDays=30`, `launchWindowDays=90`; recorded in snapshot for traceability | spec 001 (refinement) |
| Manual opt-in source-of-truth | `games.yaml` `always_include_for_news` and `tracking_mode: always` (already in place) | spec 001 (unblock) |
| Drift remediation policy | Surface only, read-only | spec 001 (refinement) |
| Should resolved/shelved/replay games appear on `/played`? | Yes — every played game appears with a verdict | spec 001 (refinement) |
| Should `/` include trend/count summaries or just lists? | Counts only on `/`; lists on `/played` and `/news-monitor` | spec 001 (refinement) |

## Live open questions (still need a decision)

1. **Auth provider for the dashboard shell.** Authentik/OIDC is the leading candidate based on `coms-dashboard`, but final pick belongs to spec `003-…` (not yet drafted).
2. **Cron schedule for the producer.** Default proposed: 06:00 UTC daily, no-agent watchdog, silent on `skipped_unchanged` / `disabled_missing_secret`. Confirm cadence.
3. **Vercel Blob store config.** Confirm whether the existing `coms-dashboard` Blob token covers `games-dashboard/*` paths, or whether a separate `BLOB_READ_WRITE_TOKEN` is required.
4. **`GAMES_DASHBOARD_DATA_SECRET` provisioning.** The producer is gated on this existing. Confirm it has been provisioned in the producer's runtime environment.