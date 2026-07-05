# Changelog

## 2026-07-05 — Spec refinement: played games + news monitor

- Refined umbrella spec 001 to add three explicit top-level surfaces: `/` Summary, `/played`, `/news-monitor`.
- Added FR-007 Played games view: every played game rendered with a per-row eligibility verdict for the news monitor.
- Added FR-008 News monitor view: every monitored game rendered with the reason(s) it was added.
- Added FR-009 Summary updates: counts, quick links, fixture banner.
- Defined the eligibility rule as **combined (any of three)**: `recent_activity` OR `recent_launch` OR `manual_opt_in`.
- Default thresholds written into spec: `PLAYED_RECENT_DAYS=30`, `LAUNCH_WINDOW_DAYS=90`. Server-side only — NOT `NEXT_PUBLIC_*`.
- Added `PlayedGame`, `NewsMonitorEntry`, `EligibilityVerdict`, `EligibilityReason`, `EligibilityUnknownReason`, `NewsMonitorReason` to data contracts.
- Surfaced `eligibilityDrift` as a read-only warning when a news-monitor entry is no longer eligible per the matching played row — no auto-remediation.
- Resolved four previously-open questions (page structure, status scope, summary vs list, single vs per-source pages).
- Privacy tightened: eligibility thresholds and computation are server-side; client only receives the precomputed verdict + reasons.

## 2026-07-05 — FR-000 placeholder shipped

- Implemented FR-000 deployable placeholder landing page per the spec.
- Next.js 14.2.15 App Router + TypeScript; single route `/` with clearly fictional content only.
- No secrets, no `NEXT_PUBLIC_*` env values, no Vercel Blob, no auth, no source integrations.
- Build, lint, type-check all green on a fresh clone.
- Tester verdict: **PASS** (after one fix cycle — `ed8b1d1` committed the missing scaffold files that `73580cd5` had left untracked).
- Pushed commits: `73580cd5`, `ed8b1d1`, `262bdf2`.

## 2026-07-05 — Initial umbrella scaffold

- Created public implementation repo `git@github.com:dannytsang/games-dashboard.git`.
- Added SDD scaffolding: 8 reusable templates under `specs/_template-*.md` plus `decisions/`, `evidence/`, `sanitized-examples/` directories.
- Drafted umbrella MVP `specs/001-games-dashboard/` with open-questions-first posture; no product scope committed yet.
- Recorded public-code / private-SDD boundary in `README.md`.
- Recorded skeleton `skill-map.yaml` for the project.
- Note: the private SDD workspace has not been provisioned yet; the umbrella will be moved there once it has real product content.
- Note: Vercel project ID is not yet recorded — to be filled in once Danny confirms.