/// <reference types="vitest/globals" />
/**
 * Tests for lib/readers/news-monitor.ts
 *
 * Covers:
 * - snapshot validation
 * - fixture fallback when blob is unavailable
 * - drift detection between news-monitor and played snapshots
 * - reason label helpers
 */

import { describe, it, expect } from 'vitest';
import { reasonLabel, readNewsMonitor, detectDrift } from '../news-monitor';
import type {
  NewsMonitorSnapshot,
  PlayedGamesSnapshot,
  NewsMonitorEntry,
  PlayedGame,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_NEWS: NewsMonitorSnapshot = {
  schemaVersion: 'news-monitor/v1',
  generatedAt: '2026-07-05T12:00:00.000Z',
  items: [
    {
      id: 'nm-001',
      source: 'steam',
      title: 'Stellar Odyssey',
      status: 'completed',
      reasons: ['recent_activity', 'recent_launch'],
      triggers: { lastPlayedAt: '2026-07-01T18:30:00.000Z', releaseDate: '2026-03-15T00:00:00.000Z' },
      addedAt: '2026-06-15T08:00:00.000Z',
      playedGameId: 'pg-001',
    },
    {
      id: 'nm-004',
      source: 'steam',
      title: 'Arcade Classic Vol. 3',
      status: 'playing',
      reasons: ['recent_activity'],
      triggers: { lastPlayedAt: '2026-06-30T11:00:00.000Z' },
      addedAt: '2026-07-01T08:00:00.000Z',
      playedGameId: 'pg-006',
      eligibilityDrift: { currentVerdict: 'borderline', notedAt: '2026-07-04T12:00:00.000Z' },
    },
    {
      id: 'nm-007',
      source: 'steam',
      title: 'Mystery Dungeon',
      status: 'backlog',
      reasons: [],
      triggers: {},
      addedAt: '2026-06-10T08:00:00.000Z',
    },
  ],
};

const MATCHING_PLAYED: PlayedGamesSnapshot = {
  schemaVersion: 'played-games/v1',
  generatedAt: '2026-07-05T12:00:00.000Z',
  thresholds: { playedRecentDays: 30, launchWindowDays: 90 },
  items: [
    {
      id: 'pg-001',
      source: 'steam',
      title: 'Stellar Odyssey',
      status: 'completed',
      eligibility: { verdict: 'eligible', reasons: ['recent_activity'] },
    },
    {
      id: 'pg-006',
      source: 'steam',
      title: 'Arcade Classic Vol. 3',
      status: 'playing',
      eligibility: { verdict: 'eligible', reasons: ['recent_activity'] },
    },
  ],
};

const STALE_PLAYED: PlayedGamesSnapshot = {
  schemaVersion: 'played-games/v1',
  generatedAt: '2026-07-05T12:00:00.000Z',
  thresholds: { playedRecentDays: 30, launchWindowDays: 90 },
  items: [
    {
      id: 'pg-001',
      source: 'steam',
      title: 'Stellar Odyssey',
      status: 'completed',
      eligibility: { verdict: 'not_eligible', reasons: [] }, // no longer eligible
    },
  ],
};

// ---------------------------------------------------------------------------
// reasonLabel
// ---------------------------------------------------------------------------

describe('reasonLabel', () => {
  it('recent_activity → "Recent activity"', () => {
    expect(reasonLabel('recent_activity')).toBe('Recent activity');
  });
  it('recent_launch → "Recent launch"', () => {
    expect(reasonLabel('recent_launch')).toBe('Recent launch');
  });
  it('manual_opt_in → "Manual opt-in"', () => {
    expect(reasonLabel('manual_opt_in')).toBe('Manual opt-in');
  });
  it('unknown reason → passthrough', () => {
    expect(reasonLabel('foo_bar')).toBe('foo_bar');
  });
});

// ---------------------------------------------------------------------------
// detectDrift
// ---------------------------------------------------------------------------

describe('detectDrift', () => {
  it('returns empty array when played snapshot is null', () => {
    expect(detectDrift(VALID_NEWS, null)).toEqual([]);
  });

  it('returns empty array when no entries have drift', () => {
    const drifts = detectDrift(VALID_NEWS, MATCHING_PLAYED);
    expect(drifts).toEqual([]);
  });

  it('detects drift when played verdict is no longer eligible', () => {
    const drifts = detectDrift(VALID_NEWS, STALE_PLAYED);
    expect(drifts.length).toBe(1);
    expect(drifts[0].entry.id).toBe('nm-001');
    expect(drifts[0].playedGame.id).toBe('pg-001');
  });

  it('ignores entries without a playedGameId', () => {
    const newsWithNoLink: NewsMonitorSnapshot = {
      ...VALID_NEWS,
      items: [
        {
          id: 'nm-007',
          source: 'steam',
          title: 'Mystery Dungeon',
          status: 'backlog',
          reasons: [],
          triggers: {},
          addedAt: '2026-06-10T08:00:00.000Z',
        },
      ],
    };
    const drifts = detectDrift(newsWithNoLink, STALE_PLAYED);
    expect(drifts).toEqual([]);
  });

  it('sorts drifts by addedAt descending', () => {
    const newsNewestFirst: NewsMonitorSnapshot = {
      ...VALID_NEWS,
      items: [
        {
          id: 'nm-001',
          source: 'steam',
          title: 'Stellar Odyssey',
          status: 'completed',
          reasons: ['recent_activity'],
          triggers: {},
          addedAt: '2026-06-15T08:00:00.000Z',
          playedGameId: 'pg-001',
          eligibilityDrift: { currentVerdict: 'not_eligible', notedAt: '2026-07-04T12:00:00.000Z' },
        },
        {
          id: 'nm-006',
          source: 'steam',
          title: 'Another Game',
          status: 'playing',
          reasons: ['recent_activity'],
          triggers: {},
          addedAt: '2026-07-04T08:00:00.000Z',
          playedGameId: 'pg-006',
          eligibilityDrift: { currentVerdict: 'unknown', notedAt: '2026-07-04T12:00:00.000Z' },
        },
      ],
    };
    const playedStale: PlayedGamesSnapshot = {
      ...MATCHING_PLAYED,
      items: [
        { id: 'pg-001', source: 'steam', title: 'Stellar Odyssey', status: 'completed', eligibility: { verdict: 'not_eligible', reasons: [] } },
        { id: 'pg-006', source: 'steam', title: 'Another Game', status: 'playing', eligibility: { verdict: 'unknown', reasons: [], unknownReason: 'stale_snapshot' } },
      ],
    };
    const drifts = detectDrift(newsNewestFirst, playedStale);
    expect(drifts[0].entry.id).toBe('nm-006'); // newer
    expect(drifts[1].entry.id).toBe('nm-001');
  });
});

// ---------------------------------------------------------------------------
// readNewsMonitor fixture
// ---------------------------------------------------------------------------

describe('readNewsMonitor — fixture', () => {
  it('loads the fixture and returns valid snapshot', async () => {
    const result = await readNewsMonitor();
    expect(result.snapshot).not.toBeNull();
    expect(result.usingFallback).toBe(true);
    expect(result.snapshot!.schemaVersion).toBe('news-monitor/v1');
    expect(Array.isArray(result.snapshot!.items)).toBe(true);
    expect(result.snapshot!.items.length).toBeGreaterThan(0);
  });

  it('fixture contains at least one entry with eligibilityDrift', async () => {
    const result = await readNewsMonitor();
    const withDrift = result.snapshot!.items.filter((e) => e.eligibilityDrift);
    expect(withDrift.length).toBeGreaterThan(0);
  });

  it('fixture contains at least one entry with manual_opt_in reason', async () => {
    const result = await readNewsMonitor();
    const withManualOptIn = result.snapshot!.items.some((e) =>
      e.reasons.includes('manual_opt_in'),
    );
    expect(withManualOptIn).toBe(true);
  });

  it('fixture contains at least one entry with empty reasons array', async () => {
    const result = await readNewsMonitor();
    const withEmptyReasons = result.snapshot!.items.some((e) => e.reasons.length === 0);
    expect(withEmptyReasons).toBe(true);
  });
});
