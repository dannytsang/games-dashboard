# Tasks: Games Dashboard MVP

## Ready-now preparation tasks

- [x] Create public implementation repository on GitHub. _(commits 9239419, 73580cd5, ed8b1d1, 262bdf2)_
- [x] Link repository to Vercel (Danny to confirm Vercel project ID).
- [x] Add SDD scaffolding (`specs/_template-*.md`, `decisions/`, `evidence/`, `sanitized-examples/`) to this repo.
- [x] Draft initial umbrella MVP spec (`specs/001-games-dashboard/`).
- [x] Record public-code / private-SDD boundary in repo README.
- [x] Replace placeholder with skeleton Next.js app + fictional data only. _Done: commit 73580cd5 + fix 8d1d1 → ed8b1d1; placeholder renders at / with no real data; fresh clone installs/builds/lints/type-checks clean._
- [ ] Create long-lived `preview` branch for Vercel Preview deployments.
- [ ] Create private SDD workspace at `~/.hermes/workspace/games-dashboard-sdd`. _(deferred — currently using public-repo `specs/` for SDD until product content firms up)_
- [x] Confirm storage target = Vercel Blob, mirroring `coms-dashboard`.
- [ ] Provision `GAMES_DASHBOARD_DATA_SECRET` in producer's runtime environment. _Producer is gated on this; without it, every run returns `disabled_missing_secret`._
- [ ] Confirm Vercel Blob token covers `games-dashboard/*` paths (or provision a separate token).
- [ ] Decide auth provider for the dashboard shell (proposed: Authentik/OIDC). _Deferred to child spec 003._

## Spec refinement batch tasks (2026-07-05)

- [x] Add FR-007 Played games view to spec.
- [x] Add FR-008 News monitor view to spec.
- [x] Add FR-009 Summary updates (counts, links, banner).
- [x] Add `PlayedGame`, `NewsMonitorEntry`, eligibility / reason / unknown-reason types to data contracts.
- [x] Add acceptance criteria for FR-007, FR-008, FR-009.
- [x] Add drift-surfacing behaviour to FR-008 (read-only, no auto-remediation).
- [x] Resolve four previously-open questions in `open-questions.md`.

## Spec unblock batch tasks (2026-07-05)

- [x] Audit existing `gaming-news` skill — found producer + cron + scoring already in place.
- [x] Draft `specs/002-games-news-monitor-producer/` full spec set (spec, data-contracts, acceptance, plan, tasks, references, changelog).
- [x] Resolve remaining open questions: news sources, delivery channel, producer location, storage target, eligibility rule, opt-in source-of-truth.
- [x] Wire spec 001 to spec 002 (umbrella refers to producer spec).

## Implementation batch tasks (next coder cycles)

### Producer side — `002-games-news-monitor-producer`

- [ ] Implement `publish_dashboard_snapshots.py` in `~/.hermes/profiles/home/skills/gaming-news/scripts/`.
- [ ] Implement catalog → `played/latest.json` translation per FR-004.
- [ ] Implement `played` → `news-monitor/latest.json` translation per FR-005 with drift detection.
- [ ] Implement eligibility mapping per FR-003 (table-driven for testability).
- [ ] Implement deterministic ID derivation `source:slug`.
- [ ] Implement content-hash skip-unchanged + `state/last_published.json`.
- [ ] Implement `state/last_monitor_set.json` for `addedAt` carry-over.
- [ ] Implement JSON-schema validation before publish.
- [ ] Implement safe sync result envelope to stdout.
- [ ] Schedule daily no-agent watchdog cron at 06:00 UTC.
- [ ] Verify cron registration via `cronjob list`.
- [ ] Unit tests for FR-003 mapping table (one per row).
- [ ] Unit tests for ID derivation, skip-unchanged, missing-secret, invalid-secret.
- [ ] End-to-end smoke test with fictional fixtures against a real Vercel Blob store.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.

### Dashboard side — `001-games-dashboard` Phase 2/3

- [ ] Implement server-side `PlayedGamesReader` consuming `games-dashboard/v1/played/latest.json`.
- [ ] Implement server-side `NewsMonitorReader` consuming `games-dashboard/v1/news-monitor/latest.json`.
- [ ] Implement `/played` page rendering `PlayedGame` rows with verdict label + reasons.
- [ ] Implement `/news-monitor` page rendering `NewsMonitorEntry` rows with reasons + drift warnings.
- [ ] Update `/` Summary to show counts and quick links to `/played` and `/news-monitor`.
- [ ] Add fictional fixtures for `played/latest.json` and `news-monitor/latest.json` covering all four verdict values and at least one drift case.
- [ ] Add unit/component tests for eligibility rendering, reasons surfacing, and drift warnings.

### Privacy and ops

- [ ] Confirm no `NEXT_PUBLIC_*` env values for thresholds, secrets, or store IDs.
- [ ] Run staged privacy/secret scan before committing public code.

## Verification tasks

- [ ] Add or update automated tests for source readers and adapters.
- [ ] Add or update validation/privacy tests for source contracts where practical.
- [ ] Run lint / build / tests.
- [ ] Run staged privacy/secret scan before committing public code.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.
- [ ] Verify deployment record and protected production behaviour after push.