# Implementation Plan: Data Architecture & Storage

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and this SDD; `coder` implements in the games-dashboard repo; `tester` independently verifies against this spec and the related specs 001, 002, 004.

**Goal:** Document and enforce the runtime storage layer for the games
dashboard. Implement the verification commands and the env-var registry.
Most of the actual writes and reads already exist via specs 001 and 002;
this spec formalises the contract and ensures the existing implementation
matches it.

**Architecture:**

```
+----------------+        +---------------------+        +-----------------+
| gaming-news    |  --->  | publish_dashboard_  |  --->  | Vercel Blob     |
| skill (home)   |        | snapshots.py        |        | v1/latest.json  |
+----------------+        +---------------------+        +-----------------+
                                                               |
                                                               v
                              +---------------------------+   server-side fetch
                              | lib/readers/blob.ts       |   via BLOB_PUBLIC_READ_URL
                              | (Next.js server component)|
                              +---------------------------+
                                       |
                                       v
                              +---------------------------+
                              | Next.js pages (/, /played,|
                              | /news-monitor)            |
                              +---------------------------+
```

**Tech stack:** Vercel Blob, Next.js 15 server components, Python 3.11
producer. All secrets are Vercel-deployed env vars; no client exposure.

---

## Implementation scope

This spec adds NO new application code paths. The producer (spec 002)
and dashboard readers (spec 001) already implement the storage contract.
This spec's implementation is:

1. Update `skill-map.yaml` to reflect this spec's env-var registry.
2. Add the verification commands to CI or pre-commit.
3. Add an operator reference document.
4. Confirm spec 002 / spec 001 contract alignment.

## Phase 1: Reconcile current implementation to the spec

1. Confirm the producer in spec 002 writes to `games-dashboard/v1/played/latest.json` and `games-dashboard/v1/news-monitor/latest.json` (already implemented).
2. Confirm the dashboard readers in spec 001 use `BLOB_PUBLIC_READ_URL` for read (already implemented).
3. Confirm `skill-map.yaml` lists all three env vars (already partially done after spec 002 implementation).
4. Confirm the no-`NEXT_PUBLIC_*` invariant across the repo.

## Phase 2: Update documentation

1. Update `skill-map.yaml` so the storage entry points at this spec.
2. Add `docs/storage.md` (or extend an existing operator reference) with the env-var table.
3. Add the verification commands to `README.md` under "Verification".

## Phase 3: Verification

1. Run lint / build / tests.
2. Run the privacy/secret scan and confirm clean.
3. Hand implementation to `tester` for independent acceptance-criteria mapping.
4. Fix tester failures before reporting complete.
5. Verify deployment record after push.

## Branch and deployment policy

- Default target: `main` (Production).
- Long-lived `preview` branch for higher-risk workstreams that warrant Vercel Preview.
- Do not default routine work to `preview`. Ask before using it.
- Preview deployments must satisfy the same no-secrets rule.