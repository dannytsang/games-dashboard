# Security and Privacy Requirements: Data Architecture & Storage

> **Status:** Draft — created 2026-07-05.
> Inherits the privacy stance from `../001-games-dashboard/security-privacy.md`
> and focuses on storage-layer concerns.

## Core rule

The producer and the dashboard MUST NOT include real external IDs,
tokens, paths, account identifiers, or private annotations in any
snapshot, log line, error message, or client-rendered field.

## Public repository restrictions

The public implementation repository MUST NOT contain:

- Real Vercel Blob storage URLs with real namespaces.
- Real `BLOB_READ_WRITE_TOKEN` values.
- Real `BLOB_PUBLIC_READ_URL` values.
- Real `GAMES_DASHBOARD_DATA_SECRET` values.
- Raw external IDs in any field of any committed fixture.
- Real titles that could identify a private library.
- Anything that maps a Vercel deployment ID to a Blob path.

## Runtime restrictions

- All secrets are server-side env vars only.
- Never expose any storage-related secret via `NEXT_PUBLIC_*`.
- The dashboard reads via `BLOB_PUBLIC_READ_URL`, which is server-side.
- The producer reads `BLOB_READ_WRITE_TOKEN` and (optionally)
  `GAMES_DASHBOARD_DATA_SECRET` server-side.
- Log lines MUST redact any secret value (same rule as spec 002 FR-009).

## Verification expectations

Before any public push or deployment:

```bash
# No client-side storage secrets
git ls-files | xargs grep -lE 'NEXT_PUBLIC_(GAMES|BLOB)' && exit 1 || echo clean

# No real values in repo
git ls-files | xargs grep -lEi 'access_token|refresh_token|client_secret|api[_-]?key|password=|steamid|@gmail|@yahoo' || echo clean

# No real Vercel Blob URLs committed
git ls-files | xargs grep -lE 'vercel-storage\.com/[a-zA-Z0-9_-]+/games-dashboard' || echo clean
```

Findings MUST be reviewed; harmless env-var names are acceptable, real
values are not.

## Failure-mode logging

The producer MUST log only the high-level status code
(`disabled_missing_secret`, `rejected_unauthorised`, `write_failed`,
`validation_failed`, `skipped_unchanged`). It MUST NOT log the secret
value, the rejected error body, or any field that could leak Blob state.

The dashboard reader MUST log only
(`snapshot_not_found`, `snapshot_unavailable`, `snapshot_malformed`,
`schema_unsupported`). It MUST NOT log the resolved URL or the parsed
body when the body might contain sensitive fields.