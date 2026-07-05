# Implementation Plan: Games Dashboard News Monitor Producer

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation; `coder` implements in `~/.hermes/profiles/home/skills/gaming-news/`; `tester` independently verifies against this spec and `001-games-dashboard`.

**Goal:** Add a server-side adapter that reads the existing `gaming-news` skill state and publishes two sanitised, dashboard-shaped snapshots to the chosen runtime store, on a deterministic daily cadence.

**Architecture:** Layered on top of the existing `gaming-news` skill. No re-implementation of eligibility logic. The producer is a thin Python script that:

1. Calls `build_game_catalog(days=30)` to get the unified played-game catalogue.
2. Calls `load_games()` for the durable tracked library.
3. Translates each catalog entry to `PlayedGame` and `NewsMonitorEntry` shapes per `specs/002/data-contracts.md`.
4. Validates both snapshots against the canonical JSON schemas.
5. Publishes each snapshot to its deterministic path with `GAMES_DASHBOARD_DATA_SECRET` authorisation.
6. Skips writes when content is unchanged.

**Tech Stack:** Python 3.11 (matches existing skill), Vercel Blob via existing `coms-dashboard`-pattern helper (or direct `@vercel/blob` if already in the skill's deps — confirm in Phase 1). Cron via existing scheduler mechanism (likely `scheduler-control` per `gaming-news/.specify/specs/003`).

---

## Phase 1: Reconcile

1. Confirm the existing `gaming-news` skill's Python environment has `requests`, `pyyaml`, and either `@vercel/blob` Python client or a working HTTP path. If `@vercel/blob` is missing, prefer reusing the `coms-dashboard` publish helper if it can be imported cleanly; otherwise implement a minimal `Blob.put(path, body, token)` HTTP call (PUT to Vercel Blob REST endpoint).
2. Confirm `build_game_catalog(days=N)` is the right entrypoint. The current signature is `(days=30, client=None)`. The producer does NOT need to pass `client` — default behaviour is fine.
3. Confirm Vercel Blob has a `games-dashboard` store configured (or, mirroring `coms-dashboard`, expect the same `BLOB_READ_WRITE_TOKEN` to cover both stores).
4. Confirm a `GAMES_DASHBOARD_DATA_SECRET` value exists in the producer's environment. If not, document as "to be provisioned" and have the producer report `disabled_missing_secret` cleanly.

## Phase 2: Producer script

1. Add `scripts/publish_dashboard_snapshots.py` to `~/.hermes/profiles/home/skills/gaming-news/`.
2. Implement the catalog → dashboard translation per `data-contracts.md`.
3. Implement deterministic ID derivation (`source:slug`).
4. Implement skip-unchanged via content hash + `state/last_published.json`.
5. Implement `state/last_monitor_set.json` persistence for `addedAt`.
6. Implement eligibility mapping per FR-003 (unit-tested).
7. Implement safe sync result output to stdout.
8. Implement error handling that always emits a sync result envelope, never a raw traceback with secrets.

## Phase 3: Validation

1. Add a tiny JSON-schema validator using `jsonschema` if available, else a hand-rolled minimum validator covering the required fields per FR-004 / FR-005.
2. Validate both snapshots before any `put()`.
3. On validation failure, report `validation_failed` and exit non-zero.

## Phase 4: Cron wiring

1. Schedule the producer as a daily cron (recommended: 06:00 UTC, alongside `chess.com`).
2. Use a no-agent watchdog job (`no_agent=True`) with `script=publish_dashboard_snapshots.py`. Stdout is delivered verbatim.
3. Filter the script to emit nothing on `skipped_unchanged` / `disabled_missing_secret` and a one-liner on every other status.

## Phase 5: Verification

1. Run unit tests for FR-003 mapping table (one test per row).
2. Run unit tests for ID derivation, skip-unchanged, missing-secret, invalid-secret.
3. Run end-to-end smoke test against a real (or staging) Vercel Blob store with fictional fixtures only.
4. Verify in the dashboard repo (`specs/001-games-dashboard/plan.md` Phase 3) that the read paths pick up the new snapshots.
5. Hand implementation to `tester` for independent acceptance-criteria mapping.

## Branch and deployment policy

- This spec touches the **private** `gaming-news` skill under `~/.hermes/profiles/home/`, not the public `games-dashboard` repo.
- Changes to `gaming-news/scripts/` are made on the local working copy. The skill is not git-tracked here (verified: no `.git` in `~/.hermes/profiles/home/skills/gaming-news/`).
- Cron registration goes through the home profile's `cronjob` tool.
- The `games-dashboard` public repo (Next.js) is updated in a separate batch by the umbrella spec's coder cycle — it does NOT contain this producer script.