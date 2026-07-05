# Data Contracts: OIDC Authentication

> **Status:** Draft — created 2026-07-05.
> Mirrors `meals-dashboard/lib/auth.ts` and `meals-dashboard/middleware.ts`.

## Auth options

```ts
import type { NextAuthOptions } from 'next-auth';
import AuthentikProvider from 'next-auth/providers/authentik';

const REQUIRED_AUTH_ENV = [
  'AUTHENTIK_CLIENT_ID',
  'AUTHENTIK_CLIENT_SECRET',
  'AUTHENTIK_ISSUER',
  'NEXTAUTH_SECRET',
] as const;

export function getMissingAuthEnvironment(): string[];

export function assertAuthConfigured(): void;

export const authOptions: NextAuthOptions;
```

## Session shape

The session callback returns a subset of NextAuth's full session:

```ts
export interface DashboardSession {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;  // ISO 8601
}
```

The session MUST NOT include any of: `sub`, `accessToken`, `refreshToken`, `idToken`, or any other OAuth claim.

## Page-level session resolution

```ts
// app/page.tsx (server component)
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function SummaryPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin?callbackUrl=/');
  }
  // ... render with session.user
}
```

## Middleware matcher

```ts
// middleware.ts (repo root)
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/auth/signin' },
});

export const config = {
  matcher: [
    '/',
    '/played',
    '/news-monitor',
    '/api/dashboard/:path*',
    '/api/build-info',
  ],
};
```

## Public-by-design routes (NOT matched)

| Route | Reason |
|---|---|
| `/auth/signin` | Sign-in page itself. |
| `/api/auth/:path*` | NextAuth.js's own endpoints (sign-in, callback, session, csrf, signout, providers). |
| `/_next/*` | Next.js assets. |
| `/favicon.ico`, `/icon.png`, `/icon.svg`, `/apple-icon.png` | Icons. |
| `/public/*` | Static files. |

## Env-var contract

| Variable | Type | Source | Notes |
|---|---|---|---|
| `AUTHENTIK_CLIENT_ID` | string | Authentik admin UI | Public identifier. |
| `AUTHENTIK_CLIENT_SECRET` | string | Authentik admin UI | Server-side only. Never logged. |
| `AUTHENTIK_ISSUER` | URL string | Authentik admin UI | e.g. `https://authentik.example.com/application/o/dashboard/`. |
| `NEXTAUTH_SECRET` | string | Operator | 32+ random bytes, base64. Server-side only. |
| `NEXTAUTH_URL` | URL string | Vercel | Public dashboard URL. Used by NextAuth.js for callback construction. |

None may use the `NEXT_PUBLIC_*` prefix.

## Failure-mode response contract

The "auth not configured" page is server-rendered:

```ts
// Pseudo: rendered when getMissingAuthEnvironment() returns a non-empty list
export interface AuthNotConfiguredPageProps {
  missingVariables: readonly string[];
  /** No values. Names only. */
}
```

The page MUST NOT echo any env-var value, even if a value is present.

## Verification commands

```bash
# Confirm no client-side secrets
git ls-files | xargs grep -lE 'NEXT_PUBLIC_AUTHENTIK|NEXT_PUBLIC_NEXTAUTH' && exit 1 || echo clean

# Confirm no real values in repo
git ls-files | xargs grep -lEi 'AUTHENTIK_CLIENT_SECRET\s*=\s*[A-Za-z0-9._-]{8,}' || echo clean

# Confirm no real Authentik instance URLs (real ones, not example.com placeholders)
git ls-files | xargs grep -lE 'authentik\.[a-z0-9-]+\.(com|io|net|org)/application' || echo clean

# Confirm middleware matcher is wired
test -f middleware.ts && grep -q "withAuth" middleware.ts && echo "middleware wired"
```

(Real Authentik URLs MUST be operator-only and never committed.)