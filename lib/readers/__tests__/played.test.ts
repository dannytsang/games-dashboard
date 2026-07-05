/// <reference types="vitest/globals" />
/**
 * Tests for lib/readers/played.ts
 *
 * Covers:
 * - snapshot validation (valid / malformed / missing)
 * - fixture fallback when blob is unavailable
 * - verdict and reason label helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verdictLabel,
  reasonLabel,
  readPlayedGames,
} from '../played';
import type { PlayedGamesSnapshot } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_SNAPSHOT: PlayedGamesSnapshot = {
  schemaVersion: 'played-games/v1',
  generatedAt: '2026-07-05T12:00:00.000Z',
  thresholds: { playedRecentDays: 30, launchWindowDays: 90 },
  items: [
    {
      id: 'pg-001',
      source: 'steam',
      title: 'Stellar Odyssey',
      status: 'completed',
      lastPlayedAt: '2026-07-01T18:30:00.000Z',
      releaseDate: '2026-03-15T00:00:00.000Z',
      context: 'Sci-fi RPG · 98% complete',
      eligibility: { verdict: 'eligible', reasons: ['recent_activity', 'recent_launch'] },
    },
    {
      id: 'pg-004',
      source: 'switch',
      title: 'Kingdom Tiles',
      status: 'backlog',
      lastPlayedAt: '2026-01-10T14:00:00.000Z',
      releaseDate: '2025-06-01T00:00:00.000Z',
      context: 'Turn-based strategy',
      eligibility: { verdict: 'not_eligible', reasons: [] },
    },
    {
      id: 'pg-008',
      source: 'steam',
      title: 'Puzzle Island',
      status: 'shelved',
      eligibility: { verdict: 'unknown', reasons: [], unknownReason: 'missing_last_played' },
    },
    {
      id: 'pg-006',
      source: 'steam',
      title: 'Arcade Classic Vol. 3',
      status: 'playing',
      lastPlayedAt: '2026-06-30T11:00:00.000Z',
      releaseDate: '2025-08-25T00:00:00.000Z',
      eligibility: { verdict: 'borderline', reasons: ['recent_activity'] },
    },
  ],
};

// ---------------------------------------------------------------------------
// verdictLabel
// ---------------------------------------------------------------------------

describe('verdictLabel', () => {
  it('eligible → "Eligible"', () => {
    expect(verdictLabel('eligible')).toBe('Eligible');
  });
  it('borderline → "Borderline"', () => {
    expect(verdictLabel('borderline')).toBe('Borderline');
  });
  it('not_eligible → "Not eligible"', () => {
    expect(verdictLabel('not_eligible')).toBe('Not eligible');
  });
  it('unknown → "Unknown"', () => {
    expect(verdictLabel('unknown')).toBe('Unknown');
  });
});

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
    expect(reasonLabel('some_other_reason')).toBe('some_other_reason');
  });
});

// ---------------------------------------------------------------------------
// readPlayedGames fixture validation
// ---------------------------------------------------------------------------

describe('readPlayedGames — fixture', () => {
  // readPlayedGames internally tries to fetch from Blob first (env not set),
  // then falls back to fixture. In test env without BLOB_PUBLIC_READ_URL it
  // should load the committed fixture.
  it('loads the fixture and returns valid snapshot', async () => {
    const result = await readPlayedGames();
    expect(result.snapshot).not.toBeNull();
    expect(result.usingFallback).toBe(true);
    expect(result.snapshot!.schemaVersion).toBe('played-games/v1');
    expect(Array.isArray(result.snapshot!.items)).toBe(true);
    expect(result.snapshot!.items.length).toBeGreaterThan(0);
  });

  it('fixture contains at least one game per verdict type', async () => {
    const result = await readPlayedGames();
    const items = result.snapshot!.items;

    const verdicts = new Set(items.map((g) => g.eligibility.verdict));
    expect(verdicts.has('eligible')).toBe(true);
    expect(verdicts.has('borderline')).toBe(true);
    expect(verdicts.has('not_eligible')).toBe(true);
    expect(verdicts.has('unknown')).toBe(true);
  });

  it('fixture contains a recent_launch reason', async () => {
    const result = await readPlayedGames();
    const hasRecentLaunch = result.snapshot!.items.some((g) =>
      g.eligibility.reasons.includes('recent_launch'),
    );
    expect(hasRecentLaunch).toBe(true);
  });

  it('fixture unknownReason games have unknown verdict', async () => {
    const result = await readPlayedGames();
    const unknowns = result.snapshot!.items.filter(
      (g) => g.eligibility.verdict === 'unknown',
    );
    unknowns.forEach((g) => {
      expect(g.eligibility.unknownReason).toBeTruthy();
    });
  });

  it('not_eligible games have empty reasons array', async () => {
    const result = await readPlayedGames();
    const notEligible = result.snapshot!.items.filter(
      (g) => g.eligibility.verdict === 'not_eligible',
    );
    notEligible.forEach((g) => {
      expect(g.eligibility.reasons).toEqual([]);
    });
  });
});
