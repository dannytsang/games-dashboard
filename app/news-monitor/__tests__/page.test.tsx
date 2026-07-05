/// <reference types="vitest/globals" />
/**
 * Component tests for app/news-monitor/page.tsx
 *
 * Uses vi.hoisted() at module scope to make mock data available to
 * vi.mock factory (which is always hoisted to the top of the file).
 * vi.mocked() configures per-test return values after modules are loaded.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/news-monitor'),
}));

// ---------------------------------------------------------------------------
// Mock data — hoisted alongside vi.mock so the factory can close over it
// ---------------------------------------------------------------------------

const { mockNews, mockPlayed, mockPlayedStale } = vi.hoisted(() => {
  const mockNews = {
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
        id: 'nm-005',
        source: 'backloggd',
        title: 'Wilderness Survival',
        status: 'backlog',
        reasons: ['manual_opt_in'],
        triggers: { optedInAt: '2026-06-01T00:00:00.000Z' },
        addedAt: '2026-06-01T08:00:00.000Z',
        playedGameId: 'pg-007',
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

  const mockPlayed = {
    schemaVersion: 'played-games/v1',
    generatedAt: '2026-07-05T12:00:00.000Z',
    thresholds: { playedRecentDays: 30, launchWindowDays: 90 },
    items: [
      { id: 'pg-001', source: 'steam', title: 'Stellar Odyssey', status: 'completed', eligibility: { verdict: 'eligible', reasons: ['recent_activity'] } },
      { id: 'pg-006', source: 'steam', title: 'Arcade Classic Vol. 3', status: 'playing', eligibility: { verdict: 'borderline', reasons: ['recent_activity'] } },
      { id: 'pg-007', source: 'backloggd', title: 'Wilderness Survival', status: 'backlog', eligibility: { verdict: 'eligible', reasons: ['manual_opt_in'] } },
    ],
  };

  const mockPlayedStale = {
    schemaVersion: 'played-games/v1',
    generatedAt: '2026-07-05T12:00:00.000Z',
    thresholds: { playedRecentDays: 30, launchWindowDays: 90 },
    items: [
      { id: 'pg-001', source: 'steam', title: 'Stellar Odyssey', status: 'completed', eligibility: { verdict: 'eligible', reasons: ['recent_activity'] } },
      // pg-006 verdict changed to not_eligible — triggers drift
      { id: 'pg-006', source: 'steam', title: 'Arcade Classic Vol. 3', status: 'playing', eligibility: { verdict: 'not_eligible', reasons: [] } },
      { id: 'pg-007', source: 'backloggd', title: 'Wilderness Survival', status: 'backlog', eligibility: { verdict: 'eligible', reasons: ['manual_opt_in'] } },
    ],
  };

  return { mockNews, mockPlayed, mockPlayedStale };
});

// ---------------------------------------------------------------------------
// Mock factories — vi.hoisted keeps data in scope; vi.mocked() tweaks per test
// ---------------------------------------------------------------------------

const readNewsMonitor = vi.fn();
const detectDrift = vi.fn(() => []);
const readPlayedGames = vi.fn();
const { reasonLabel } = vi.hoisted(() => ({
  reasonLabel: vi.fn((r: string) =>
    r === 'recent_activity' ? 'Recent activity' :
    r === 'recent_launch' ? 'Recent launch' :
    r === 'manual_opt_in' ? 'Manual opt-in' : r,
  ),
}));

vi.mock('@/lib/readers/news-monitor', () => ({
  readNewsMonitor: () => readNewsMonitor(),
  detectDrift: () => detectDrift(),
  reasonLabel,
}));

vi.mock('@/lib/readers/played', () => ({
  readPlayedGames: () => readPlayedGames(),
}));

import NewsMonitorPage from '@/app/news-monitor/page';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewsMonitor page', () => {
  beforeEach(() => {
    // Default: fresh data, no drift
    readNewsMonitor.mockResolvedValue({ snapshot: mockNews, usingFallback: false });
    readPlayedGames.mockResolvedValue({ snapshot: mockPlayed, usingFallback: false });
    detectDrift.mockReturnValue([]);
  });

  it('renders a row per NewsMonitorEntry', async () => {
    const html = renderToString(await NewsMonitorPage());
    expect(html).toContain('Stellar Odyssey');
    expect(html).toContain('Arcade Classic Vol. 3');
    expect(html).toContain('Wilderness Survival');
    expect(html).toContain('Mystery Dungeon');
  });

  it('renders manual_opt_in reason', async () => {
    const html = renderToString(await NewsMonitorPage());
    expect(html).toContain('Manual opt-in');
  });

  it('renders "no reason recorded" for empty reasons array', async () => {
    reasonLabel.mockReturnValue('');
    const html = renderToString(await NewsMonitorPage());
    expect(html).toContain('No reason recorded');
  });

  it('shows drift warning when detectDrift finds entries', async () => {
    // Override played snapshot to the stale one — detectDrift will find drift
    readPlayedGames.mockResolvedValue({ snapshot: mockPlayedStale, usingFallback: false });
    const html = renderToString(await NewsMonitorPage());
    expect(html).toContain('Eligibility drift');
    expect(html).toContain('borderline');
  });

  it('shows no-data state when news snapshot is null', async () => {
    readNewsMonitor.mockResolvedValue({ snapshot: null, usingFallback: false });
    readPlayedGames.mockResolvedValue({ snapshot: null, usingFallback: false });
    const html = renderToString(await NewsMonitorPage());
    expect(html).toContain('No data available');
  });
});
