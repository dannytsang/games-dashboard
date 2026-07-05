# games-dashboard

Public implementation repository for Danny Tsang's games dashboard.

## Purpose

This repo hosts the **Next.js implementation** of the games dashboard. The product surface, requirements, acceptance criteria, and evidence live in a separate private SDD workspace (`~/.hermes/workspace/games-dashboard-sdd`) so this public repository stays focused on code only.

The pattern mirrors `coms-dashboard` (umbrella MVP `001` plus child specs `002+`).

## Repositories and paths

| Surface | Path / ID | Visibility | Purpose |
|---|---|---|---|
| Implementation repo | `git@github.com:dannytsang/games-dashboard.git` | Public GitHub | Next.js app code only |
| SDD workspace | `~/.hermes/workspace/games-dashboard-sdd` | Private local workspace | Requirements, specs, evidence |
| Vercel project | _TBD — link not yet recorded_ | Vercel | Deployment target |

> The Vercel project ID and `BLOB_STORE`/`BLOB_READ_WRITE_TOKEN` values are intentionally **not** recorded here. They live in the private SDD workspace and in Vercel environment variables only.

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

The `specs/` directory holds **reusable spec templates only** (the `specs/_template-*.md` files). Each new feature creates a `specs/NNN-{slug}/` directory under the private SDD workspace, not here.

| File | Purpose |
|---|---|
| `specs/_template-spec.md` | Spec contract skeleton |
| `specs/_template-acceptance-criteria.md` | Testable acceptance checklist |
| `specs/_template-data-contracts.md` | Schemas, paths, sanitisation rules |
| `specs/_template-security-privacy.md` | Privacy boundary and verification |
| `specs/_template-plan.md` | Phased implementation approach |
| `specs/_template-tasks.md` | Task list with status |
| `specs/_template-open-questions.md` | Open questions tracker |
| `specs/_template-changelog.md` | Per-spec changelog |
| `decisions/` | Architecture decision records (ADRs) |
| `evidence/` | Tester evidence, build logs, privacy scans |
| `sanitized-examples/` | Fictional fixtures safe to commit |

## Skill map

See `skill-map.yaml` for the per-spec status and the Hermes skills expected to be involved.