# games-dashboard

Public implementation repository for Danny Tsang's games dashboard.

## Purpose

This repo hosts the **Next.js implementation** of the games dashboard. The product surface, requirements, acceptance criteria, and evidence live in a separate private SDD workspace (`~/.hermes/workspace/games-dashboard-sdd`) so this public repository stays focused on code only.

The pattern mirrors `coms-dashboard` (umbrella MVP `001` plus child specs `002+`).

## Repositories and paths

| Surface | Path / ID | Visibility | Purpose |
|---|---|---|---|
| Implementation repo | `git@github.com:dannytsang/games-dashboard.git` | Public GitHub | Next.js app code only |
| SDD workspace | `specs/` (this repo) | Public templates + Proposed specs | Requirements, specs, evidence |
| Private SDD workspace | _TBD — see `specs/001-games-dashboard/tasks.md`_ | Private local | Reserved for when product content firms up |
| Producer (server-side) | `~/.hermes/profiles/home/skills/gaming-news/scripts/publish_dashboard_snapshots.py` | Private | Spec 002 — publishes `played/latest.json` and `news-monitor/latest.json` |
| Upstream producer skill | `~/.hermes/profiles/home/skills/gaming-news/` | Private | Existing skill; the spec-002 producer is a thin adapter on top of it |
| Vercel project | _TBD — link not yet recorded_ | Vercel | Deployment target |
| Vercel Blob | _TBD — `games-dashboard/v1/*` paths_ | Vercel | Runtime store for the two dashboard snapshots |

> The Vercel project ID, `GAMES_DASHBOARD_DATA_SECRET`, `BLOB_READ_WRITE_TOKEN`, and `GAMES_DASHBOARD_BLOB_STORE_ID` values are intentionally **not** recorded here. They live in the private producer environment and in Vercel environment variables only.

## Operating model

Use spec-driven development:

```text
private requirement/spec → coder implements in this repo → tester verifies → coder fixes if required → tester confirms → JARVIS reports evidence
```

The public repo **must not** include the private SDD workspace or any raw/private examples. If the implementation needs fixtures, create sanitised fixtures with fictional data only.

## Branch and deployment policy

- **Default target:** `main` (Production).
- **`preview`** branch is long-lived and used for higher-risk workstreams that warrant a Vercel Preview deployment.
- Do **not** default routine work to `preview`. Ask before using it.
- Preview deployments must satisfy the same no-secrets / no-real-data rule.

## SDD scaffolding in this repo

The `specs/` directory holds the **Proposed umbrella spec** and the **producer spec** (Proposed), plus reusable spec templates. Each new feature creates a `specs/NNN-{slug}/` directory in this repo (or in the private SDD workspace once it exists).

| Path | Purpose |
|---|---|
| `specs/001-games-dashboard/` | Umbrella MVP — three top-level pages (`/`, `/played`, `/news-monitor`), eligibility model, drift surfacing. Final target. |
| `specs/002-games-news-monitor-producer/` | Server-side producer adapter on top of the existing `gaming-news` skill. Publishes the two dashboard snapshots. Final target. |
| `specs/_template-*.md` | Reusable spec templates |
| `decisions/` | Architecture decision records (ADRs) |
| `evidence/` | Tester evidence, build logs, privacy scans |
| `sanitized-examples/` | Fictional fixtures safe to commit |

## Skill map

See `skill-map.yaml` for the per-spec status and the Hermes skills expected to be involved.