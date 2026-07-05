# Data Contracts: Games Dashboard MVP

> **Status note:** These types are placeholders until sources and the
> storage target are confirmed (see `open-questions.md`).

## Public-facing types

```ts
export type GameSource = 'steam' | 'psn' | 'switch' | 'backloggd' | 'manual';

export type GameStatus =
  | 'backlog'
  | 'playing'
  | 'completed'
  | 'shelved'
  | 'replay'
  | 'wishlist';

export interface GameItem {
  id: string;             // opaque dashboard ID, not a raw external ID
  source: GameSource;
  status: GameStatus;
  title: string;
  context?: string;       // genre / completion % / last played snippet
  recommendedAction?: string;
  updatedAt?: string;     // ISO 8601
  displayName?: string;   // safe display label; no raw account IDs
  metadata?: Record<string, string | number | boolean | null>;
}
```

## Runtime storage contract

Production storage target is **TBD** (likely Vercel Blob). Proposed runtime object paths:

```text
games-dashboard/v1/{source}/latest.json
```

Future dated/history snapshots may use timestamped paths such as:

```text
games-dashboard/snapshots/YYYY/MM/DD/HHmmss/{source}.json
```

Rules:

- The public repo may include this schema and fictional fixtures only.
- Real source payloads belong in the chosen runtime store, never in GitHub.
- The browser receives only the sanitised content returned by a server-side reader.
- Store IDs, read/write tokens, and access keys are secrets / runtime configuration, not source-controlled data.

## Sanitisation rules

- `id` must be an opaque dashboard ID, not a raw Steam AppID / PSN title ID / etc.
- `displayName` should use configured friendly labels only.
- `context` should be concise and summarised, not full raw export text by default.
- `metadata` must not include local file paths, token paths, raw external IDs, or personal identifiers.

## Filter / view-model types (proposed)

```ts
export type GamesMvpFilter =
  | 'all'
  | { source: GameSource }
  | { status: GameStatus };
```

Filter predicates to be defined once the source mix is confirmed.