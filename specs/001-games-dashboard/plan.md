# Implementation Plan: Games Dashboard MVP

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and the private SDD; `coder` implements in this repo; `tester` independently verifies against this spec and any referenced child specs.

**Goal:** Implement the Games Dashboard umbrella MVP as a private, read-only Next.js dashboard that visualises sanitised games data without exposing private gaming activity publicly.

**Architecture:** Use Next.js with server-side data loading, server-side source readers, deterministic source-separated latest objects, and sanitised source publishers. Mirror the coms-dashboard pattern of an umbrella MVP implemented together with relevant child specs.

**Tech Stack:** Next.js, TypeScript, React, server-side data loading, Vercel Blob (proposed), auth-gated production deployment.

---

## Implementation scope for the next batch

TBD — depends on the answers to `open-questions.md`.

Likely non-final Proposed child specs to add once the umbrella MVP is firm:

- Source-separated runtime storage.
- Common source-sync architecture (deterministic paths, secret auth, validation, freshness).
- Source-specific publishers (one per chosen source).
- Summary / landing page consumer behaviour.

## Phase 1: Reconcile current implementation to the spec

1. Inspect the current public app against the Proposed umbrella.
2. Identify gaps between existing code and the current source contracts.
3. Protect any existing uncommitted user work before implementation.

## Phase 2: Source contracts and sync boundary

1. Implement or update server-side source readers for each chosen source.
2. Validate source snapshots before display.
3. Keep source failures isolated: one missing / malformed / unavailable source must not block the others.
4. Use a server-side sync route with secret-protected architecture and deterministic source paths.
5. Disable sync writes safely when required server secrets/config are missing.

## Phase 3: Product pages

1. Landing `/`: aggregate available validated sources into a summary list.
2. `/{source}`: render source-specific content for each chosen source.
3. Keep all pages read-only.

## Phase 4: Authentication, privacy, and deployment

1. Preserve protected dashboard shell.
2. Ensure production dashboard routes are not publicly readable.
3. Keep store and sync credentials server-side only; no `NEXT_PUBLIC_*` secrets.
4. Ensure the public repo contains no real account identifiers, real exports, raw snapshots, private SDD content, or personal media.
5. Use fictional fixtures only where fallback / demo data is required.

## Branch and deployment policy

- Default implementation target is `main`; pushes to `main` are expected to deploy to Production.
- A long-lived `preview` branch exists for higher-risk workstreams that warrant a Vercel Preview deployment before production.
- Do not default routine work to `preview`. Ask Danny before using `preview`, unless he has explicitly requested a preview branch / deployment for the current workstream.
- Preview deployments must still satisfy the same no-secrets / no-real-data-in-GitHub rule.

## Phase 5: Verification

1. Run lint / build / tests that exist; add a minimal test harness if missing and practical.
2. Verify acceptance criteria, source-separated read paths, sync-route rejection behaviour, and source-specific validation.
3. Run staged privacy/secret scans before committing public code.
4. Hand implementation to `tester` for independent acceptance-criteria mapping.
5. Fix tester failures before reporting complete.
6. After push, verify deployment record for the pushed SHA and production auth / API behaviour as appropriate.