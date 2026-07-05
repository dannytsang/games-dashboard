# Sanitized Examples

Fictional fixtures and example payloads safe to commit to the public repo.

## Rules

- **Fictional only.** No real account IDs, real exports, real screenshots, real personal data.
- **Versioned.** Add a `schemaVersion` or equivalent so fixtures can evolve without breaking adapters.
- **Documented.** Each fixture should have a one-line caption explaining what it demonstrates.

## Layout

| Subdirectory | Purpose |
|---|---|
| `games/` | Fictional game items, libraries, achievement snippets |
| `responses/` | Fictional API responses / adapter inputs |

Nothing here should be treated as production data.