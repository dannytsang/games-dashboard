# Changelog

## 2026-07-05 — FR-000 placeholder shipped

- Implemented FR-000 deployable placeholder landing page per the spec.
- Next.js 14.2.15 App Router + TypeScript; single route `/` with clearly fictional content only.
- No secrets, no `NEXT_PUBLIC_*` env values, no Vercel Blob, no auth, no source integrations.
- Build, lint, type-check all green on a fresh clone.
- Tester verdict: **PASS** (after one fix cycle — `ed8b1d1` committed the missing scaffold files that `73580cd5` had left untracked).
- Pushed commits: `73580cd5`, `ed8b1d1`.

## 2026-07-05 — Initial umbrella scaffold

- Created public implementation repo `git@github.com:dannytsang/games-dashboard.git`.
- Added SDD scaffolding: 8 reusable templates under `specs/_template-*.md` plus `decisions/`, `evidence/`, `sanitized-examples/` directories.
- Drafted umbrella MVP `specs/001-games-dashboard/` with open-questions-first posture; no product scope committed yet.
- Recorded public-code / private-SDD boundary in `README.md`.
- Recorded skeleton `skill-map.yaml` for the project.
- Note: the private SDD workspace has not been provisioned yet; the umbrella will be moved there once it has real product content.
- Note: Vercel project ID is not yet recorded — to be filled in once Danny confirms.