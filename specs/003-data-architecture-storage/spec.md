# Spec 003: Data Architecture & Storage

> **Status note:** Draft created 2026-07-05 alongside specs 004 (OIDC), 005
> (Logged User & Menu), and 006 (Light/Dark Theme). This is the data-plane
> contract for the games dashboard — where state lives, how it is addressed,
> how it is sanitised, and how it is wired to the producer.
>
> **State:** Draft (no implementation yet).
> **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
> **Created:** 2026-07-05.
> **Last updated:** 2026-07-05.

## Summary

Define the runtime storage layer for the games dashboard. The dashboard
reads precomputed snapshots from a private object store and never mutates
external systems. This spec records the storage target, the canonical path
conventions, the versioning model, the sanitisation rules, the env-var
registry, and the secrets lifecycle that both producer (spec 002) and
consumer (specs 004–006) depend on.

This is the umbrella data-plane contract. The producer is owned by spec
002. The dashboard readers are owned by spec 001 FR-004 / FR-007 / FR-008.
The auth layer (spec 004) gates dashboard access to the storage layer;
this spec records the storage contract regardless of who reads or writes.

## Status

- **State:** Draft.
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification).
- **Created:** 2026-07-05.
- **Last updated:** 2026-07-05.

## Goals

1. Pick a single, durable runtime storage target for dashboard snapshots.
2. Define a stable, versioned path convention that survives producer rename and dashboard refactor.
3. Document the env-var registry: which secrets the producer needs, which secrets the dashboard needs, and which secrets are forbidden.
4. Specify sanitisation rules so private data cannot reach the client bundle.
5. Define retention and rotation policies that match operational reality.
6. Provide a single, citable source of truth for `skill-map.yaml` and the operator reference.

## Non-goals

- No new storage target evaluation. The chosen target is recorded under "Resolved decisions".
- No real-time streaming, push, or pub/sub from the dashboard.
- No mutation of the store from the dashboard.
- No raw external-ID exposure. The contract is the sanitised envelope.
- No provider-specific SDK in the dashboard bundle (kept server-side).

## Relationship to other specs

- This spec is the umbrella data-plane contract.
- **Depends on:** none (can be implemented first).
- **Required by:** spec 001 (dashboard), spec 002 (producer), spec 004 (auth gate), spec 005 (user menu reads session claims), spec 006 (theme tokens).
- **Cited by:** `skill-map.yaml` `producer.env_vars` and `dashboard.env_vars`.

## Users

- **Danny:** primary consumer (reads via the dashboard).
- **JARVIS/Hermes profiles (home):** producer (writes sanitised snapshots).
- **Vercel platform:** hosts the dashboard that reads the snapshots.
- **Operator (Danny):** provisions and rotates secrets.

## Functional requirements

### FR-001 Storage target: Vercel Blob

The runtime storage target is **Vercel Blob**. Rationale: matches the
existing `coms-dashboard` and `meals-dashboard` pattern, supports public-read
URLs for server-side fetch (no client-side token exposure), and integrates
with the Vercel deployment model already used by the dashboard.

### FR-002 Path convention

Dashboard snapshots live under a single namespace with a strict version
segment so consumers can pin to a schema generation.

```text
games-dashboard/v1/played/latest.json
games-dashboard/v1/news-monitor/latest.json
games-dashboard/v1/{source}/latest.json      # optional per-source inputs
games-dashboard/v1/_meta/manifest.json       # optional producer-side manifest (see FR-008)
```

Rules:

- **`v1`** is the schema generation. Bumping to `v2` requires a new spec.
- **`latest.json`** is the canonical "current" object per leaf. Producers MUST atomically replace it.
- **`{source}`** is one of `steam`, `psn`, `switch`, `xbox`, `epic`, `backloggd`, `manual`. Producer inputs only — never served directly to the dashboard.
- **`_meta/`** holds producer-side artefacts and is NOT served to the dashboard.

### FR-003 Path write contract

The producer (spec 002) writes to the canonical path by:

1. Building the snapshot in memory.
2. Validating it against the JSON Schema defined in spec 001 data-contracts.md.
3. Computing the SHA-256 of the canonicalised JSON.
4. Comparing to `state/last_published.json[source].hash`.
5. If unchanged, reporting `skipped_unchanged` and NOT calling `put()`.
6. If changed, calling `put(latest.json, body, { access: 'public', contentType: 'application/json' })` and updating `state/last_published.json[source].hash`.

The dashboard reads via `BLOB_PUBLIC_READ_URL` (an environment-specific
base URL — see FR-006). It MUST NOT use the write token.

### FR-004 Schema versioning

Every snapshot begins with a `schemaVersion: 1` field. Consumers MUST
reject payloads whose `schemaVersion` is not the highest version they
support. Producers MUST bump `schemaVersion` only on a breaking change.

### FR-005 Sanitisation boundary

The producer is the **only** component that handles raw state. The
sanitisation contract is:

- **IDs:** Opaque dashboard IDs (`{source}:{slug}` per spec 001 FR-007 ID derivation). Never raw external IDs (no Steam AppIDs, no PSN NPWR IDs, no Xbox product IDs).
- **Titles:** Allow-listed by source. Title may be the publisher's display name but MUST NOT include private annotations.
- **Paths/tokens:** Never appear in any field of any snapshot.
- **Secrets:** Never appear in any field, anywhere, ever.
- **Free-form metadata:** Allowed only when the key is in an allow-list. Default-deny.

The dashboard receives only the sanitised envelope from the producer.
Any raw state that arrives at the dashboard is a privacy violation and
MUST be reported as a bug.

### FR-006 Env-var registry

Three env vars are formally part of this contract. All are server-side
only; none may be `NEXT_PUBLIC_*`.

| Variable | Required by | Purpose | Forbidden values |
|---|---|---|---|
| `GAMES_DASHBOARD_DATA_SECRET` | Producer (spec 002) | Optional HMAC secret used to sign outbound writes when Vercel Blob's write API requires it. Mirrors the `coms-dashboard` pattern. When absent, the producer reports `disabled_missing_secret` (graceful degradation per spec 002 FR-010). | Never logged. Never sent to client. |
| `BLOB_READ_WRITE_TOKEN` | Producer (spec 002) | Vercel Blob write-token. Used by `put()` only. | Never logged. Never sent to client. |
| `BLOB_PUBLIC_READ_URL` | Dashboard (spec 001) | Base URL for fetching snapshots. Server-side env var; consumed in `lib/readers/blob.ts`. Read-only by intent; does not require the write token. | Never logged. Never sent to client. |

Forbidden env-var prefixes anywhere in the codebase:

- `NEXT_PUBLIC_GAMES_*`
- `NEXT_PUBLIC_BLOB_*`
- Any other `NEXT_PUBLIC_*` that carries a value (variable *names* in
  docs are fine; values are not).

### FR-007 Retention policy

The MVP keeps **only the latest snapshot per leaf**. Historical retention
is deferred per spec 001 "Resolved decisions". The `_meta/manifest.json`
artefact, if introduced later, may record lineage but is itself overwritten
atomically.

### FR-008 Manifest (optional, future)

A `_meta/manifest.json` may record per-source provenance: producer
version, last successful sync, item counts, validation pass/fail. This is
producer-side only and is not part of the dashboard read path. Implementation
of this artefact is **out of scope for MVP** but the path is reserved.

### FR-009 Secret rotation

When any of `GAMES_DASHBOARD_DATA_SECRET` or `BLOB_READ_WRITE_TOKEN` is
rotated:

1. The new value is set in the producer's runtime env.
2. The producer continues to use the new value on the next run.
3. No producer state change is required (HMAC keys are stateless; Vercel
   Blob write tokens are stateless).
4. The dashboard reader is unaffected (it uses `BLOB_PUBLIC_READ_URL`, which
   is path-stable).

There is no in-flight "old token" window because the producer reads the
current env at process start.

### FR-010 Failure modes

| Failure | Producer behaviour | Dashboard behaviour |
|---|---|---|
| Missing `GAMES_DASHBOARD_DATA_SECRET` | Report `disabled_missing_secret` for both snapshots, exit 0. | Render fixture-fallback banner (already implemented in spec 001). |
| Missing `BLOB_READ_WRITE_TOKEN` | Report `disabled_missing_secret`, exit 0. | Render fixture-fallback banner. |
| Missing `BLOB_PUBLIC_READ_URL` (dashboard) | n/a | Render fixture-fallback banner. |
| Write rejected (4xx, 5xx) | Report `rejected_unauthorised` or `write_failed`, do NOT crash. Exit non-zero so cron marks the run failed. | Render fixture-fallback banner; show last-known-good banner if available. |
| Schema validation fails | Report `validation_failed`, do NOT call `put()`. Exit non-zero. | Render fixture-fallback banner. |

## Non-functional requirements

- All secrets are server-side only.
- All read paths are server-side. The client bundle MUST NOT contain
  snapshot contents or read URLs.
- The dashboard renders within 2 seconds (95th percentile) on a warm
  cache with `BLOB_PUBLIC_READ_URL` set.
- The producer run completes in < 10 seconds for catalogs up to 500 games.

## Resolved design decisions

| Question | Decision |
|---|---|
| Storage target | Vercel Blob. Same as `coms-dashboard` and `meals-dashboard`. |
| Path prefix | `games-dashboard/v1/...` |
| Read mechanism | `BLOB_PUBLIC_READ_URL` (public, server-side only). Avoids the write token on the read path. |
| Write mechanism | `BLOB_READ_WRITE_TOKEN` via Vercel Blob SDK, server-side only. |
| Producer signing | `GAMES_DASHBOARD_DATA_SECRET` (HMAC) — optional, mirrors `coms-dashboard`. |
| Retention | Latest snapshot only. Historical retention deferred. |
| Per-source inputs | Optional under `games-dashboard/v1/{source}/latest.json`. Producer-side only. |
| Dashboard client access to store | NONE. Read path is server-side only. |
| Schema versioning | `schemaVersion` integer, bumped only on breaking change. |
| `_meta/manifest.json` | Reserved path, future producer-side provenance. Not served to dashboard. |

## Open questions

See `open-questions.md`.

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.