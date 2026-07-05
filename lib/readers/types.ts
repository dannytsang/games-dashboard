// Types matching canonical contracts from specs/001-games-dashboard/data-contracts.md

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
  /** Opaque dashboard ID — NOT a raw external ID. */
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

// ---------------------------------------------------------------------------
// FR-007 — Played games
// ---------------------------------------------------------------------------

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

export interface PlayedGame extends GameBase {
  status: GameStatus;
  /** When Danny last actually played this title (ISO 8601). Optional. */
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

export interface PlayedGamesSnapshot {
  schemaVersion: 'played-games/v1';
  generatedAt: string; // ISO 8601 UTC
  thresholds: {
    playedRecentDays: number;
    launchWindowDays: number;
  };
  items: PlayedGame[];
  summary?: {
    total: number;
    eligible: number;
    borderline: number;
    notEligible: number;
    unknown: number;
    bySource?: Partial<Record<GameSource, number>>;
  };
}

// ---------------------------------------------------------------------------
// FR-008 — News monitor
// ---------------------------------------------------------------------------

export type NewsMonitorReason = 'recent_activity' | 'recent_launch' | 'manual_opt_in';

export interface NewsMonitorEntry extends GameBase {
  /** Current status of this entry (e.g. playing, backlog, completed). */
  status?: GameStatus;
  /** Why this entry is on the news monitor. */
  reasons: NewsMonitorReason[];
  /** Trigger metric that caused inclusion. At least one should be present. */
  triggers?: {
    lastPlayedAt?: string;  // ISO 8601
    releaseDate?: string;   // ISO 8601
    optedInAt?: string;     // ISO 8601
  };
  /** When this entry first appeared in a news-monitor snapshot (ISO 8601). */
  addedAt: string;
  /** Optional linked PlayedGame.id so the UI can cross-reference. */
  playedGameId?: string;
  /** Set when this entry's verdict in played/latest.json is no longer eligible. */
  eligibilityDrift?: {
    currentVerdict: EligibilityVerdict;
    notedAt: string; // ISO 8601
  };
}

export interface NewsMonitorSnapshot {
  schemaVersion: 'news-monitor/v1';
  generatedAt: string; // ISO 8601 UTC
  items: NewsMonitorEntry[];
  summary?: {
    total: number;
    bySource?: Partial<Record<GameSource, number>>;
    byReason?: Partial<Record<NewsMonitorReason, number>>;
    withDrift: number;
  };
}

// ---------------------------------------------------------------------------
// Drift detection result
// ---------------------------------------------------------------------------

export interface DriftEntry {
  entry: NewsMonitorEntry;
  playedGame: PlayedGame;
}
