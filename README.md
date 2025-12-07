# CLARITY

AI-powered, multi-currency subscription manager and analytics starter.

## Quickstart
- `cp .env.example .env` and set `DATABASE_URL`
- `npm install`
- `npx prisma migrate dev --name init` (creates schema)
- `npm run prisma:seed` (demo user `demo-user`, base GBP, FX cache)
- `npm run dev` and visit http://localhost:3000 or `curl http://localhost:3000/api/subscriptions?userId=demo-user`

## What is ready
- Prisma schema with subscriptions, users, exchange rates, budgets, preferences
- Seeded exchange rates and realistic demo subscriptions across USD/EUR/GBP/JPY/weekly/quarterly/yearly cycles
- `/api/subscriptions` GET that normalizes costs into a user base currency and monthly equivalents with category/status breakdowns
- Landing page highlighting API entry point and backlog anchors

## Next builds
1) Add auth/session and replace `userId` query param fallback
2) POST/PUT/DELETE endpoints with validation (zod) and audit logging
3) CSV import flow with FX normalization and preview
4) Alerts and budget monitors (renewals, overages, FX drift)
5) Dashboard UI (TanStack Query + charts) wired to the normalized API
