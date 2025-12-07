# CLARITY

AI-powered, multi-currency subscription manager and analytics starter.

## Quickstart
- `cp .env.example .env` and set `DATABASE_URL`
- `npm install`
- `npx prisma migrate dev --name init` (creates schema)
- `npm run prisma:seed` (demo user `demo-user`, base GBP, FX cache)
- `npm run dev` and visit http://localhost:3000 or `curl http://localhost:3000/api/subscriptions?userId=demo-user`

## What is ready
- Prisma schema with subscriptions, users, exchange rates, budgets, preferences, and alerts
- Seeded exchange rates, demo alerts, and realistic subscriptions across USD/EUR/GBP/JPY with weekly/quarterly/yearly cycles
- `/api/subscriptions` GET/POST/PATCH/DELETE with zod validation, FX normalization, monthly equivalents, category/status breakdowns, alerts included, and audit logging
- `/api/subscriptions/import` CSV preview + optional commit (`?commit=true`) with FX/billing-cycle normalization
- `/api/exchange-rates/refresh` to pull fresh USD-relative rates
- Landing page that visualizes normalized data + alerts, filters, category bars, CSV upload UI, and FX refresh action

## Next builds
1) Add full auth/session (NextAuth or middleware) and replace demo fallback
2) Add scheduled FX refresh + alert jobs (renewals, budgets, FX drift)
3) Add charts for MRR/ARR trends and CSV-driven insights
4) Add role-aware access and user profile editing
