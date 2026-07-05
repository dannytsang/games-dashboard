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

- Authentication/protected shell: TBD (`002-…`)
- Logged-in user shell and account menu: TBD (`003-…`, `004-…`)
- Responsive layout: TBD (`005-…`)
- Played games view: this spec (`001` FR-007)
- News monitor view: this spec (`001` FR-008)
- Source-separated runtime storage: TBD (Blob or alternative)
- Common source-sync architecture: TBD
- Source-specific publishers: TBD (one per source)

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

## Open questions

See `open-questions.md`. Key ones for this refinement:

1. Is the **combined rule** (recent activity OR recent launch OR manual opt-in) the correct eligibility logic, or should one of the three be the sole trigger?
2. Are the **default thresholds** (`PLAYED_RECENT_DAYS=30`, `LAUNCH_WINDOW_DAYS=90`) right, or do you want a different cut-off?
3. **News sources** for the monitor feed — IGDB, Steam News, RSS feeds, Backloggd, manual entries, or a mix?
4. **Delivery channel** for news items — Telegram, WhatsApp, Email, or dashboard-only?
5. **Producer location** — where does the `played` / `news-monitor` snapshot live? A Hermes skill on the `home` profile, an external cron, or a manual script?
6. **Storage target** — Vercel Blob (mirror coms-dashboard) or something else?

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.