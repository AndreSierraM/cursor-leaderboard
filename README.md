# Cursor Leaderboard

**Live:** https://cursorrank.vercel.app

Open-source, **opt-in** usage ranking for [Cursor](https://cursor.com) public
profiles. Add your handle in the UI; the backend fetches your public profile
stats and ranks you against everyone else who joined.

Data comes from Cursor's public profile endpoint
(`get-public-profile-by-handle`) — only profiles set to **public** work, and only
the numbers Cursor already shows on `cursor.com/@<handle>`.

## Stack

- `apps/api` — NestJS API (Vercel serverless) + Neon Postgres
- `apps/web` — Next.js frontend (Vercel)

## Metrics ranked

Tokens (30-day, matches Cursor's headline number), agents (local + cloud),
current streak, longest streak. Top model is shown per user.

## Local dev

```bash
pnpm install
# api
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL
pnpm dev:api      # http://localhost:3001
# web
cp apps/web/.env.example apps/web/.env   # NEXT_PUBLIC_API_URL=http://localhost:3001
pnpm dev:web      # http://localhost:3000
```

Run API tests: `pnpm --filter @cl/api test`

## Deploy (Vercel + Neon)

1. **Neon**: create a Postgres DB, copy the connection string. The schema is
   created automatically on first request.
2. **API project**: import this repo in Vercel, set **Root Directory** to
   `apps/api`. Env vars: `DATABASE_URL`, `CRON_SECRET`, `WEB_ORIGIN`
   (your web URL). The daily cron in `vercel.json` refreshes all stats at 06:00 UTC.
3. **Web project**: import the same repo again, **Root Directory** `apps/web`.
   Env var: `NEXT_PUBLIC_API_URL` = the API project URL.

## Caveats

- The Cursor endpoint is undocumented and may change or rate-limit. Stats are
  cached in Postgres and only refreshed once daily to stay polite.
- Only public profiles are accepted; private/deleted handles are skipped on refresh.
