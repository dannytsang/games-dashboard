/**
 * /played — FR-007
 *
 * Renders every PlayedGame: title, source, last-played, context,
 * verdict label, reasons chips, and unknownReason when applicable.
 *
 * No client-side Blob reading. Server component only.
 */

import { readPlayedGames, verdictLabel, reasonLabel } from '@/lib/readers/played';
import type { PlayedGame } from '@/lib/readers/types';

function GameRow({ game }: { game: PlayedGame }) {
  const verdict = game.eligibility.verdict;
  const verdictClass =
    verdict === 'eligible'
      ? 'eligible'
      : verdict === 'borderline'
      ? 'borderline'
      : verdict === 'not_eligible'
      ? 'not-eligible'
      : 'unknown';

  const badgeClass = `verdict-badge verdict-badge--${verdictClass}`;

  return (
    <div className="game-card">
      <div>
        <div className="game-card__title">{game.title}</div>
        <div className="game-card__meta">
          <span className="source-label">{game.source}</span>
          {game.lastPlayedAt && (
            <span style={{ marginLeft: '0.5rem' }}>
              Last played: {new Date(game.lastPlayedAt).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {game.status && (
            <span style={{ marginLeft: '0.5rem' }}>{game.status}</span>
          )}
        </div>
        {game.context && (
          <div className="game-card__context">{game.context}</div>
        )}
        <div className="game-card__chips">
          {game.eligibility.reasons.map((r) => (
            <span key={r} className="chip chip--reason">
              {reasonLabel(r)}
            </span>
          ))}
        </div>
        {verdict === 'unknown' && game.eligibility.unknownReason && (
          <div className="unknown-reason">
            Unknown reason: {game.eligibility.unknownReason}
          </div>
        )}
      </div>
      <div>
        <span className={badgeClass}>{verdictLabel(verdict)}</span>
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
        {message ?? 'The played-games snapshot is not available.'}
      </div>
    </div>
  );
}

export default async function PlayedPage() {
  const result = await readPlayedGames();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Played Games</h1>
        <p className="page-subtitle">
          Games you have played, with eligibility verdicts for news monitoring.
        </p>
      </div>

      {result.usingFallback && result.error && (
        <div className="banner banner--warning" style={{ marginBottom: '1.5rem' }}>
          &#x26A0; Using fixture data — {result.error}
        </div>
      )}

      {!result.snapshot && !result.usingFallback && (
        <div className="banner banner--error" style={{ marginBottom: '1.5rem' }}>
          &#x274C; Failed to load played-games snapshot. Please try again later.
        </div>
      )}

      {result.snapshot ? (
        <div className="game-list">
          {result.snapshot.items.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
