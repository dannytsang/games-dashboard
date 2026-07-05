# Acceptance Criteria: Data Architecture & Storage

> **Status:** Draft — created 2026-07-05.
> Each criterion maps back to a functional requirement in `spec.md`.

## Product behaviour

- [ ] FR-001 The storage target is documented as Vercel Blob in this spec and in `skill-map.yaml`.
- [ ] FR-002 The path convention `games-dashboard/v1/{leaf}/latest.json` is the only path the producer writes to.
- [ ] FR-003 The producer uses `BLOB_READ_WRITE_TOKEN` for writes only; the dashboard uses `BLOB_PUBLIC_READ_URL` for reads only.
- [ ] FR-004 Every produced snapshot carries `schemaVersion: 1`.
- [ ] FR-005 No raw external IDs, tokens, paths, or secrets appear in any snapshot field. Verified by privacy scan.
- [ ] FR-006 The three env vars are documented; no `NEXT_PUBLIC_*` variant exists.
- [ ] FR-007 Retention is "latest snapshot only". No historical retention is implemented.
- [ ] FR-008 `_meta/manifest.json` is reserved for future use; the dashboard does not consume it.
- [ ] FR-009 Secret rotation works without producer state changes.
- [ ] FR-010 Failure modes produce documented status codes and never crash the producer silently.

## Privacy and security

- [ ] No secret/private data leaks to client bundle or public repo.
- [ ] `NEXT_PUBLIC_GAMES_*` and `NEXT_PUBLIC_BLOB_*` are absent from the codebase.
- [ ] No raw external IDs in any snapshot field.
- [ ] All env-var reads happen server-side only.

## Engineering

- [ ] Lint / build / tests pass.
- [ ] Contracts covered by tests using fictional fixtures only.
- [ ] SSR/hydration deterministic (already covered by spec 001).
- [ ] Tester receives implementation evidence: changed files, commands run, output, privacy/secret scan summary.