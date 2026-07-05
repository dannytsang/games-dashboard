# Tasks: Games Dashboard MVP

## Ready-now preparation tasks

- [x] Create public implementation repository on GitHub. _(commits 9239419, 73580cd5, ed8b1d1, 262bdf2)_
- [x] Link repository to Vercel (Danny to confirm Vercel project ID).
- [x] Add SDD scaffolding (`specs/_template-*.md`, `decisions/`, `evidence/`, `sanitized-examples/`) to this repo.
- [x] Draft initial umbrella MVP spec (`specs/001-games-dashboard/`).
- [x] Record public-code / private-SDD boundary in repo README.
- [x] Replace placeholder with skeleton Next.js app + fictional data only. _Done: commit 73580cd5 + fix 8d1d1 → ed8b1d1; placeholder renders at / with no real data; fresh clone installs/builds/lints/type-checks clean._
- [ ] Create long-lived `preview` branch for Vercel Preview deployments.
- [ ] Create private SDD workspace at `~/.hermes/workspace/games-dashboard-sdd`.
- [ ] Decide data sources in scope (Steam, PSN, Switch, …) — see `open-questions.md` Q1.
- [ ] Decide storage target (Vercel Blob or alternative) — see `open-questions.md` Q4.
- [ ] Decide auth provider for production — see `open-questions.md` Q8.
- [ ] Decide news source mix for the monitor feed — see `open-questions.md` Q1.
- [ ] Decide producer location — see `open-questions.md` Q3.
- [ ] Decide delivery channel for news items — see `open-questions.md` Q2.
- [ ] Confirm eligibility defaults (`PLAYED_RECENT_DAYS=30`, `LAUNCH_WINDOW_DAYS=90`) or override — see `open-questions.md` Q5.
- [ ] Confirm combined eligibility rule (any of three) or override — see `open-questions.md` Q6.
- [ ] Move umbrella spec into the private SDD workspace once it has real product content.

## Spec refinement batch tasks (this refinement — 2026-07-05)

- [x] Add FR-007 Played games view to spec.
- [x] Add FR-008 News monitor view to spec.
- [x] Add FR-009 Summary updates (counts, links, banner).
- [x] Add `PlayedGame`, `NewsMonitorEntry`, eligibility / reason / unknown-reason types to data contracts.
- [x] Add acceptance criteria for FR-007, FR-008, FR-009.
- [x] Add drift-surfacing behaviour to FR-008 (read-only, no auto-remediation).
- [x] Resolve four previously-open questions in `open-questions.md`.

## Implementation batch tasks (next coder cycle)

### Server-side reads

- [ ] Implement `PlayedGamesReader` (server-only) that reads `played/latest.json` and validates against `PlayedGamesSnapshot` contract.
- [ ] Implement `NewsMonitorReader` (server-only) that reads `news-monitor/latest.json` and validates against `NewsMonitorSnapshot` contract.
- [ ] Add drift detection that flags `news-monitor` entries whose linked `played` row is no longer eligible.

### Pages

- [ ] Implement `/played` page rendering `PlayedGame` rows with verdict label + reasons.
- [ ] Implement `/news-monitor` page rendering `NewsMonitorEntry` rows with reasons + drift warnings.
- [ ] Update `/` Summary to show counts and quick links to `/played` and `/news-monitor`.

### Fixtures and tests

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