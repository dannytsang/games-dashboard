/**
 * Summary landing page — FR-009
 *
 * Fetches both snapshots server-side and renders:
 * - Total played, total monitored, eligible-not-monitored counts
 * - Quick-link tiles to /played and /news-monitor
 * - "Placeholder / fictional data" banner when using fixtures
 */

import { readPlayedGames } from '@/lib/readers/played';
import { readNewsMonitor } from '@/lib/readers/news-monitor';

export default async function SummaryPage() {
  const [playedResult, newsResult] = await Promise.all([
    readPlayedGames(),
    readNewsMonitor(),
  ]);

  const playedCount = playedResult.snapshot?.items.length ?? 0;
  const monitoredCount = newsResult.snapshot?.items.length ?? 0;

  // eligible-not-monitored = played games that ARE eligible but have no news-monitor entry
  let eligibleNotMonitored: number | null = null;
  if (
    playedResult.snapshot &&
    newsResult.snapshot &&
    !playedResult.usingFallback &&
    !newsResult.usingFallback
  ) {
    const monitoredIds = new Set(
      newsResult.snapshot.items
        .filter((e) => e.playedGameId)
        .map((e) => e.playedGameId),
    );
    eligibleNotMonitored = playedResult.snapshot.items.filter(
      (g) => g.eligibility.verdict === 'eligible' && !monitoredIds.has(g.id),
    ).length;
  }

  const usingFixtures = playedResult.usingFallback || newsResult.usingFallback;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Games Dashboard</h1>
        <p className="page-subtitle">Your games at a glance</p>
      </div>

      {usingFixtures && (
        <div className="banner banner--warning">
          <span>&#x26A0; Placeholder / fictional data</span>
          <span>
            &nbsp;Real data is not available. Showing fixture content for development.
          </span>
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card__label">Total Played</div>
          <div className="summary-card__value">{playedCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Total Monitored</div>
          <div className="summary-card__value">{monitoredCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Eligible Not Monitored</div>
          <div className="summary-card__value">
            {eligibleNotMonitored !== null ? eligibleNotMonitored : '—'}
          </div>
        </div>
      </div>

      <div className="quick-links">
        <a href="/played" className="quick-link">
          &#x1F3AE; View Played Games
        </a>
        <a href="/news-monitor" className="quick-link">
          &#x1F4E3; View News Monitor
        </a>
      </div>
    </div>
  );
}
