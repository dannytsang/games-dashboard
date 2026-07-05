# Implementation Plan: Games Dashboard MVP

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and the private SDD; `coder` implements in this repo; `tester` independently verifies against this spec and any referenced child specs.

**Goal:** Implement the Games Dashboard umbrella MVP as a private, read-only Next.js dashboard with three top-level surfaces — `/` Summary, `/played`, `/news-monitor`. Eligibility verdicts on `/played` and membership on `/news-monitor` are computed server-side and surfaced read-only.

**Architecture:** Use Next.js with server-side data loading, server-side source readers, deterministic runtime snapshots, and sanitised producers. Mirror the coms-dashboard pattern: server-side adapter boundary, source-separated `latest.json` objects in the chosen store, fictional fixtures only in the public repo.

**Tech Stack:** Next.js 14 App Router (already scaffolded), TypeScript, React, server-side data loading, Vercel Blob (proposed), auth-gated production deployment.

---

## Implementation scope for the next batch

This umbrella MVP + the following likely non-final Proposed child specs:

1. `001-games-dashboard` — umbrella MVP with three top-level pages, eligibility computation, and news-monitor consumer behaviour.
2. (Future) source-separated runtime storage spec.
3. (Future) common sync boundary spec (deterministic paths, secret auth, validation, freshness).
4. (Future) source-specific producer specs (one per chosen source).

## Phase 1: Reconcile current implementation to the spec

1. Inspect the current public app (commit `262bdf2` or later) against the refined spec.
2. Identify gaps between existing code and the refined contracts:
   - Need for `/played` page and `PlayedGame` adapter;
   - need for `/news-monitor` page and `NewsMonitorEntry` adapter;
   - need for server-side eligibility computation;
   - need for drift detection between the two snapshots;
   - need for `/` Summary updates (counts + quick links).
3. Protect any existing uncommitted user work before implementation.

## Phase 2: Source contracts and server-side computation

1. Define a server-side `PlayedGamesReader` that:
   - reads `games-dashboard/v1/played/latest.json` (or fixture fallback);
   - validates the snapshot against `PlayedGamesSnapshot` contract;
   - exposes typed `PlayedGame[]` to the route handlers.
2. Define a server-side `NewsMonitorReader` that:
   - reads `games-dashboard/v1/news-monitor/latest.json` (or fixture fallback);
   - validates the snapshot against `NewsMonitorSnapshot` contract;
   - flags `eligibilityDrift` against the `played` snapshot by `playedGameId` (or by title+source when no link is present).
3. Eligibility computation is the producer's responsibility — the dashboard does NOT recompute. The dashboard consumes the producer's `verdict` + `reasons` field as already-computed state.
4. Source failures must be isolated: one missing/malformed/unavailable source must not block the others.

## Phase 3: Product pages

### `/` Summary (FR-009)

1. Render counts: total played, total monitored, eligible not yet monitored (when both snapshots are present).
2. Render quick-link tiles for `/played` and `/news-monitor`.
3. Render a small "recently played" + "recently added to monitor" block when data permits.
4. Show a clearly labelled "placeholder / fictional data" banner when fixtures are in use.

### `/played` (FR-007)

1. Render a list of `PlayedGame` rows.
2. Each row: title, source/platform label, last-played, context, verdict label, reasons chips (or `unknownReason` when applicable).
3. Provide a per-row visual cue distinguishing `Eligible` from `Not eligible` and `Unknown`.
4. The page is read-only — no add/remove/edit controls.

### `/news-monitor` (FR-008)

1. Render a list of `NewsMonitorEntry` rows.
2. Each row: title, source, reasons chips, trigger metrics (where known), `addedAt`.
3. Rows with `eligibilityDrift` are surfaced with a visible drift warning.
4. The page is read-only — no add/remove/edit controls.

## Phase 4: Authentication, privacy, and deployment

1. Preserve protected dashboard shell (Authentik/OIDC or equivalent — see open questions).
2. Ensure production dashboard routes are not publicly readable.
3. Keep store and sync credentials server-side only; no `NEXT_PUBLIC_*` secrets.
4. Keep eligibility thresholds server-side only; no `NEXT_PUBLIC_*` thresholds.
5. Eligibility computation happens server-side; the client only receives the precomputed verdict + reasons.
6. Ensure the public repo contains no real account identifiers, real exports, raw snapshots, private SDD content, or personal media.
7. Use fictional fixtures only where fallback / demo data is required.

## Branch and deployment policy

- Default implementation target is `main`; pushes to `main` are expected to deploy to Production.
- A long-lived `preview` branch exists for higher-risk workstreams that warrant a Vercel Preview deployment before production.
- Do not default routine work to `preview`. Ask Danny before using `preview`, unless he has explicitly requested a preview branch / deployment for the current workstream.
- Preview deployments must still satisfy the same no-secrets / no-real-data-in-GitHub rule.

## Phase 5: Verification

1. Run lint / build / tests that exist; add a minimal test harness if missing and practical.
2. Add tests covering:
   - `/played` rendering with each verdict value;
   - `/played` reasons surfacing;
   - `/news-monitor` rendering with reasons and triggers;
   - `/news-monitor` drift warning surfacing;
   - `/` Summary counts.
3. Run staged privacy/secret scans before committing public code.
4. Hand implementation to `tester` for independent acceptance-criteria mapping.
5. Fix tester failures before reporting complete.
6. After push, verify deployment record for the pushed SHA and production auth / API behaviour as appropriate.