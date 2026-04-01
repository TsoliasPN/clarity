# Development

Local setup and validation for Clarity.

## Prerequisites

- Node.js 20+
- A PostgreSQL `DATABASE_URL`

## Local setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

## Validation

```bash
npm run lint
npm run test
npm run typecheck
npm run migration:safe
```

## Notes

- `npx prisma migrate dev` is the local schema workflow.
- Keep schema changes paired with a migration and mention the migration impact in the PR.
- GitHub issues, milestones, and releases are the live source of truth for planning and delivery.
