/// <reference types="vitest/globals" />
/**
 * Component tests for app/played/page.tsx
 *
 * Uses vi.mock (not vi.doMock) so the factory runs before modules load.
 * vi.mocked() is used to override the mock's return values per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/played'),
}));

// ---------------------------------------------------------------------------
// Static mock data — must be at module scope (vi.mock factory hoists here)
// ---------------------------------------------------------------------------

const MOCK_SNAPSHOT = {
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
      id: 'pg-002',
      source: 'psn',
      title: 'Neon Drivers',
      status: 'playing',
      lastPlayedAt: '2026-06-28T21:00:00.000Z',
      releaseDate: '2026-01-20T00:00:00.000Z',
      context: 'Arcade racer · ~15% complete',
      eligibility: { verdict: 'borderline', reasons: ['recent_activity'] },
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
  ],
};

function verdictLabel(v: string) {
  return v === 'eligible' ? 'Eligible' : v === 'borderline' ? 'Borderline' : v === 'not_eligible' ? 'Not eligible' : 'Unknown';
}
function reasonLabel(r: string) {
  return r === 'recent_activity' ? 'Recent activity' : r === 'recent_launch' ? 'Recent launch' : r === 'manual_opt_in' ? 'Manual opt-in' : r;
}

const readPlayedGames = vi.fn<() => Promise<{ snapshot: typeof MOCK_SNAPSHOT | null; usingFallback: boolean; error?: string }>>();

// ---------------------------------------------------------------------------
// Mock the reader — one vi.mock at top level; individual functions are
// replaced via vi.mocked() in each test
// ---------------------------------------------------------------------------

vi.mock('@/lib/readers/played', () => ({
  readPlayedGames: () => readPlayedGames(),
  verdictLabel,
  reasonLabel,
}));

import PlayedPage from '@/app/played/page';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Played page', () => {
  beforeEach(() => {
    readPlayedGames.mockResolvedValue({ snapshot: MOCK_SNAPSHOT, usingFallback: false });
  });

  it('renders a row per PlayedGame', async () => {
    const { container } = render(await PlayedPage());
    expect(container.textContent).toContain('Stellar Odyssey');
    expect(container.textContent).toContain('Neon Drivers');
    expect(container.textContent).toContain('Kingdom Tiles');
    expect(container.textContent).toContain('Puzzle Island');
  });

  it('renders all four verdict labels', async () => {
    const { container } = render(await PlayedPage());
    expect(container.textContent).toContain('Eligible');
    expect(container.textContent).toContain('Borderline');
    expect(container.textContent).toContain('Not eligible');
    expect(container.textContent).toContain('Unknown');
  });

  it('renders reasons chips for eligible rows', async () => {
    const { container } = render(await PlayedPage());
    expect(container.textContent).toContain('Recent activity');
    expect(container.textContent).toContain('Recent launch');
  });

  it('renders unknownReason when verdict is unknown', async () => {
    const { container } = render(await PlayedPage());
    expect(container.textContent).toContain('missing_last_played');
  });

  it('shows no-data state when snapshot is null', async () => {
    readPlayedGames.mockResolvedValue({ snapshot: null, usingFallback: false });
    const { container } = render(await PlayedPage());
    expect(container.textContent).toContain('No data available');
  });
});
