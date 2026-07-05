# Evidence

Tester verification evidence, build logs, and privacy scans for the games-dashboard project.

## Layout

| Subdirectory | Purpose |
|---|---|
| `build/` | `next build` output, lint output, type-check output |
| `tests/` | Test run output and coverage summaries |
| `privacy/` | Privacy / secret scan output and review notes |
| `deployment/` | Vercel deployment records, environment variable audits |

## How to use

After `coder` implements a spec batch:

1. Save relevant `next build`, `next lint`, and `tsc --noEmit` output here.
2. Save the privacy / secret scan output here.
3. Save test-run output here.
4. Hand the implementation over to `tester` for independent verification.
5. Tester saves its evidence alongside coder's.

Nothing in this directory should be a substitute for evidence stored in the
private SDD workspace — this is the public-facing mirror only.