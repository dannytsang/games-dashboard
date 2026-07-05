# Security and Privacy Requirements: Games Dashboard MVP

## Core rule

The dashboard may visualise games data, but it must not become a public archive of Danny's personal gaming activity.

## Public repository restrictions

The public implementation repository must not contain:

- private SDD / spec files;
- raw Steam / PSN / Switch / etc. exports or scraping outputs;
- personal account identifiers (Steam IDs, PSN IDs, gamer tags, friend lists);
- OAuth tokens, refresh tokens, client secrets, API keys;
- real achievement / trophy data, real screenshot payloads, or local media cache paths;
- storage snapshots or any generated dashboard JSON containing real gaming state;
- exact private scraping/routing rules;
- unredacted screenshots or examples from real activity.

## Runtime restrictions

- Prefer server-side reads for private state.
- Store production dashboard data in the chosen runtime store using server-side environment variables for store ID / key / token configuration.
- Do not expose secrets via `NEXT_PUBLIC_*`.
- Do not put local Hermes filesystem paths into client-visible JSON unless they are harmless and deliberately abstracted.
- Do not commit storage payloads containing real gaming data to GitHub, even if the payload is already summarised.
- Production must be auth-gated before private data is available.
- Read-only MVP: no external side effects from the dashboard.

## Verification expectations

Before any public push or deployment, run checks equivalent to:

```bash
git diff --cached --check
git diff --cached | grep -Ei 'access_token|refresh_token|client_secret|api[_-]?key|password|blob_read_write_token|blob_store' || true
```

Findings must be reviewed; harmless env-var names are acceptable, real secret values are not.