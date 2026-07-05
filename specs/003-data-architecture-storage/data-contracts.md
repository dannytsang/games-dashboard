# Data Contracts: Data Architecture & Storage

> **Status:** Draft — created 2026-07-05.
> Cites the snapshot contracts in `../001-games-dashboard/data-contracts.md`
> and the producer env vars in `../002-games-news-monitor-producer/data-contracts.md`.

## Storage target

- **Provider:** Vercel Blob.
- **Mode:** public read, server-side write.
- **Region:** Vercel default; producer and consumer MUST be in the same
  region for acceptable latency. (Verified by operator at deploy time.)

## Path conventions

```text
games-dashboard/v1/played/latest.json
games-dashboard/v1/news-monitor/latest.json
games-dashboard/v1/{source}/latest.json
games-dashboard/v1/_meta/manifest.json
```

- **`v1`:** Schema generation. Bumping requires a new spec.
- **`played/latest.json`:** Produced by spec 002 producer. Consumed by spec 001 FR-007.
- **`news-monitor/latest.json`:** Produced by spec 002 producer. Consumed by spec 001 FR-008.
- **`{source}/latest.json`:** Optional per-source inputs. Allowed `source` values are listed in spec 001 data-contracts.md. Producer-side only.
- **`_meta/manifest.json`:** Reserved for producer-side provenance (future). Producer-side only; never served to dashboard.

## Public-facing types (this spec adds none)

This spec inherits the types from spec 001 (`PlayedGame`,
`PlayedGamesSnapshot`, `NewsMonitorEntry`, `NewsMonitorSnapshot`,
`EligibilityVerdict`, `EligibilityReason`, `EligibilityUnknownReason`,
`NewsMonitorReason`, `GameSource`, `GameStatus`) and the producer
mappings from spec 002. This spec is storage-only and contributes no
new public types.

## Envelope contract

Every `latest.json` MUST be a JSON object with at minimum:

```ts
interface SnapshotEnvelope {
  schemaVersion: 1;
  /** Source slug. `played` or `news-monitor` for dashboard-facing leaves. */
  source: 'played' | 'news-monitor' | string;
  /** ISO 8601 UTC. Producer-generated. */
  generatedAt: string;
  /** SHA-256 of the canonicalised body, hex-encoded. */
  snapshotHash: string;
  /** Spec-defined payload. */
  payload: unknown;
}
```

The dashboard reader MUST reject any payload without `schemaVersion: 1`.

## Runtime env-var contract

```ts
interface StorageEnvironment {
  GAMES_DASHBOARD_DATA_SECRET?: string;  // producer; HMAC, optional
  BLOB_READ_WRITE_TOKEN?: string;         // producer; write token
  BLOB_PUBLIC_READ_URL: string;           // dashboard; base URL for reads
}
```

Each variable MUST be set server-side. None may use the `NEXT_PUBLIC_`
prefix. The producer MUST report `disabled_missing_secret` when
`GAMES_DASHBOARD_DATA_SECRET` or `BLOB_READ_WRITE_TOKEN` is missing
(spec 002 FR-010). The dashboard MUST render the fixture-fallback
banner when `BLOB_PUBLIC_READ_URL` is missing or unreachable.

## Sanitisation rules (recap from FR-005)

- **IDs:** Opaque dashboard IDs only. `{source}:{slug}` per spec 001.
- **Titles:** Display labels only.
- **Free-form metadata:** Allow-listed keys only.
- **Tokens, paths, secrets:** NEVER appear in any field.

## Retention policy

- MVP: latest snapshot per leaf only.
- Producer-side `state/` cache (`last_published.json`, `last_monitor_set.json`) is local to the producer's runtime; not in Vercel Blob.
- Atomic overwrite of `latest.json`; no historical versions retained.
- `_meta/manifest.json` is overwritten atomically if introduced; not part of MVP.

## Read failure handling

When `lib/readers/blob.ts` (spec 001) cannot fetch a snapshot:

| Cause | Behaviour |
|---|---|
| `BLOB_PUBLIC_READ_URL` unset | Render fixture-fallback banner on every page. No thrown error. |
| HTTP 404 | Render fixture-fallback banner; log `snapshot_not_found` server-side. |
| HTTP 5xx | Render fixture-fallback banner; log `snapshot_unavailable` server-side. |
| JSON parse error | Render fixture-fallback banner; log `snapshot_malformed` server-side. |
| `schemaVersion` mismatch | Render fixture-fallback banner; log `schema_unsupported` server-side. |

The fixture fallback itself MUST live in `sanitized-examples/` (already
present from spec 001) and MUST contain no real data.

## Write failure handling

The producer MUST distinguish and report:

- `disabled_missing_secret` (env missing, exit 0)
- `rejected_unauthorised` (write token rejected)
- `write_failed` (network/5xx)
- `validation_failed` (schema mismatch before put)
- `skipped_unchanged` (hash unchanged, no write)

Each status is one of the spec 002 FR-009 envelope fields. See spec 002
data-contracts.md for the full envelope.

## Verification commands

```bash
# Confirm no client-side secrets
git ls-files | xargs grep -lE 'NEXT_PUBLIC_(GAMES|BLOB)' && exit 1 || echo clean

# Confirm no real values in repo
git ls-files | xargs grep -lEi 'access_token|refresh_token|client_secret|api[_-]?key|password=|steamid|@gmail|@yahoo' || echo clean

# Confirm storage path is referenced in code, not real Blob URLs
git ls-files | xargs grep -lE 'vercel-storage\.com/[a-zA-Z0-9-]+/games-dashboard' || echo clean
```

(Real `vercel-storage.com` URLs MUST be operator-only and never committed.)