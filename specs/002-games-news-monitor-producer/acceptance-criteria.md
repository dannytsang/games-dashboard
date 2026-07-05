# Acceptance Criteria: Games Dashboard News Monitor Producer

## Producer behaviour

- [ ] Producer script exists at `~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py` and runs without import errors.
- [ ] `python3 publish_dashboard_snapshots.py --days 30` exits 0 and emits two safe sync results (one per snapshot) to stdout.
- [ ] `played/latest.json` validates against `PlayedGamesSnapshot` from `specs/001-games-dashboard/data-contracts.md`.
- [ ] `news-monitor/latest.json` validates against `NewsMonitorSnapshot` from `specs/001-games-dashboard/data-contracts.md`.
- [ ] Each row's `id` follows the `source:slug` rule; no raw Steam AppID appears anywhere.
- [ ] Each row's `eligibility.verdict` matches the FR-003 mapping table for every test fixture category (`score`, `forced-include`, `always-track`, `forced-exclude`, `tracking-paused`, `tracking-archived`, `missing-app-id`, `below-threshold`, `stale_snapshot`).
- [ ] `news-monitor` rows whose matching `played` row is no longer eligible carry an `eligibilityDrift` block; otherwise they do not.
- [ ] A failure in the `played` snapshot does NOT prevent the `news-monitor` snapshot from being attempted (and vice versa).
- [ ] When the generated content hash matches the previously published hash, the producer reports `skipped_unchanged` and does NOT call `put()`.
- [ ] When `GAMES_DASHBOARD_DATA_SECRET` or `BLOB_READ_WRITE_TOKEN` is missing, the producer reports `disabled_missing_secret` and exits 0.
- [ ] When the secret is invalid, the producer reports `rejected_unauthorised` and does NOT call `put()`.
- [ ] Repeated runs with no upstream change produce identical snapshots and skip both writes.

## Privacy and security

- [ ] `GAMES_DASHBOARD_DATA_SECRET` is never logged, never written to a payload, never sent to Telegram, never committed to any repo.
- [ ] No raw Steam AppID appears in any emitted JSON.
- [ ] No InfluxDB host, token, or measurement name appears in any payload or log.
- [ ] No full news item body, HTML, or RSS payload appears in any emitted JSON.
- [ ] The producer NEVER mutates `games.yaml`, `news_cache.json`, or any other upstream skill file.
- [ ] `state/last_published.json` and `state/last_monitor_set.json` contain dashboard metadata only — no private game data, no tokens, no raw identifiers.

## Engineering

- [ ] Producer script has unit tests for the FR-003 eligibility mapping table.
- [ ] Producer script has unit tests for ID derivation (`source:slug`).
- [ ] Producer script has unit tests for skip-unchanged behaviour (same input → skipped_unchanged).
- [ ] Producer script has unit tests for `disabled_missing_secret` and `rejected_unauthorised` paths (use mocks; do NOT exercise real Blob in unit tests).
- [ ] End-to-end smoke test runs against the real Vercel Blob store once with a fictional fixture library and verifies both snapshots appear.
- [ ] `python3 publish_dashboard_snapshots.py --help` exits 0 and shows usage.

## Cron integration

- [ ] A scheduled job runs the producer daily (recommended: 06:00 UTC, alongside `chess.com`).
- [ ] The job runs as a no-agent watchdog OR an LLM-driven job that posts a concise summary to Telegram only on `written` / `validation_failed` / `write_failed` (silent on `skipped_unchanged` and `disabled_missing_secret`).
- [ ] The job's stdout never contains secret values, raw identifiers, or full payloads.