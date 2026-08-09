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

### Accounts

There is no sign-up screen — accounts are created by an admin. `npm run seed:users`
creates four demo logins, one per role, listed at the top of
`scripts/seed-users.ts`:

| | Role | |
| --- | --- | --- |
| Camillo | admin | `camillo@yunocrm.test` |
| Anna, Marco, Giulia | member | `anna@…`, `marco@…`, `giulia@…` |

Passwords are in that file. They are throwaway logins for a demo database and
are checked in deliberately, so the app can be tried without credentials being
sent around separately. Delete these accounts before pointing the schema at
anything real.

Accounts can also be added by hand in the Supabase Dashboard under
**Authentication → Users → Add user** with *Auto Confirm User* enabled; the
trigger from migration `0001` writes the matching profile row as a `member`.

## Database

Eight tables in `supabase/migrations/`, numbered in dependency order — nothing
references a table that a later file creates.

| | |
| --- | --- |
| `0001` | `users` — profile for an auth account, plus the trigger that creates one |
| `0002` | `pipeline_stages` |
| `0003`–`0004` | `organizations`, `persons` |
| `0005` | `deals` — the constraint-heavy one |
| `0006`–`0008` | `stage_transitions`, `activities`, `contracts` |
| `0009` | Row Level Security |
| `0010` | default pipeline stages |

Applying them:

```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```

If `db push` cannot connect, the direct database host (`db.<ref>.supabase.co`)
is IPv6-only and some networks have no route to it. Use the regional session
pooler instead, which answers on IPv4 — the connection string is in the
dashboard under **Connect → Session pooler**:

```bash
supabase db push --db-url "postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres"
```

Then the demo accounts — these cannot be SQL, because each one has to exist in
`auth.users` with a real password hash before a profile row can reference it:

```bash
npm run seed:users
```

Every rule lives in the database rather than in application code: role and
status are `CHECK`ed, a lost deal must carry a reason, a deal must have an
organization or a person, and the `ON DELETE` behaviour of each foreign key is
chosen per relationship. The reasoning is in comments in each migration.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed:users` | Create the demo accounts |

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
