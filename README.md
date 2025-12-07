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
- `/api/health` for uptime checks (pings DB)
- Landing page that visualizes normalized data + alerts, filters, category bars, CSV upload UI, and FX refresh action
- Sample CSV: `samples/demo-subscriptions.csv`

## Next builds
1) Add full auth/session (NextAuth or middleware) and replace demo fallback
2) Add scheduled FX refresh + alert jobs (renewals, budgets, FX drift)
3) Add charts for MRR/ARR trends and CSV-driven insights
4) Add role-aware access and user profile editing

## Deployment (Vercel + Postgres)
- Required env vars: `DATABASE_URL` (postgres connection string), `DEMO_USER_ID` (optional demo fallback). Add auth secrets once authentication is wired.
- Build commands (Vercel defaults): `npm install`, `npm run build`. Ensure `prisma generate` runs (Next.js does this during build).
- One-off after first deploy: `npx prisma migrate deploy` then `npx prisma db seed` (only if you want demo data/FX cache). You can run these via Vercel CLI or a temporary build command, then revert to normal build.
- Postgres options: Supabase, Neon, or RDS. Ensure public outbound is allowed for `/api/exchange-rates/refresh` (calls open.er-api.com). If outbound is blocked, seed FX rates manually.
- Smoke test routes after deploy: `/` dashboard, `/api/subscriptions`, `/api/subscriptions/import`, `/api/exchange-rates/refresh`, `/api/health`.

## Testing
- `npm run test` (vitest) for normalization math
- `npm run lint` for Next/TypeScript linting
