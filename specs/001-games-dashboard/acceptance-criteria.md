# Acceptance Criteria: Games Dashboard MVP

## Product behaviour

### General

- [ ] Any placeholder or fixture fallback is clearly fictional and contains no private data.
- [ ] Top-level navigation links to `/`, `/played`, and `/news-monitor`, with active state visible on each.
- [ ] MVP is read-only: no UI path mutates external accounts, sends messages, modifies libraries, or changes news-monitor membership.
- [ ] Runtime dashboard data is read from the chosen server-side store, not from JSON committed to GitHub.
- [ ] Source-separated runtime reads degrade gracefully: one missing/malformed/unavailable source must not block the others.

### FR-007 — `/played`

- [ ] `/played` renders one row per `PlayedGame` from `games-dashboard/v1/played/latest.json`.
- [ ] Each row shows: title, source/platform label, last-played timestamp (when known), concise context (when available), and an eligibility verdict label.
- [ ] The eligibility verdict label is one of `Eligible`, `Borderline`, `Not eligible`, `Unknown`, and is **produced server-side by spec 002** (not recomputed in the browser).
- [ ] When the verdict is `Eligible`, the row shows the matching reason(s) from `{recent_activity, recent_launch, manual_opt_in}`.
- [ ] When the verdict is `Unknown`, the row shows the `unknownReason` value (e.g. `missing_last_played`).
- [ ] Default thresholds (`playedRecentDays=30`, `launchWindowDays=90`) are honoured when the snapshot does not override them; snapshot-declared thresholds take precedence.
- [ ] A game with no matching reason still appears on `/played` with verdict `Not eligible` and an empty `reasons` array.
- [ ] Eligibility reasons are surfaced to the user, not hidden — Danny must be able to tell at a glance *why* a game qualifies.
- [ ] When `played/latest.json` is missing or malformed, `/played` shows a per-source warning and a clearly labelled "no data" state — never a blank page or a thrown error.

### FR-008 — `/news-monitor`

- [ ] `/news-monitor` renders one row per `NewsMonitorEntry` from `games-dashboard/v1/news-monitor/latest.json`.
- [ ] Each row shows: title, source/platform label, the reason(s) the entry was added, the trigger metric that caused inclusion (where known), and the `addedAt` timestamp.
- [ ] The dashboard surfaces an `eligibilityDrift` warning row when a `news-monitor` entry's verdict in the matching `played` row is no longer `eligible`.
- [ ] The dashboard does NOT auto-add, auto-remove, or auto-remediate any entry. Drift is surfaced read-only.
- [ ] An entry whose reasons are an empty array is rendered with a visible "no reason recorded" label (data hygiene signal, not an error).
- [ ] When `news-monitor/latest.json` is missing or malformed, `/news-monitor` shows a per-source warning and a clearly labelled "no data" state — never a blank page.

### FR-009 — `/` Summary

- [ ] Summary exposes counts: total played, total monitored, eligible not yet monitored (when computable from the two snapshots).
- [ ] Summary links to `/played` and `/news-monitor`.
- [ ] When fixtures are in use, a clearly labelled "placeholder / fictional data" banner is visible.

## Privacy and security

- [ ] No raw OAuth tokens, API keys, refresh tokens, client secrets, account IDs, raw exports, or private SDD files are committed to the public repo.
- [ ] Client bundle receives only sanitised dashboard data — never raw `lastPlayedAt` from the producer side that hasn't been normalised.
- [ ] No raw Steam AppID, PSN title ID, Nintendo title ID, Xbox title ID, Epic catalog ID, or any other raw external ID appears in any committed file or in the rendered HTML.
- [ ] Any fixture committed to the public repo uses fictional data only.
- [ ] Production deployment is not publicly readable without authentication/protection.
- [ ] Server-side env vars are used for secrets; no secret is exposed via `NEXT_PUBLIC_*`.
- [ ] Storage store ID / key / token values are never committed and never exposed in the client bundle.
- [ ] Eligibility thresholds are NOT `NEXT_PUBLIC_*`; they are server-side env vars.
- [ ] Eligibility computation happens server-side; the client only receives the precomputed verdict + reasons array.

## Engineering

- [ ] Next.js app builds successfully.
- [ ] Relevant unit/component tests pass.
- [ ] Data adapter boundary exists so the UI is not coupled directly to Hermes-local file paths.
- [ ] Adapter/publisher contracts are covered by tests using fictional fixtures only — including FR-007 eligibility computation and FR-008 drift detection.
- [ ] Date/time formatting is deterministic across SSR and client hydration.
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.