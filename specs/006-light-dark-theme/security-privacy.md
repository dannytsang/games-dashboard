# Security and Privacy Requirements: Light/Dark Theme

> **Status:** Draft — created 2026-07-05.
> Inherits the privacy stance from `../001-games-dashboard/security-privacy.md`.

## Core rule

The theme layer MUST NOT introduce any cross-dashboard key collision,
any cookie, any URL state, or any server-side persisted value. Theme is
a purely client-side, localStorage-scoped concern.

## Public repository restrictions

The public implementation repository MUST NOT contain:

- Real `localStorage` values from a user's actual browser.
- Hard-coded theme values that could expose user preference.
- Cookie-based theme persistence (forbidden by FR-010).

## Runtime restrictions

- Theme state lives in `localStorage` only.
- The localStorage key MUST be `'games-dashboard-theme'` (namespaced).
- No theme value in cookies, URL, headers, or any persisted state
  visible to the server.
- No `NEXT_PUBLIC_THEME` env var.

## Verification expectations

```bash
# Confirm storage key is games-dashboard-scoped (not meals-dashboard or other)
grep -q "'games-dashboard-theme'" lib/user-menu.ts && echo "storage key scoped"

# Confirm no theme cookie
git ls-files | xargs grep -lE 'theme.*=.*["\047](dark|light)["\047]' app/ && exit 1 || echo clean

# Confirm server default is 'dark' on the html tag
grep -q 'data-theme="dark"' app/layout.tsx && echo "server default ok"
```

Findings MUST be reviewed; harmless env-var names are acceptable, real
values are not.