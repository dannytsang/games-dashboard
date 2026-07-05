# Data Contracts: Games Dashboard News Monitor Producer

> **Canonical types** live in `specs/001-games-dashboard/data-contracts.md`. This document records the producer-side view: how the `gaming-news` skill's internal types are translated into the dashboard-facing contracts.

## Producer inputs (read-only)

The producer reads these from the upstream `gaming-news` skill:

```python
# gaming-news/scripts/stats.py
@dataclass
class NewsPolicy:
    min_score: float           # default 10.0
    time_weight: float         # default 2.0
    count_weight: float        # default 1.0
    streak_weight: float       # default 2.0
    day_weight: float          # default 1.5
    return_boost: float        # default 10.0
    decay_half_life: int       # default 7 (days)
    always_include_for_news: list[str]   # names
    always_exclude_for_news: list[str]   # names

# gaming-news/scripts/games.py
class TrackedGame:
    name: str
    slug: str
    platform: str                # "PC" / etc.
    status: str                  # "playing" / "completed" / etc.
    tracking_mode: str           # "always" | "activity_based" | "paused" | "archived"
    hours_played: float | None
    date_added: str              # YYYY-MM-DD
    steam_app_id: int | None
    tags: list[str]
    research: str
    developer: str
    release_date: str            # YYYY-MM-DD or empty
    price: str

# gaming-news/scripts/stats.py
class EngagementMetrics:
    total_hours: float
    total_sessions: int
    distinct_days: int
    streak_days: int
    max_streak: int
    days_since_played: int | None
    was_dormant: bool

# gaming-news/scripts/stats.py
class ScoreResult:
    final_score: float
    base_score: float
    recency_multiplier: float
    streak_bonus: float
    distinct_days_bonus: float
    return_bonus: float
    manual_multiplier: float
```

The catalog entry produced by `build_game_catalog(days=N)` is:

```python
{
    "name": str,
    "game_id": int | None,             # game_id from sensor.steam_danny
    "hours_played": float,
    "play_count": int,
    "distinct_days": int,
    "streak_days": int,
    "max_streak": int,
    "days_since_played": int | None,
    "was_dormant": bool,
    "activity_score": float,
    "score_breakdown": { ... },
    "tracked": bool,                   # present in games.yaml
    "tracking_mode": str,
    "news_eligible": bool,             # result of _determine_news_eligibility
    "news_reason": str,                # "score" | "always-track" | "below-threshold" | ...
    "steam_app_id": int | None,
}
```

## Dashboard-facing output (canonical)

The producer emits these two snapshots. Their canonical TypeScript types are in `specs/001-games-dashboard/data-contracts.md`. The producer MUST emit values that validate against those types.

### `played/latest.json`

```json
{
  "schemaVersion": "played-games/v1",
  "generatedAt": "2026-07-05T20:00:00Z",
  "thresholds": {
    "playedRecentDays": 30,
    "launchWindowDays": 90
  },
  "items": [
    {
      "id": "steam:counter-strike-2",
      "source": "steam",
      "title": "Counter-Strike 2",
      "status": "playing",
      "lastPlayedAt": "2026-07-04T19:30:00Z",
      "releaseDate": "2023-09-27",
      "context": "score 42.5 — 12.3h over 6 sessions, played 1 day ago",
      "eligibility": {
        "verdict": "eligible",
        "reasons": ["recent_activity"]
      }
    },
    {
      "id": "manual:abandoned-thing",
      "source": "manual",
      "title": "Abandoned Thing",
      "status": "shelved",
      "eligibility": {
        "verdict": "not_eligible",
        "reasons": []
      }
    },
    {
      "id": "manual:no-app-id-game",
      "source": "manual",
      "title": "Some Manual Game",
      "status": "playing",
      "eligibility": {
        "verdict": "borderline",
        "reasons": [],
        "unknownReason": "missing_opt_in_record"
      }
    }
  ],
  "summary": {
    "total": 3,
    "eligible": 1,
    "borderline": 1,
    "notEligible": 1,
    "unknown": 0,
    "bySource": { "steam": 1, "manual": 2 }
  }
}
```

### `news-monitor/latest.json`

```json
{
  "schemaVersion": "news-monitor/v1",
  "generatedAt": "2026-07-05T20:00:00Z",
  "items": [
    {
      "id": "steam:counter-strike-2",
      "source": "steam",
      "title": "Counter-Strike 2",
      "reasons": ["recent_activity"],
      "triggers": {
        "lastPlayedAt": "2026-07-04T19:30:00Z"
      },
      "addedAt": "2026-06-20T08:00:00Z",
      "playedGameId": "steam:counter-strike-2"
    }
  ],
  "summary": {
    "total": 1,
    "bySource": { "steam": 1 },
    "byReason": { "recent_activity": 1 },
    "withDrift": 0
  }
}
```

If the matching played row is no longer eligible, the producer adds:

```json
{
  "eligibilityDrift": {
    "currentVerdict": "not_eligible",
    "notedAt": "2026-07-05T20:00:00Z"
  }
}
```

## ID derivation

Dashboard IDs are deterministic and opaque. The producer uses:

```python
def derive_id(source: str, name: str) -> str:
    # source is one of: steam | manual
    # name is the games.yaml name (or detected Steam name)
    slug = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
    return f"{source}:{slug}"
```

This rule is identical for both snapshots so that `playedGameId` matches a played row exactly.

## Producer state files

The producer maintains two small JSON files in `~/.hermes/profiles/home/skills/gaming-news/state/`:

```text
state/last_published.json   # { "played": {"hash": "...", "generatedAt": "..."},
                            #   "news-monitor": { ... } }
state/last_monitor_set.json # { "<id>": "<addedAt ISO>", ... }
```

These files MUST live in the skill's `state/` directory and MUST NOT be committed to any public repo. They contain no private data — only dashboard-side metadata.

## Sanitisation rules (producer-side)

- No raw Steam AppID may appear in `id`. Use the `source:slug` form.
- No raw `last_played_at` Unix timestamp may appear in JSON; ISO 8601 only.
- No InfluxDB host, token, or measurement name may appear in any payload or log.
- No raw news item bodies may appear; only what the dashboard contract permits.
- Score breakdown goes into `context` (a safe string) — full `score_breakdown` is NOT exposed.

## Sync result envelope

```json
{
  "source": "played",
  "status": "written",
  "itemCount": 3,
  "generatedAt": "2026-07-05T20:00:00Z",
  "path": "games-dashboard/v1/played/latest.json",
  "snapshotHash": "sha256:...",
  "writeAttempted": true
}
```

Valid `status` values: `written`, `skipped_unchanged`, `disabled_missing_secret`, `rejected_unauthorised`, `validation_failed`, `write_failed`.

## Environment variables

```text
GAMES_DASHBOARD_DATA_SECRET     # required for write/sync; server-side only
BLOB_READ_WRITE_TOKEN          # required for Vercel Blob write; server-side only
```

Rules:

- `GAMES_DASHBOARD_DATA_SECRET` MUST never be exposed as `NEXT_PUBLIC_*`.
- Its value MUST NEVER appear in this SDD, logs, fixtures, client bundles, or Telegram reports.
- If either env var is missing, the producer MUST emit `disabled_missing_secret` and exit 0.