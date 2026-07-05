# Security and Privacy Requirements: Logged User & Menu

> **Status:** Draft — created 2026-07-05.
> Inherits the privacy stance from `../001-games-dashboard/security-privacy.md`.

## Core rule

The chip and menu MUST NOT render, log, or transmit any OAuth token,
session secret, or non-public session claim. Only `name`, `email`, and
`image` reach the UI.

## Public repository restrictions

The public implementation repository MUST NOT contain:

- Real session JWTs.
- Real `sub` values (Authentik user IDs are persistent; leaking them
  violates privacy).
- Real session cookie values.
- Custom session claims beyond the documented allow-list.

## Runtime restrictions

- The chip is server-rendered. No `'use client'` in `components/user-chip.tsx`.
- The menu's `next-auth/react` import is dynamic (only when the menu is
  open) to avoid leaking the auth client into every page bundle.
- The localStorage key (`'games-dashboard-theme'`) is namespaced to this
  dashboard. Cross-dashboard key collision is a privacy concern.

## Failure-mode logging

The chip and menu MUST NOT log session claims. Server-side logging is
limited to a `chip_rendered` / `menu_opened` / `signout_completed`
boolean status code, never the display name or any other claim.

## Verification expectations

```bash
# No OAuth claims in chip/menu code
git ls-files | xargs grep -lE "session\?\.user\.(sub|accessToken|refreshToken|idToken)" && exit 1 || echo clean

# No raw email in the rendered chip (HTML test)
grep -rE "data-user-chip-display=\"[^\"]*@" .next/ 2>/dev/null | head -5 || echo "no raw email in build output"

# Confirm the localStorage key is games-dashboard-scoped
grep -q "games-dashboard-theme" lib/user-menu.ts && echo "storage key scoped to games dashboard"
```

Findings MUST be reviewed; harmless env-var names are acceptable, real
values are not.