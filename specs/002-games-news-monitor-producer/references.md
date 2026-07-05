# References: Games Dashboard News Monitor Producer

## Related public-repo specs

- `specs/001-games-dashboard/` — umbrella MVP; defines the canonical `PlayedGame`, `NewsMonitorEntry`, `PlayedGamesSnapshot`, `NewsMonitorSnapshot` types consumed by this producer.
- `specs/001-games-dashboard/plan.md` Phase 2 — server-side readers in the dashboard that consume this producer's snapshots.

## Related private specs (in `~/.hermes/profiles/home/skills/gaming-news/.specify/`)

- `002-production-calibration/` — activity-scoring calibration rules.
- `003-scheduler-integration/` — scheduler wiring; the daily cron pattern this spec adopts.
- `004-source-strategy/` — Steam as default; RSS / patch-note extensions.
- `005-game-news-summary/` — Telegram + weekly digest formatting (downstream of this producer, not part of it).
- `006-game-activity/` — activity scoring and `_determine_news_eligibility`. **This is the source of truth for the dashboard's eligibility verdicts; the producer does not re-implement it.**

## Related public-repo skill

- `~/.hermes/workspace/Hermes-Skills/coms-dashboard-sdd/specs/011-whatsapp-source-publisher/` — Final analogue for what this spec produces. The producer mirrors its structure, sanitisation rules, and sync result envelope shape.

## Producer input entrypoints

- `gaming-news/scripts/stats.py::build_game_catalog(days=N)` — unified played-game catalogue.
- `gaming-news/scripts/stats.py::_determine_news_eligibility(record, policy)` — eligibility decision per game.
- `gaming-news/scripts/games.py::load_games()` — durable tracked library.
- `gaming-news/scripts/games.py::sync_auto(days=N, dry_run=False)` — not used directly; producer reads the post-sync library.

## Cron and skill patterns

- `~/.hermes/profiles/home/skills/chess-com-analysis/` — chess.com daily cron pattern (06:00 UTC, no-agent watchdog). This producer follows the same cron shape.

## Secret handling

- `GAMES_DASHBOARD_DATA_SECRET` is server-side only.
- Record only the variable name, never the value.
- Treat it as never-`NEXT_PUBLIC_*`.

## Likely private implementation areas

- `~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py` — the producer.
- `~/.hermes/profiles/home/skills/gaming-news/state/last_published.json` — content-hash cache.
- `~/.hermes/profiles/home/skills/gaming-news/state/last_monitor_set.json` — `addedAt` carry-over.
- A new cron job entry on the `home` profile.