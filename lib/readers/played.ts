/**
 * Server-only reader for the played-games snapshot.
 *
 * Path: games-dashboard/v1/played/latest.json
 * Fallback: sanitized-examples/played.fictional.json
 *
 * This module is server-only — never import it from client components.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  PlayedGame,
  PlayedGamesSnapshot,
  EligibilityVerdict,
} from './types';
import { fetchBlobJson } from './blob';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isPlayedGamesSnapshot(raw: unknown): raw is PlayedGamesSnapshot {
  if (typeof raw !== 'object' || raw === null) return false;
  const s = raw as Record<string, unknown>;
  return (
    s.schemaVersion === 'played-games/v1' &&
    typeof s.generatedAt === 'string' &&
    typeof s.thresholds === 'object' &&
    Array.isArray(s.items)
  );
}

function isPlayedGame(raw: unknown): raw is PlayedGame {
  if (typeof raw !== 'object' || raw === null) return false;
  const g = raw as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    typeof g.title === 'string' &&
    typeof g.source === 'string' &&
    typeof g.eligibility === 'object'
  );
}

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

function loadFixture(): PlayedGamesSnapshot {
  // Works in both dev (cwd = repo root) and production (deployed artifact)
  const fixturePath = join(process.cwd(), 'sanitized-examples', 'played.fictional.json');
  const raw = readFileSync(fixturePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!isPlayedGamesSnapshot(parsed)) {
    throw new Error('played.fictional.json is not a valid PlayedGamesSnapshot');
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface PlayedReaderResult {
  snapshot: PlayedGamesSnapshot | null;
  usingFallback: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

const BLOB_PATH = 'games-dashboard/v1/played/latest.json';

/**
 * Fetch the played-games snapshot from Blob (or env-derived URL).
 * Falls back to the committed fixture if the blob is unavailable or malformed.
 */
export async function readPlayedGames(): Promise<PlayedReaderResult> {
  try {
    const { data, usingFallback } = await fetchBlobJson<unknown>({ path: BLOB_PATH });

    if (usingFallback || data === null) {
      try {
        const snapshot = loadFixture();
        return { snapshot, usingFallback: true };
      } catch (fixtureErr) {
        return {
          snapshot: null,
          usingFallback: true,
          error: `Blob unavailable and fixture also failed to load: ${String(fixtureErr)}`,
        };
      }
    }

    if (!isPlayedGamesSnapshot(data)) {
      // Malformed — try fixture
      try {
        const snapshot = loadFixture();
        return { snapshot, usingFallback: true };
      } catch {
        return {
          snapshot: null,
          usingFallback: true,
          error: 'Blob snapshot is malformed and fixture fallback also failed.',
        };
      }
    }

    // Validate each item
    const validItems: PlayedGame[] = (data.items ?? []).filter(isPlayedGame);
    const snapshot: PlayedGamesSnapshot = {
      ...data,
      items: validItems,
    };

    return { snapshot, usingFallback };
  } catch (err) {
    try {
      const snapshot = loadFixture();
      return { snapshot, usingFallback: true };
    } catch {
      return {
        snapshot: null,
        usingFallback: true,
        error: `readPlayedGames failed: ${String(err)}`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers (used by pages)
// ---------------------------------------------------------------------------

export function verdictLabel(verdict: EligibilityVerdict): string {
  switch (verdict) {
    case 'eligible':    return 'Eligible';
    case 'borderline':   return 'Borderline';
    case 'not_eligible': return 'Not eligible';
    case 'unknown':     return 'Unknown';
  }
}

export function reasonLabel(reason: string): string {
  switch (reason) {
    case 'recent_activity': return 'Recent activity';
    case 'recent_launch':   return 'Recent launch';
    case 'manual_opt_in':   return 'Manual opt-in';
    default:                return reason;
  }
}
