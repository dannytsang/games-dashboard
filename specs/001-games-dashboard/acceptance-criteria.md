# Acceptance Criteria: Games Dashboard MVP

## Product behaviour

- [ ] Any placeholder or fixture fallback is clearly fictional and contains no private data.
- [ ] Dashboard renders a combined games overview with the chosen source(s) represented in the data model.
- [ ] Top-level pages exist for the agreed source mix (proposed default: `/`, `/{source}` per source).
- [ ] Landing page is the default route and shows the high-level summary.
- [ ] Source-aware cards display source/platform label, title, concise context, status, last-updated time, and recommended next step where available.
- [ ] Navigation links to all top-level pages and indicates the active page.
- [ ] MVP is read-only: no UI path mutates external accounts, sends messages, or modifies libraries.
- [ ] Runtime dashboard data is read from the chosen server-side store, not from JSON committed to GitHub.
- [ ] Source-separated runtime reads degrade gracefully: one missing/malformed/unavailable source must not block the others.

## Privacy and security

- [ ] No raw OAuth tokens, API keys, refresh tokens, client secrets, account IDs, raw exports, or private SDD files are committed to the public repo.
- [ ] Client bundle receives only sanitised dashboard data.
- [ ] Any fixture committed to the public repo uses fictional data only.
- [ ] Production deployment is not publicly readable without authentication/protection.
- [ ] Server-side env vars are used for secrets; no secret is exposed via `NEXT_PUBLIC_*`.
- [ ] Storage store ID / key / token values are never committed and never exposed in the client bundle.

## Engineering

- [ ] Next.js app builds successfully.
- [ ] Relevant unit/component tests pass.
- [ ] Data adapter boundary exists so the UI is not coupled directly to Hermes-local file paths.
- [ ] Adapter/publisher contracts are covered by tests using fictional fixtures only.
- [ ] Date/time formatting is deterministic across SSR and client hydration.
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.