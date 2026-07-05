/**
 * Server-only reader for the news-monitor snapshot.
 *
 * Path: games-dashboard/v1/news-monitor/latest.json
 * Fallback: sanitized-examples/news-monitor.fictional.json
 *
 * This module is server-only — never import it from client components.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  NewsMonitorEntry,
  NewsMonitorSnapshot,
  PlayedGamesSnapshot,
  DriftEntry,
} from './types';
import { fetchBlobJson } from './blob';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isNewsMonitorSnapshot(raw: unknown): raw is NewsMonitorSnapshot {
  if (typeof raw !== 'object' || raw === null) return false;
  const s = raw as Record<string, unknown>;
  return (
    s.schemaVersion === 'news-monitor/v1' &&
    typeof s.generatedAt === 'string' &&
    Array.isArray(s.items)
  );
}

function isNewsMonitorEntry(raw: unknown): raw is NewsMonitorEntry {
  if (typeof raw !== 'object' || raw === null) return false;
  const e = raw as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.title === 'string' &&
    typeof e.source === 'string' &&
    typeof e.addedAt === 'string' &&
    Array.isArray(e.reasons)
  );
}

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

function loadFixture(): NewsMonitorSnapshot {
  const fixturePath = join(process.cwd(), 'sanitized-examples', 'news-monitor.fictional.json');
  const raw = readFileSync(fixturePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!isNewsMonitorSnapshot(parsed)) {
    throw new Error('news-monitor.fictional.json is not a valid NewsMonitorSnapshot');
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------

/**
 * Cross-reference a news-monitor snapshot against a played-games snapshot
 * to surface eligibility drift — rows where the news-monitor entry's
 * playedGameId maps to a PlayedGame whose verdict is no longer 'eligible'.
 *
 * Returns drift entries sorted by addedAt descending.
 */
export function detectDrift(
  newsSnapshot: NewsMonitorSnapshot,
  playedSnapshot: PlayedGamesSnapshot | null,
): DriftEntry[] {
  if (!playedSnapshot) return [];

  const playedById = new Map(playedSnapshot.items.map((g) => [g.id, g]));

  const drifts: DriftEntry[] = [];
  for (const entry of newsSnapshot.items) {
    if (!entry.playedGameId) continue;
    const playedGame = playedById.get(entry.playedGameId);
    if (!playedGame) continue;
    if (playedGame.eligibility.verdict !== 'eligible') {
      drifts.push({ entry, playedGame });
    }
  }

  return drifts.sort(
    (a, b) => new Date(b.entry.addedAt).getTime() - new Date(a.entry.addedAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface NewsMonitorReaderResult {
  snapshot: NewsMonitorSnapshot | null;
  usingFallback: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

const BLOB_PATH = 'games-dashboard/v1/news-monitor/latest.json';

/**
 * Fetch the news-monitor snapshot from Blob (or env-derived URL).
 * Falls back to the committed fixture if the blob is unavailable or malformed.
 */
export async function readNewsMonitor(): Promise<NewsMonitorReaderResult> {
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

    if (!isNewsMonitorSnapshot(data)) {
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

    const validItems: NewsMonitorEntry[] = (data.items ?? []).filter(isNewsMonitorEntry);
    const snapshot: NewsMonitorSnapshot = {
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
        error: `readNewsMonitor failed: ${String(err)}`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function reasonLabel(reason: string): string {
  switch (reason) {
    case 'recent_activity': return 'Recent activity';
    case 'recent_launch':   return 'Recent launch';
    case 'manual_opt_in':   return 'Manual opt-in';
    default:                return reason;
  }
}
