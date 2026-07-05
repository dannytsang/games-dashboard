# Implementation Plan: {Spec Title}

> **For Hermes:** Use `sdd-profile-delivery-team`. JARVIS owns the user conversation and this SDD; `coder` implements in the games-dashboard repo; `tester` independently verifies against this spec and any referenced child specs.

**Goal:** Restate in one sentence what implementing this spec delivers.

**Architecture:** High-level shape — data flow, components, storage, deployment target.

**Tech Stack:** Framework, language, storage target, auth provider.

---

## Implementation scope

Include or exclude child specs explicitly here.

## Phase 1: Reconcile current implementation to the spec

1. …

## Phase 2: …

1. …

## Phase N: Verification

1. Run lint / build / tests.
2. Verify acceptance criteria.
3. Run staged privacy/secret scans before committing.
4. Hand implementation to `tester` for independent acceptance-criteria mapping.
5. Fix tester failures before reporting complete.
6. Verify deployment record and protected production behaviour after push.

## Branch and deployment policy

- Default target: `main` (Production).
- Long-lived `preview` branch for higher-risk workstreams that warrant Vercel Preview.
- Do not default routine work to `preview`. Ask before using it.
- Preview deployments must satisfy the same no-secrets rule.