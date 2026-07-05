# Security and Privacy Requirements: {Spec Title}

> **Template.** Privacy boundary, secrets handling, and verification commands.

## Core rule

One sentence on the privacy stance.

## Public repository restrictions

The public implementation repository must not contain:

- private SDD/spec files;
- raw game-library exports or scraping outputs;
- OAuth tokens, refresh tokens, client secrets, API keys;
- real identifiers (raw Steam/PSN/etc IDs);
- unredacted screenshots or private examples;
- Blob payloads containing real state.

## Runtime restrictions

- Prefer server-side reads for private state.
- Use server-side environment variables for any secret value.
- Never expose secrets via `NEXT_PUBLIC_*`.
- Production must be auth-gated before private data is available.
- Read-only by default — no external side effects from the dashboard.

## Verification expectations

Before any public push or deployment, run checks equivalent to:

```bash
git diff --cached --check
git diff --cached | grep -Ei 'access_token|refresh_token|client_secret|api[_-]?key|password|blob_read_write_token|blob_store' || true
```

Findings must be reviewed; harmless env-var names are acceptable, real secret values are not.