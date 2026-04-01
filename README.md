# CLARITY

AI-powered, multi-currency subscription manager and analytics starter.

Workflow policy lives in [`CONTRIBUTING.md`](./CONTRIBUTING.md). Local setup and
day-to-day commands live in [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## Quickstart

1. `cp .env.example .env` and set `DATABASE_URL`.
2. `npm install`.
3. `npx prisma migrate dev` to create or apply your local schema state.
4. `npm run prisma:seed` to load the demo user, FX cache, and sample subscriptions.
5. `npm run dev` and visit `http://localhost:3000`.

## What this repo does

- Prisma-backed subscription tracking with exchange rates, budgets, preferences, alerts, and audit logs.
- Normalization helpers and API routes for subscription CRUD, CSV import, rate refresh, and health checks.
- A dashboard landing page that visualizes normalized spend, categories, alerts, and FX-driven totals.
- Vitest coverage for the core normalization logic.

## Testing

- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run migration:safe`

## Deployment notes

- `DATABASE_URL` is required.
- `DEMO_USER_ID` is optional and only affects the local/demo fallback.
- Keep schema changes paired with a Prisma migration and update the workflow docs when the process changes.
