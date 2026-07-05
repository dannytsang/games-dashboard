# Spec 001: Games Dashboard MVP

> **Status note:** This is the umbrella spec. Refined 2026-07-05 to add
> the **played games** view and the **games news monitor** view, and to
> make the eligibility logic explicit.

## Status

- **State:** Proposed
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification)
- **Created:** 2026-07-05
- **Last updated:** 2026-07-05 (refined: played games + news monitor)

## Summary

Build a private, read-only dashboard that surfaces Danny's games data in one place. The MVP has three top-level surfaces:

1. **`/` Summary** — counts and quick links across everything.
2. **`/played`** — games Danny has actually played, with a per-row verdict on whether each game is eligible for news monitoring.
3. **`/news-monitor`** — games currently being monitored for news, with a per-row reason for why each one was added.

The MVP is read-only and source-aware: it shows what is available, where it came from, and what state it is in, without mutating external systems.

This spec is the umbrella MVP contract. Detailed child specs will own authentication, layout, source storage, source sync, source-specific publishers, and page-specific behaviours — modelled on `coms-dashboard`'s spec structure.

## Relationship to implementation specs

- Authentication/protected shell: TBD (`003-…`)
- Logged-in user shell and account menu: TBD (`004-…`, `005-…`)
- Responsive layout: TBD (`006-…`)
- Played games view: this spec (`001` FR-007)
- News monitor view: this spec (`001` FR-008)
- **News monitor producer:** `002-games-news-monitor-producer` (Final target — implements the producer side of FR-007 / FR-008 on top of the existing `gaming-news` skill).

## Goals

1. Provide one dashboard for the games data sources Danny wants surfaced.
2. Show **what Danny has played** with a clear, per-row verdict on whether it qualifies for news monitoring.
3. Show **what is currently being monitored for news**, with the reason each entry was added.
4. Preserve privacy by default: no raw tokens, no client-side secrets, no real personal identifiers.
5. Keep the dashboard read-only; no outbound mutations from the dashboard itself.
6. Support SDD delivery with explicit acceptance criteria and tester-verifiable behaviour.

## Non-goals for MVP

- No sending messages or modifying external gaming accounts from the dashboard.
- No live polling directly from the browser.
- No raw full-export UI.
- No public exposure of SDD, contact routing rules, or real account identifiers.
- No new games-automation policy; the dashboard is read-only by default.
- No automatic add/remove of games to/from the news monitor. Eligibility verdict is read-only; curation is a separate future workflow.

## Users

- **Danny:** primary user and decision maker.
- **JARVIS/Hermes profiles:** producers of played-game state, eligibility verdicts, news-monitor state, and implementation/verification evidence.

## Data storage and sources

Production storage target is **TBD** (likely Vercel Blob, mirroring `coms-dashboard`). Game data must be written to and read from a private runtime store, never from files committed to GitHub.

Do not record storage IDs, access keys, or token values in this SDD or in the public implementation repository. The implementation should detect storage capability from server-side environment variables and fail closed or show a safe empty state when storage is unavailable.

Current proposed runtime object paths:

```text
games-dashboard/v1/played/latest.json
games-dashboard/v1/news-monitor/latest.json
games-dashboard/v1/{source}/latest.json    # optional per-source inputs (Steam, PSN, etc.)
```

The `played` and `news-monitor` objects are the dashboard-facing snapshots. The per-source `latest.json` files (if present) are producer inputs that get normalised into the dashboard snapshots.

The public repo may contain adapter code, schemas, type definitions, validation logic, and fictional fixtures, but **must not** contain real account identifiers, real backlog data, real achievement exports, or private screenshots.

## Functional requirements

### FR-000 Deployable placeholder

The MVP needs a deployable skeleton before private data and auth decisions are complete. The placeholder must be clearly fictional, build successfully, and must not include private data, secrets, real accounts, or integration behaviour. _Status: shipped (commits `73580cd5` + `ed8b1d1`)._

### FR-001 Combined games overview

The dashboard exposes three top-level surfaces:

- `/` — Summary / landing page. Counts and quick links to `/played` and `/news-monitor`.
- `/played` — Played games (FR-007).
- `/news-monitor` — Games news monitor (FR-008).

Until real data is connected, these pages must use clearly fictional skeleton/fixture content only.

### FR-001a Navigation

The application provides persistent navigation to access `/`, `/played`, and `/news-monitor`. The landing page is the default route and should be visibly selected when active. `/played` and `/news-monitor` must also show active state.

### FR-002 Source-aware cards

Each item card shows:

- source / platform label (where applicable);
- title;
- concise context (genre, completion %, last played, etc.);
- status (active, completed, backlog, etc.);
- last-updated time where known;
- recommended next step (e.g. "play next", "trophy hunt", "review");
- eligibility / monitor reason (per FR-007 / FR-008).

### FR-003 Read-only MVP

The MVP does not send, approve, cancel, dismiss, modify library state, or mutate ledgers. Any action controls shown in the UI must be disabled, omitted, or clearly labelled as future work. Eligibility verdicts and news-monitor membership are read-only outputs.

### FR-004 Privacy boundary

No OAuth token, API key, account ID, raw export, local media path, or private SDD content is sent to the client unless explicitly sanitised and required for the UI.

### FR-005 Authentication required

The deployed dashboard must not be publicly readable. The implementation must preserve a protected shell (Authentik/OIDC or equivalent) and must not bypass it for dashboard pages.

### FR-006 Testable fixture format

Public tests may use fictional fixtures that mimic the item shape without real accounts or real personal data.

### FR-007 Played games view (`/played`)

The `/played` page shows every game Danny has actually played, regardless of source, with a per-row eligibility verdict for the news monitor.

Each row must show:

- title;
- source / platform label (e.g. `steam`, `psn`, `switch`, `manual`);
- last-played timestamp (when known);
- concise context (genre / completion % / playtime snippet — safe fields only);
- **eligibility verdict** for news monitoring, rendered as a visible label with one of the values below, plus the **reasons** that triggered it.

#### Eligibility verdict values

```ts
type EligibilityVerdict = 'eligible' | 'borderline' | 'not_eligible' | 'unknown';
```

#### Eligibility reasons (combined rule — any one is enough to qualify)

A game is `eligible` if **any** of the following reasons apply; each matching reason is recorded in the `reasons` array so the UI can show *why*:

1. **Recent activity** — played within the last `PLAYED_RECENT_DAYS` (default `30`) days.
2. **Recent launch** — title released within `LAUNCH_WINDOW_DAYS` (default `90`) days AND in the played library (i.e. the publisher is producing news, not just backlog).
3. **Manual opt-in** — present on a curated `news-monitor-opt-in` allow-list (managed outside the dashboard; produced snapshot includes the matching IDs).

Rules:

- A played game with **no** matching reason is `not_eligible` for the news monitor. It is still shown on `/played` so Danny can see what he has played.
- A played game with **one** matching reason is `eligible`.
- If the producer cannot determine any of the three (missing data, malformed source), the verdict is `unknown` and the row carries an `unknownReason` field (e.g. `missing_last_played`, `missing_release_date`).
- A `borderline` verdict is reserved for a future iteration where the producer wants to surface near-threshold cases (e.g. played 35 days ago when threshold is 30). MVP should produce `eligible` / `not_eligible` / `unknown` and reserve `borderline` for the schema even if no row currently uses it.

The threshold values (`PLAYED_RECENT_DAYS`, `LAUNCH_WINDOW_DAYS`) are server-side configuration, NOT `NEXT_PUBLIC_*`. The defaults above are the MVP defaults and may be raised/lowered without a spec change as long as the producer snapshot reflects the new value.

### FR-008 News monitor view (`/news-monitor`)

The `/news-monitor` page shows every game currently on Danny's news-monitor list, regardless of source, with the reason each entry was added.

Each row must show:

- title;
- source / platform label;
- the **reason(s)** the entry was added (`recent_activity`, `recent_launch`, `manual_opt_in`);
- when applicable, the **trigger metric** that put it on the list (e.g. `lastPlayedAt`, `releaseDate`, `optedInAt`);
- added timestamp (when the entry first appeared in a `news-monitor` snapshot).

The list is read from `games-dashboard/v1/news-monitor/latest.json`. Membership in this list is the dashboard's output — the dashboard does not mutate it.

A game is on the news monitor **only if** its eligibility verdict is `eligible` per FR-007. The producer is responsible for ensuring the `news-monitor` snapshot is consistent with the `played` snapshot's eligibility verdicts; if they disagree, the dashboard surfaces a per-row "eligibility drift" warning (no auto-remediation).

### FR-009 Summary landing (`/`)

The Summary page exposes:

- counts: total played, total monitored, eligible not yet monitored (if computable).
- quick links to `/played` and `/news-monitor`.
- optional small lists of: recently played, recently added to monitor.
- clearly labelled "placeholder / fictional data" banner when fixtures are in use.

## Non-functional requirements

- Next.js implementation should prefer server-side data loading from the chosen store for private state.
- Store credentials must be server-side environment variables only; no credential may use `NEXT_PUBLIC_*` or be inlined into the client bundle.
- Client bundle must not contain secrets or private state paths beyond harmless configuration names.
- UI should be compact and dashboard-oriented rather than verbose transcript-style reporting.
- Date/time formatting must avoid SSR/client hydration mismatches.
- Verification must include lint/build/tests plus privacy checks for accidental fixture/secret leakage.
- Eligibility computation must happen server-side; client only receives the precomputed verdict + reasons array.

## Resolved design decisions (2026-07-05 unblock)

| Question | Decision |
|---|---|
| **News sources** | Steam as default (matches `gaming-news` spec 004). RSS / patch-note sources remain future extensions; the dashboard does not block on them. |
| **Delivery channel for news items** | Out of scope for the dashboard. The existing `gaming-news/scripts/cron_daily_news.py` (Telegram) and `weekly_digest.py` continue to own delivery. The dashboard is read-only consumption. |
| **Producer location** | `~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py`. This is a thin adapter that calls the existing `build_game_catalog(days=N)` and `_determine_news_eligibility`. The upstream skill is not modified. |
| **Storage target** | Vercel Blob, same store as `coms-dashboard`. Producer auth: `GAMES_DASHBOARD_DATA_SECRET` (mirrors `COMS_DASHBOARD_DATA_SECRET` pattern). |
| **Eligibility thresholds** | Defaults `playedRecentDays=30`, `launchWindowDays=90` from this spec. The producer's actual gate is the existing `_determine_news_eligibility` decision in `gaming-news` — those two threshold values are recorded in the snapshot for traceability but the runtime decision is made upstream. |
| **Eligibility rule** | Reuse the upstream rule: `forced-include` / `always-track` / `score ≥ min_score` ⇒ `eligible`. Everything else ⇒ `not_eligible` (or `borderline` for missing `app_id`, `unknown` on stale snapshot). See `002-games-news-monitor-producer/spec.md` FR-003 for the mapping table. |
| **Manual opt-in source-of-truth** | `games.yaml` `always_include_for_news` list and `tracking_mode: always` — already in place. No new artefact required. |
| **Auth provider** | TBD (deferred to child spec `003-…`); Authentik/OIDC is the leading candidate based on `coms-dashboard`. |
| **Historical retention** | Defer. MVP keeps only the latest snapshot per source. |
| **Drift remediation policy** | Surface only, read-only, no auto-remediation. The dashboard shows the `eligibilityDrift` warning; nothing else acts on it. |
| **Eligibility thresholds are server-side only** | They are NOT `NEXT_PUBLIC_*`. |
| **Eligibility computation happens server-side** | The dashboard receives the precomputed `verdict` + `reasons` from the producer; it never recomputes. |

## Remaining open questions

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.