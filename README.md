# YunoCRM v2

A hand-kept CRM — organizations, people, deals, activities and contracts, all
entered through forms. No automation, no AI, no ingestion pipelines: every
record exists because someone typed it.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Auth.

## Current state

This is the scaffold. Authentication, the app shell and the seven section
routes are in place; every section renders an empty state. Database migrations
and the forms that fill them are the next step, once the schema is agreed.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Environment variables

All four come from one Supabase project. `.env.local` is gitignored — never
commit real values.

| Variable | Where to find it | Used for |
| --- | --- | --- |
| `SUPABASE_URL` | Project Settings → API | Auth requests |
| `SUPABASE_PUBLISHABLE_KEY` | Project Settings → API (`sb_publishable_…`) | Auth requests, gated by RLS |
| `SUPABASE_SECRET_KEY` | Project Settings → API (`sb_secret_…`) | Not used yet — bypasses RLS, for seeding and admin actions |
| `DATABASE_URL` | Project Settings → Database → Connection string → URI | Not used yet — for migrations |

These are the current Supabase key names; `SUPABASE_PUBLISHABLE_KEY` replaces
the legacy `anon` key and `SUPABASE_SECRET_KEY` replaces `service_role`.

Note that none of them carry the `NEXT_PUBLIC_` prefix, and that is deliberate:
sign-in runs as a Server Action, so no Supabase credential is ever inlined into
the browser bundle. `src/lib/supabase/env.ts` is marked `server-only`, which
turns an accidental import from a Client Component into a build error rather
than a leak.

### First user

There is no sign-up screen — accounts are created by an admin. Add one in the
Supabase Dashboard under **Authentication → Users → Add user**, with
*Auto Confirm User* enabled, then sign in with it.

To exercise the admin role before the `users` table exists, edit that user's
**App Metadata** and add `{ "role": "admin" }`. Settings shows the resolved
role.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## How auth fits together

- `src/proxy.ts` — runs before every request. Refreshes the Supabase session
  and redirects anonymous visitors to `/login`. In Next.js 16 this file
  replaces `middleware.ts`.
- `src/lib/auth/actions.ts` — `signIn` / `signOut` Server Actions.
- `src/lib/auth/current-user.ts` — `getCurrentUser()` / `requireUser()`, the
  real authorization boundary, called from the `(app)` layout.
- `src/lib/auth/profile.ts` — the seam where the `users` table plugs in. It
  returns `null` today; the query to enable is written out in a comment.

The proxy check is optimistic — it runs before routing and only redirects.
Pages rely on `requireUser()`, next to the data it protects.
