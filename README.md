# Badd Boys

An Icelandic-language PWA for a weekly 2v2 badminton group. Log match results
courtside, and browse statistics across a winter season.

See [SPEC.md](SPEC.md) for the decisions behind it.

## Running locally

The project ships its own Postgres on port **5433** (5432 is often taken).

```bash
docker compose up -d
docker exec -i badd-boys-postgres psql -U badd -d badd_boys < db/schema.sql
pnpm install
pnpm dev
```

Then open http://localhost:3210 and enter the group code from `.env.local`.

Copy `.env.example` to `.env.local` and fill it in:

```
DATABASE_URL=postgres://badd:badd@127.0.0.1:5433/badd_boys
GROUP_CODE=whatever-you-like
```

`.env.local` is gitignored. Keep the real code out of the repo — it is the only
thing standing between the group's data and a passer-by.

Use `127.0.0.1` rather than `localhost` — resolving to `::1` first makes the
connection hang, since the container publishes on IPv4.

### Handy database commands

```bash
docker exec -i badd-boys-postgres psql -U badd -d badd_boys < db/seed-demo.sql
```

Loads a fake group and two evenings, including a nine-win personal run, so every
screen has something to show. `db/reset.sql` empties everything again.

### Tests

```bash
pnpm vitest run
```

The suite covers the streak engine — pair runs, honors at three and six, and
personal streaks surviving a rest but not a loss.

## Deploying

The Vercel CLI on this machine is not logged in yet, so deployment needs one
interactive step from you:

```bash
vercel login
```

Then, from the project root:

```bash
vercel link
vercel integration add neon
```

Any Marketplace Postgres works — Neon and Supabase both set `DATABASE_URL`
automatically. After provisioning, apply the schema to the hosted database and
set the group code:

```bash
vercel env pull .env.production.local
psql "$(grep DATABASE_URL .env.production.local | cut -d= -f2- | tr -d '"')" -f db/schema.sql
vercel env add GROUP_CODE
vercel deploy --prod
```

Install it on a phone from the deployed URL: Share → Add to Home Screen.

## How it fits together

- `src/lib/domain/` — pure functions over the match log. Wins, streaks, honors
  and every statistic are **derived at read time**, never stored, so correcting
  a match in week three silently fixes the season table with no backfill.
  - `types.ts` — the match shape and the small predicates over it.
  - `streaks.ts` — pair runs, the three-in-a-row honor, personal streaks.
  - `stats.ts` — leaderboard, pair chemistry, head-to-head, records.
- `src/lib/repo.ts` — all SQL. Loads a whole season into memory, which is fine
  at a few hundred matches a year and keeps derivation in one testable place.
- `src/app/actions.ts` — every write, validated with zod before it reaches SQL.
- `src/proxy.ts` — the shared group code gate. Not authentication: it just keeps
  the URL from being useful to a stranger.

### Rules encoded in the app

- A game runs **to 11, win by 2, no cap**. Enforced both in zod and as a check
  constraint, so a bad score cannot reach the table by any route.
- **Winners keep the court** — pre-filled on the next-match form.
- A pair winning **three straight** earns the honor and must split. The app
  **warns but never blocks** if you pair them again: rotation is decided by
  humans, and varies with how many turned up.
