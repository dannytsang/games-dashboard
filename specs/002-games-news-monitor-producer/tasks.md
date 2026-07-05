# Tasks: Games Dashboard News Monitor Producer

## Ready-now preparation tasks

- [x] Audit existing `gaming-news` skill to confirm producer inputs (catalog + games.yaml + news cache). _Done 2026-07-05._
- [x] Confirm `build_game_catalog(days=N)` and `_determine_news_eligibility` cover the dashboard's eligibility mapping.
- [x] Confirm daily cron pattern (06:00 UTC, no-agent watchdog) follows `chess.com` precedent.
- [ ] Provision `GAMES_DASHBOARD_DATA_SECRET` in producer's runtime environment.
- [ ] Confirm Vercel Blob store config covers `games-dashboard/*` paths.

## Implementation batch tasks

### Phase 1 — Reconcile

- [ ] Verify `gaming-news` Python env has all required deps (yaml, requests, jsonschema or equivalent).
- [ ] Verify `build_game_catalog(days=N)` produces the expected catalog shape with current `games.yaml`.

### Phase 2 — Producer script

- [ ] Implement `scripts/publish_dashboard_snapshots.py` in `~/.hermes/profiles/home/skills/gaming-news/`.
- [ ] Implement `played` snapshot generation per FR-004.
- [ ] Implement `news-monitor` snapshot generation per FR-005 with drift detection.
- [ ] Implement eligibility mapping per FR-003 (table-driven for testability).
- [ ] Implement deterministic ID derivation `source:slug`.
- [ ] Implement content-hash skip-unchanged + `state/last_published.json`.
- [ ] Implement `state/last_monitor_set.json` for `addedAt` carry-over.
- [ ] Implement safe sync result envelope to stdout.

### Phase 3 — Validation

- [ ] Add JSON-schema validator (or minimal hand-rolled validator) covering required fields.
- [ ] Validate both snapshots before any `put()`.
- [ ] On validation failure: report `validation_failed`, exit non-zero, do NOT write.

### Phase 4 — Cron wiring

- [ ] Schedule daily no-agent watchdog cron at 06:00 UTC.
- [ ] Verify cron registration via `cronjob list`.

### Phase 5 — Verification

- [ ] Unit tests for FR-003 mapping (one test per row of the table).
- [ ] Unit tests for ID derivation.
- [ ] Unit tests for skip-unchanged.
- [ ] Unit tests for `disabled_missing_secret` (mocked).
- [ ] Unit tests for `rejected_unauthorised` (mocked).
- [ ] End-to-end smoke test with fictional fixtures against a real Vercel Blob store.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.
- [ ] Verify dashboard repo's read paths pick up the new snapshots once published.

## Verification tasks

- [ ] Privacy scan on the producer script — confirm no secret values, no raw identifiers, no full news payloads.
- [ ] Confirm producer is idempotent (repeated runs with no upstream change produce identical snapshots and skip writes).
- [ ] Confirm source isolation (one snapshot failing does NOT block the other).
- [ ] Confirm cron output is silent on `skipped_unchanged` and `disabled_missing_secret`.