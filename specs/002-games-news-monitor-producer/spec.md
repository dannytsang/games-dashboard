# Spec 002: Games Dashboard News Monitor Producer

## Status

- **State:** Proposed
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification)
- **Created:** 2026-07-05
- **Last updated:** 2026-07-05

## Summary

Define how the existing `gaming-news` skill transforms its current state into two sanitised dashboard source snapshots and publishes them to the games dashboard's runtime store:

1. **`played/latest.json`** — every game Danny has actually played, with a per-row eligibility verdict for the news monitor.
2. **`news-monitor/latest.json`** — every game currently on the news monitor, with the reason(s) it was added.

This spec owns the dashboard-facing transformation only. The upstream news collection, scoring, summarisation, and daily cron behaviour are governed by the existing `gaming-news` skill (`.specify/specs/002-006`) and are not redefined here. The dashboard producer is a thin, server-side adapter on top of that skill.

## Relationship to other specs

- **Implements for the dashboard:** `specs/001-games-dashboard/` FR-007 (`/played`) and FR-008 (`/news-monitor`).
- **Reuses (does not redefine):** the `gaming-news` skill, which already owns:
  - Spec 002 — production calibration of activity scoring.
  - Spec 003 — scheduler integration (daily cron + weekly digest).
  - Spec 004 — source strategy (Steam as default; RSS / patch-note extensions).
  - Spec 005 — game news summaries (Telegram + digest formatting).
  - Spec 006 — game activity scoring (the eligibility source of truth).
- **Reuses (does not redefine):** the news eligibility logic in `gaming-news/scripts/stats.py::build_game_catalog` and `_determine_news_eligibility`.
- **Mirrors the pattern** of `coms-dashboard`'s `011-whatsapp-source-publisher` (Final).
- **Does NOT** define: the dashboard pages, the auth shell, or the dashboard's read adapters — those belong to the umbrella spec (`001`) and its child specs.

## User story

As Danny, I want every played game and every monitored game to land in the games dashboard with a per-row eligibility verdict and the reason it was added, so I can see at a glance what is on my monitor and why, without leaving the dashboard.

## Goals

1. Transform `gaming-news` skill state into a complete `played/latest.json` snapshot.
2. Transform `gaming-news` skill state into a complete `news-monitor/latest.json` snapshot.
3. Use deterministic storage paths — no Blob `list()` for normal reads/writes.
4. Reuse `gaming-news`'s existing `build_game_catalog` for eligibility and `_determine_news_eligibility` for the verdict logic. The dashboard producer MUST NOT reimplement eligibility from scratch.
5. Validate both snapshots before publishing.
6. Reject writes when authorisation is missing or invalid.
7. Report concise safe sync results suitable for cron output.
8. Skip unchanged writes where practical (use a content hash).

## Non-goals

- Replacing or refactoring the `gaming-news` skill. This spec layers on top of it.
- Re-implementing activity scoring or eligibility logic.
- Implementing dashboard pages, auth, or UI.
- Sending news items to Telegram / WhatsApp / Email. Delivery channels are out of scope for the dashboard producer; the existing `gaming-news/scripts/cron_daily_news.py` and `weekly_digest.py` continue to own delivery.
- Storing full news item bodies, raw Steam posts, or HTML payloads. The producer publishes dashboard-shaped summaries only.
- Auto-mutating `games.yaml`. The producer is read-only with respect to the upstream skill state.

## Source targets

```text
played:        games-dashboard/v1/played/latest.json
news-monitor:  games-dashboard/v1/news-monitor/latest.json
```

The producer MUST NOT accept caller-provided arbitrary paths. The two paths above are the only valid write targets.

## Sync authorisation

This producer follows the same pattern as the meals/trips/coms dashboards: a server-only secret named `GAMES_DASHBOARD_DATA_SECRET` authorises writes from the producer process to the dashboard storage.

Rules:

- The secret value MUST NEVER appear in this SDD, the public implementation repository, logs, client bundles, fixtures, or Telegram reports.
- The secret MUST be server-side only. It is NEVER `NEXT_PUBLIC_*`.
- A missing secret MUST disable sync safely (no writes, no errors to the user).
- An invalid secret MUST reject the write without revealing the expected value.

## Functional requirements

### FR-001 Deterministic source paths

The producer MUST publish to the two paths above, exactly. Any other target MUST be rejected.

### FR-002 Read upstream state

The producer MUST read upstream state from the `gaming-news` skill (not from raw Steam, InfluxDB, or HTTP APIs). Concretely, it MUST call:

- `gaming_news.scripts.stats.build_game_catalog(days=N)` for the unified played-game catalogue;
- `gaming_news.scripts.games.load_games()` for the durable tracked library;
- `gaming_news.scripts.news.load_cache()` for any per-game surface metadata required by the dashboard (e.g. most-recent-news timestamp).

Direct calls to InfluxDB, the Steam Web API, or RSS feeds from the producer are FORBIDDEN — those belong to the upstream skill.

### FR-003 Eligibility mapping (server-side)

For each game in the catalog, the producer MUST compute an `EligibilityVerdict` consistent with `specs/001-games-dashboard/data-contracts.md`:

| Upstream outcome | Dashboard verdict | `reasons[]` |
|---|---|---|
| `_determine_news_eligibility` returns `True, "forced-include"` | `eligible` | `["manual_opt_in"]` |
| `_determine_news_eligibility` returns `True, "always-track"` | `eligible` | `["manual_opt_in"]` (because `tracking_mode: always` is the user's manual policy) |
| `_determine_news_eligibility` returns `True, "score"` | `eligible` | `["recent_activity"]` |
| `_determine_news_eligibility` returns `False, "forced-exclude"` | `not_eligible` | `[]` |
| `_determine_news_eligibility` returns `False, "tracking-paused"` | `not_eligible` | `[]` |
| `_determine_news_eligibility` returns `False, "tracking-archived"` | `not_eligible` | `[]` |
| `_determine_news_eligibility` returns `False, "missing-app-id"` | `borderline` | `[]` with `unknownReason: "missing_opt_in_record"` |
| `_determine_news_eligibility` returns `False, "below-threshold"` | `not_eligible` | `[]` |
| Upstream unavailable / InfluxDB fallback active | `unknown` | `[]` with `unknownReason: "stale_snapshot"` |

The `borderline` verdict (reserved for future use) is intentionally emitted by the producer when a game would have qualified for news but lacks an `app_id` for fetching — this keeps the producer consistent with the dashboard's data contract.

### FR-004 Played snapshot shape

The producer MUST emit a `played/latest.json` payload that validates against `PlayedGamesSnapshot` from `specs/001-games-dashboard/data-contracts.md`. Required fields per row:

- `id` — opaque dashboard ID, derived deterministically from `(source, name)` so repeated runs produce the same IDs. NOT a raw Steam AppID.
- `source` — `steam` for any game with a `steam_app_id`; otherwise `manual`.
- `title` — the game name.
- `status` — mapped from the `tracking_mode` field: `activity_based` / `always` → `playing`; `paused` → `shelved`; `archived` → `completed`. (The mapping is documented here for reproducibility.)
- `lastPlayedAt` — derived from the InfluxDB-derived `days_since_played` metric (best-effort; absent if unavailable).
- `releaseDate` — `games.yaml` `release_date` if present and parseable; otherwise absent.
- `context` — a short, safe summary string built from the score breakdown (e.g. `"score 42.5 — 12.3h over 6 sessions, played 3 days ago"`).
- `eligibility` — `{ verdict, reasons, unknownReason? }` per FR-003.

The producer MUST emit `thresholds` exactly as the snapshot expects. The MVP default thresholds from the umbrella spec (`playedRecentDays=30`, `launchWindowDays=90`) are the producer's defaults; if `games.yaml` or env vars declare different values, the producer uses those and reports them in the snapshot.

### FR-005 News-monitor snapshot shape

The producer MUST emit a `news-monitor/latest.json` payload that validates against `NewsMonitorSnapshot` from `specs/001-games-dashboard/data-contracts.md`. Required fields per row:

- `id` — same opaque-id rule as FR-004.
- `source` — same mapping.
- `title` — game name.
- `reasons[]` — non-empty array. For the existing producer, the dominant reason is `recent_activity` (because eligibility comes from `_determine_news_eligibility` returning `"score"`). Games in `always_include_for_news` or with `tracking_mode: always` carry `manual_opt_in`.
- `triggers.lastPlayedAt` — best-effort ISO timestamp from InfluxDB metrics, if available.
- `triggers.releaseDate` — from `games.yaml` if present.
- `addedAt` — first time the game appeared in a `news-monitor` snapshot. The producer persists a small `state/last_monitor_set.json` mapping `id -> addedAt` and carries it across runs. On first run, `addedAt = generatedAt`.
- `playedGameId` — link to the matching `PlayedGame.id`, so the dashboard can surface drift.
- `eligibilityDrift` — set ONLY when the matching `played` row's verdict is no longer `eligible`. The producer MUST compute drift on every run and emit it on the news-monitor row.

### FR-006 Source isolation

A failure in the `played` snapshot MUST NOT block or corrupt the `news-monitor` snapshot, and vice versa. The two snapshots are written independently. If one fails, the other is still attempted.

### FR-007 Validation before publish

Both snapshots MUST be validated against their TypeScript / JSON schema from `specs/001-games-dashboard/data-contracts.md` before each write. If validation fails, no write occurs and the failure is reported.

### FR-008 Skip-unchanged

When the new snapshot's content hash matches the previously published snapshot (per `state/last_published.json`), the producer SHOULD skip the `put()` call and report `skipped_unchanged`. The dashboard read path uses deterministic paths, so skipping does not affect freshness — the existing object remains authoritative.

### FR-009 Safe sync result

Sync results MUST include only:

- source key (`played` / `news-monitor`);
- item count;
- generated timestamp;
- deterministic target path;
- write status (`written` / `skipped_unchanged` / `disabled_missing_secret` / `rejected_unauthorised` / `validation_failed` / `write_failed`);
- safe warning class (no secrets, no private values).

### FR-010 Idempotent / cron-safe

The producer MUST be safe to run repeatedly. No state outside `state/last_published.json` and `state/last_monitor_set.json` may be mutated. Repeated runs with no upstream change MUST produce identical snapshots and skip writes.

## Non-functional requirements

- Producer runs as a Python script (`scripts/publish_dashboard_snapshots.py`) callable from cron or the `sdd-profile-delivery-team` `coder` profile.
- Default invocation: `python3 ~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py --days 30`.
- The script MUST exit non-zero on any unrecoverable error.
- Output to stdout MUST be the safe sync result for each snapshot; secrets and private data MUST go to stderr only when necessary and never as a default path.

## Acceptance criteria

See `acceptance-criteria.md`.

## Data contracts

See `data-contracts.md` (this spec's view of the dashboard-facing payload; the canonical types remain in `001-games-dashboard/data-contracts.md`).

## Plan

See `plan.md`.

## Tasks

See `tasks.md`.

## References

See `references.md`.