# Security and Privacy Requirements: OIDC Authentication

> **Status:** Draft — created 2026-07-05.
> Inherits the privacy stance from `../001-games-dashboard/security-privacy.md`.

## Core rule

The auth layer MUST NOT log, echo, serialise, or render any OAuth token,
client secret, JWT secret, or non-public session claim. The dashboard is
private; only `name`, `email`, `image` reach the UI.

## Public repository restrictions

The public implementation repository MUST NOT contain:

- Real `AUTHENTIK_CLIENT_SECRET` values.
- Real `NEXTAUTH_SECRET` values.
- Real Authentik instance URLs (other than `example.com` placeholders).
- Real OAuth callback URLs pointing at the production deployment.
- Decoded JWTs, even with `alg: none` test variants.

## Runtime restrictions

- All auth env vars are server-side only.
- `AUTHENTIK_CLIENT_SECRET` and `NEXTAUTH_SECRET` MUST NOT use the
  `NEXT_PUBLIC_*` prefix.
- The session JWT MUST be `httpOnly`, `secure`, and `sameSite: lax`
  (NextAuth.js defaults — verified at deploy time).
- `next-auth/react` MAY be imported in client components only for the
  `signIn` and `signOut` functions; it MUST NOT be used to read the
  session client-side (use server components).

## Failure-mode logging

The auth layer MUST log only:

- A short status code (`auth_not_configured`, `signin_failed`,
  `callback_failed`, `signout_failed`).
- A request ID.
- The presence/absence of the session (boolean), never the claims.

It MUST NOT log the OAuth error body, the raw session JWT, the
`AUTHENTIK_CLIENT_SECRET` value, or any other secret.

## Verification expectations

Before any public push or deployment:

```bash
# No client-side auth secrets
git ls-files | xargs grep -lE 'NEXT_PUBLIC_AUTHENTIK|NEXT_PUBLIC_NEXTAUTH' && exit 1 || echo clean

# No real values in repo
git ls-files | xargs grep -lEi 'AUTHENTIK_CLIENT_SECRET\s*=\s*[A-Za-z0-9._-]{8,}|NEXTAUTH_SECRET\s*=\s*[A-Za-z0-9._+/=]{16,}' || echo clean

# No real Authentik URLs
git ls-files | xargs grep -lE 'authentik\.[a-z0-9-]+\.(com|io|net|org)/application' || echo clean
```

Findings MUST be reviewed; harmless env-var names are acceptable, real
values are not.