# Tasks: Games Dashboard MVP

## Ready-now preparation tasks

- [x] Create public implementation repository on GitHub.
- [x] Link repository to Vercel (Danny to confirm Vercel project ID).
- [x] Add SDD scaffolding (`specs/_template-*.md`, `decisions/`, `evidence/`, `sanitized-examples/`) to this repo.
- [x] Draft initial umbrella MVP spec (`specs/001-games-dashboard/`).
- [x] Record public-code / private-SDD boundary in repo README.
- [ ] Create private SDD workspace at `~/.hermes/workspace/games-dashboard-sdd`.
- [ ] Decide data sources in scope (Steam, PSN, Switch, Backloggd, manual, …).
- [ ] Decide storage target (Vercel Blob or alternative).
- [ ] Decide auth provider for production.
- [ ] Decide dashboard page structure (single landing vs one page per source).
- [ ] Replace placeholder with skeleton Next.js app + fictional data only.
- [ ] Create long-lived `preview` branch for Vercel Preview deployments.
- [ ] Move umbrella spec into the private SDD workspace once it has real product content.

## Implementation batch tasks

- [ ] Implement/verify agreed source mix on the Summary / landing page.
- [ ] Implement/verify source-separated runtime reads from each `latest.json`.
- [ ] Implement/verify source-level partial availability.
- [ ] Implement/verify common sync boundary (deterministic paths, secret auth, validation).
- [ ] Implement/verify source-specific publishers per chosen source.
- [ ] Implement/verify per-source detail pages.

## Verification tasks

- [ ] Add or update automated tests for source readers and adapters.
- [ ] Add or update validation/privacy tests for source contracts where practical.
- [ ] Run lint / build / tests.
- [ ] Run staged privacy/secret scan before committing public code.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.
- [ ] Verify deployment record and protected production behaviour after push.