# Changelog

## 2026-07-05 — Producer spec initial draft

- Drafted spec 002 in response to "Unblock the spec" — defines the producer side of the games-dashboard MVP.
- Layered on top of the existing `gaming-news` skill; does NOT re-implement eligibility logic.
- Maps `_determine_news_eligibility` outcomes to the dashboard's `EligibilityVerdict` enum per FR-003.
- Defines deterministic ID derivation (`source:slug`) so `playedGameId` cross-references resolve.
- Defines the two snapshot paths: `games-dashboard/v1/played/latest.json` and `games-dashboard/v1/news-monitor/latest.json`.
- Authorises writes via `GAMES_DASHBOARD_DATA_SECRET` (server-side only); mirrors the `coms-dashboard` pattern.
- Skip-unchanged via content hash; one failure MUST NOT block the other snapshot.