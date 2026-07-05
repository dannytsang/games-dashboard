# Spec 001: Games Dashboard MVP

> **Status note:** This is the umbrella spec scaffolding. It deliberately
> leaves product scope, data sources, and storage target as open questions
> until Danny confirms them. Copy/adapt the `_template-*.md` files in
> `specs/` when fleshing this spec out, or — preferred — move it into the
> private SDD workspace at `~/.hermes/workspace/games-dashboard-sdd/specs/001-games-dashboard/`.

## Status

- **State:** Proposed (scaffolding)
- **Owner:** Danny Tsang (product) · JARVIS (spec) · coder (implementation) · tester (verification)
- **Created:** 2026-07-05
- **Last updated:** 2026-07-05

## Summary

Build a private, read-only dashboard that surfaces Danny's games data in one place — backlog, recent activity, trophies, recommendations, or whatever the source mix turns out to be. The initial MVP is read-only and source-aware: it shows what is available, where it came from, and what state it is in, without mutating external systems.

This spec is the umbrella MVP contract. Detailed child specs will own authentication, layout, source storage, source sync, source-specific publishers, and page-specific behaviours — modelled on `coms-dashboard`'s spec structure.

## Relationship to implementation specs

- Authentication/protected shell: TBD (`002-…`)
- Logged-in user shell and account menu: TBD (`003-…`, `004-…`)
- Responsive layout: TBD (`005-…`)
- Source-separated runtime storage: TBD (Blob or alternative)
- Common source-sync architecture: TBD
- Source-specific publishers: TBD (one per source)

## Goals

1. Provide one dashboard for the games data sources Danny wants surfaced.
2. Show source-aware cards with title, platform/source, status, last-played, recommended next step.
3. Preserve privacy by default: no raw tokens, no client-side secrets, no real personal identifiers.
4. Keep the dashboard read-only; no outbound mutations from the dashboard itself.
5. Support SDD delivery with explicit acceptance criteria and tester-verifiable behaviour.

## Non-goals for MVP

- No sending messages or modifying external gaming accounts from the dashboard.
- No live polling directly from the browser.
- No raw full-export UI.
- No public exposure of SDD, contact routing rules, or real account identifiers.
- No new games-automation policy; the dashboard is read-only by default.

## Users

- **Danny:** primary user and decision maker.
- **JARVIS/Hermes profiles:** producers of games data and implementation/verification evidence.

## Data storage and sources

Production storage target is **TBD** (likely Vercel Blob, mirroring `coms-dashboard`). Game data must be written to and read from a private runtime store, never from files committed to GitHub.

Do not record storage IDs, access keys, or token values in this SDD or in the public implementation repository. The implementation should detect storage capability from server-side environment variables and fail closed or show a safe empty state when storage is unavailable.

Current proposed runtime object paths (subject to change once sources are confirmed):

```text
games-dashboard/v1/{source}/latest.json
```

The public repo may contain adapter code, schemas, type definitions, validation logic, and fictional fixtures, but **must not** contain real account identifiers, real backlog data, real achievement exports, or private screenshots.

## Functional requirements

### FR-000 Deployable placeholder

The MVP needs a deployable skeleton before private data and auth decisions are complete. The placeholder must be clearly fictional, build successfully, and must not include private data, secrets, real accounts, or integration behaviour.

### FR-001 Combined games overview

The dashboard exposes one or more top-level pages that aggregate the chosen sources. The exact page structure is **TBD** until sources are confirmed; the proposed default is:

- `/` — Summary / landing page.
- `/{source}` — source-specific detail pages (one per chosen source, e.g. `/backlog`, `/trophies`, `/recent`).

Until real data is connected, these pages must use clearly fictional skeleton/fixture content only.

### FR-001a Navigation

The application provides persistent navigation to access all top-level pages. The landing page is the default route and should be visibly selected when active.

### FR-002 Source-aware cards

Each item card shows:

- source / platform label;
- title;
- concise context (genre, completion %, last played, etc.);
- status (active, completed, backlog, etc.);
- last-updated time where known;
- recommended next step (e.g. "play next", "trophy hunt", "review").

### FR-003 Read-only MVP

The MVP does not send, approve, cancel, dismiss, modify library state, or mutate ledgers. Any action controls shown in the UI must be disabled, omitted, or clearly labelled as future work.

### FR-004 Privacy boundary

No OAuth token, API key, account ID, raw export, local media path, or private SDD content is sent to the client unless explicitly sanitised and required for the UI.

### FR-005 Authentication required

The deployed dashboard must not be publicly readable. The implementation must preserve a protected shell (Authentik/OIDC or equivalent) and must not bypass it for dashboard pages.

### FR-006 Testable fixture format

Public tests may use fictional fixtures that mimic the item shape without real accounts or real personal data.

## Non-functional requirements

- Next.js implementation should prefer server-side data loading from the chosen store for private state.
- Store credentials must be server-side environment variables only; no credential may use `NEXT_PUBLIC_*` or be inlined into the client bundle.
- Client bundle must not contain secrets or private state paths beyond harmless configuration names.
- UI should be compact and dashboard-oriented rather than verbose transcript-style reporting.
- Date/time formatting must avoid SSR/client hydration mismatches.
- Verification must include lint/build/tests plus privacy checks for accidental fixture/secret leakage.

## Open questions

See `open-questions.md`. The major ones are:

1. Which games data sources are in scope for v1? (Steam, PSN trophies, Switch, Backloggd, RAWG, IGDB, manual list, …)
2. Where is the canonical games data stored today, if anywhere?
3. Should the storage target be Vercel Blob (mirror coms-dashboard) or another store?
4. What exactly does each dashboard page show — backlog only, trophies, recommendations, all of it?
5. Which Hermes skills/feeds will produce the source snapshots?

## Acceptance criteria

See `acceptance-criteria.md`.

## Implementation plan

See `plan.md`.

## Tasks

See `tasks.md`.