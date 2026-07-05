# Data Contracts: Games Dashboard MVP

> **Status:** Refined 2026-07-05 alongside FR-007 (played games) and FR-008 (news monitor). Types below are the production contracts. The browser receives only the sanitised content returned by a server-side reader.

## Common building blocks

```ts
export type GameSource =
  | 'steam'
  | 'psn'
  | 'switch'
  | 'xbox'
  | 'epic'
  | 'backloggd'
  | 'manual';

export type GameStatus =
  | 'backlog'
  | 'playing'
  | 'completed'
  | 'shelved'
  | 'replay'
  | 'wishlist'
  | 'unknown';

export interface GameBase {
  /** Opaque dashboard ID, NOT a raw external ID. */
  id: string;
  source: GameSource;
  title: string;
  /** Safe display label only; never a raw account ID. */
  displayName?: string;
  /** Last update from the source (ISO 8601). */
  updatedAt?: string;
  /** Free-form safe metadata. Must NOT include local paths, raw IDs, or tokens. */
  metadata?: Record<string, string | number | boolean | null>;
}
```

## FR-007 — Played games

### Verdict & reasons

```ts
export type EligibilityVerdict = 'eligible' | 'borderline' | 'not_eligible' | 'unknown';

export type EligibilityReason =
  | 'recent_activity'
  | 'recent_launch'
  | 'manual_opt_in';

/** Why a row could not be evaluated; required when verdict === 'unknown'. */
export type EligibilityUnknownReason =
  | 'missing_last_played'
  | 'missing_release_date'
  | 'missing_opt_in_record'
  | 'malformed_source'
  | 'stale_snapshot';
```

### Per-row shape

```ts
export interface PlayedGame extends GameBase {
  status: GameStatus;
  /** When Danny last actually played this title (ISO 8601). Optional — absent if source did not report. */
  lastPlayedAt?: string;
  /** Publisher-reported release date (ISO 8601). Optional. */
  releaseDate?: string;
  /** Concise context: genre / completion % / playtime snippet. Safe fields only. */
  context?: string;
  /** Producer-computed verdict for FR-008 membership. */
  eligibility: {
    verdict: EligibilityVerdict;
    /** All reasons that triggered eligibility. Empty array when verdict is not_eligible. */
    reasons: EligibilityReason[];
    /** Required when verdict === 'unknown'. Otherwise absent. */
    unknownReason?: EligibilityUnknownReason;
  };
}
```

### Snapshot shape

```ts
export interface PlayedGamesSnapshot {
  schemaVersion: 'played-games/v1';
  generatedAt: string; // ISO 8601 UTC
  /** Server-side configuration in effect when the snapshot was produced. */
  thresholds: {
    playedRecentDays: number;       // default 30
    launchWindowDays: number;       // default 90
  };
  items: PlayedGame[];
  summary?: {
    total: number;
    eligible: number;
    borderline: number;
    notEligible: number;
    unknown: number;
    bySource: Partial<Record<GameSource, number>>;
  };
}
```

### Sanitisation rules

- `id` is an opaque dashboard ID; it must not be a raw Steam AppID, PSN title ID, Nintendo title ID, or any other raw external identifier.
- `displayName`, if present, must be a configured friendly label.
- `context` must be concise and summarised. No full raw export text.
- `metadata` must not include local file paths, token paths, raw external IDs, or personal identifiers.
- `lastPlayedAt` and `releaseDate` may be absent; producer MUST NOT fabricate them.

## FR-008 — News monitor

### Reasons (mirror of `EligibilityReason` for the entry side)

```ts
export type NewsMonitorReason =
  | 'recent_activity'
  | 'recent_launch'
  | 'manual_opt_in';
```

### Per-row shape

```ts
export interface NewsMonitorEntry extends GameBase {
  /** Why this entry is on the news monitor. */
  reasons: NewsMonitorReason[];
  /** Trigger metric that caused inclusion. At least one should be present. */
  triggers?: {
    lastPlayedAt?: string;     // ISO 8601
    releaseDate?: string;      // ISO 8601
    optedInAt?: string;        // ISO 8601
  };
  /** When this entry first appeared in a news-monitor snapshot (ISO 8601). */
  addedAt: string;
  /** Optional linked `PlayedGame.id` so the UI can cross-reference. */
  playedGameId?: string;
  /** Set when this entry's verdict in `played/latest.json` is no longer eligible. */
  eligibilityDrift?: {
    currentVerdict: EligibilityVerdict;
    notedAt: string; // ISO 8601
  };
}
```

### Snapshot shape

```ts
export interface NewsMonitorSnapshot {
  schemaVersion: 'news-monitor/v1';
  generatedAt: string; // ISO 8601 UTC
  items: NewsMonitorEntry[];
  summary?: {
    total: number;
    bySource: Partial<Record<GameSource, number>>;
    byReason: Partial<Record<NewsMonitorReason, number>>;
    withDrift: number;
  };
}
```

### Sanitisation rules

Same as FR-007 plus:

- `triggers.lastPlayedAt`, `triggers.releaseDate`, `triggers.optedInAt` are factual fields (not free-form). They must be ISO 8601 strings or absent.
- `eligibilityDrift` is set only by the producer when the `played` snapshot disagrees with the `news-monitor` snapshot for the same title. Dashboard surfaces it read-only.
- The `news-monitor` snapshot must never contain more entries than the `played` snapshot's `eligible` count unless `eligibilityDrift` is set (and the dashboard warns about it).

## Runtime storage contract

Production storage target is **TBD** (likely Vercel Blob). Current runtime object paths:

```text
games-dashboard/v1/played/latest.json         # required for FR-007
games-dashboard/v1/news-monitor/latest.json   # required for FR-008
games-dashboard/v1/{source}/latest.json       # optional producer inputs
```

Future dated/history snapshots may use timestamped paths such as:

```text
games-dashboard/snapshots/YYYY/MM/DD/HHmmss/{name}.json
```

Rules:

- The public repo may include these schemas and fictional fixtures only.
- Real source payloads belong in the chosen runtime store, never in GitHub.
- The browser receives only the sanitised content returned by a server-side reader.
- Store IDs, read/write tokens, and access keys are secrets / runtime configuration, not source-controlled data.
- Server-side thresholds (`playedRecentDays`, `launchWindowDays`) are NOT `NEXT_PUBLIC_*`; they live in server-only env vars.

## Legacy / combined object (kept for fixture compatibility)

The earlier combined `DashboardSnapshotV1` shape remains a fixture-only compatibility layer. New code should NOT consume it; if a transitional adapter needs it, mark it explicitly and prefix the path with `_legacy/`.

## Filter / view-model types (proposed)

```ts
export type PlayedFilter =
  | 'all'
  | { verdict: EligibilityVerdict }
  | { source: GameSource }
  | { reason: EligibilityReason };

export type NewsMonitorFilter =
  | 'all'
  | { source: GameSource }
  | { reason: NewsMonitorReason }
  | { driftOnly: true };
```

Filter predicate definitions belong in the implementation repo's adapters, not in this contract document.