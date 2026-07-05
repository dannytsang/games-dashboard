/**
 * /news-monitor — FR-008
 *
 * Renders every NewsMonitorEntry: title, source, reasons, trigger metrics,
 * addedAt, and eligibilityDrift warning where applicable.
 *
 * No client-side Blob reading. Server component only.
 */

import { readNewsMonitor, reasonLabel } from '@/lib/readers/news-monitor';
import { readPlayedGames } from '@/lib/readers/played';
import { detectDrift } from '@/lib/readers/news-monitor';
import type { NewsMonitorEntry } from '@/lib/readers/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function TriggerRow({ entry }: { entry: NewsMonitorEntry }) {
  const t = entry.triggers;
  if (!t) return null;
  const pills: string[] = [];
  if (t.lastPlayedAt) pills.push(`Played: ${formatDate(t.lastPlayedAt)}`);
  if (t.releaseDate) pills.push(`Released: ${formatDate(t.releaseDate)}`);
  if (t.optedInAt) pills.push(`Opted in: ${formatDate(t.optedInAt)}`);
  if (pills.length === 0) return null;
  return (
    <div className="trigger-row">
      {pills.map((p) => (
        <span key={p} className="trigger-pill">
          {p}
        </span>
      ))}
    </div>
  );
}

function NewsMonitorRow({ entry }: { entry: NewsMonitorEntry }) {
  const hasDrift = !!entry.eligibilityDrift;

  return (
    <div className="game-card">
      <div>
        <div className="game-card__title">{entry.title}</div>
        <div className="game-card__meta">
          <span className="source-label">{entry.source}</span>
          <span style={{ marginLeft: '0.5rem' }}>
            Added: {formatDate(entry.addedAt)}
          </span>
        </div>
        <div className="game-card__chips">
          {entry.reasons.length > 0 ? (
            entry.reasons.map((r) => (
              <span key={r} className="chip chip--reason">
                {reasonLabel(r)}
              </span>
            ))
          ) : (
            <span className="chip chip--unknown">No reason recorded</span>
          )}
        </div>
        <TriggerRow entry={entry} />
        {hasDrift && (
          <div className="drift-warning">
            &#x26A0; Eligibility drift: verdict is now{' '}
            <strong>{entry.eligibilityDrift!.currentVerdict}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">&#x1F4E6;</div>
      <div className="empty-state__title">No data available</div>
      <div className="empty-state__body">
        {message ?? 'The news-monitor snapshot is not available.'}
      </div>
    </div>
  );
}

export default async function NewsMonitorPage() {
  const [newsResult, playedResult] = await Promise.all([
    readNewsMonitor(),
    readPlayedGames(),
  ]);

  const driftEntries =
    newsResult.snapshot && playedResult.snapshot
      ? detectDrift(newsResult.snapshot, playedResult.snapshot)
      : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">News Monitor</h1>
        <p className="page-subtitle">
          Games currently being tracked for news. Each entry shows why it was
          added.
        </p>
      </div>

      {newsResult.usingFallback && newsResult.error && (
        <div className="banner banner--warning" style={{ marginBottom: '1.5rem' }}>
          &#x26A0; Using fixture data — {newsResult.error}
        </div>
      )}

      {!newsResult.snapshot && !newsResult.usingFallback && (
        <div className="banner banner--error" style={{ marginBottom: '1.5rem' }}>
          &#x274C; Failed to load news-monitor snapshot. Please try again later.
        </div>
      )}

      {newsResult.snapshot ? (
        <>
          {driftEntries.length > 0 && (
            <div
              className="banner banner--warning"
              style={{ marginBottom: '1.5rem' }}
            >
              &#x26A0; {driftEntries.length} entr{driftEntries.length === 1 ? 'y' : 'ies'}{' '}
              with eligibility drift detected.
            </div>
          )}
          <div className="game-list">
            {newsResult.snapshot.items.map((entry) => (
              <NewsMonitorRow key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
