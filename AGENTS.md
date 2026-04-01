# AGENTS.md

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first. It is the canonical workflow
contract for this repository.

## Repo map

- `app/` - Next.js app routes, UI, and API handlers
- `lib/` - shared runtime logic
- `prisma/` - Prisma schema, migrations, and seed data
- `samples/` - fixture data for manual and CSV-driven testing
- `tests/` - Vitest coverage
- `.github/` - GitHub templates, instructions, and CI
- `scripts/` - guardrail and validation scripts

## Live source of truth

GitHub is the live source of truth for:

- issues and milestones
- CI, release, and smoke-test runs
- releases

If a number or milestone in markdown does not match GitHub, GitHub wins.

## Before you edit

For any non-trivial task:

1. search for an existing GitHub issue
2. reuse it or create a new one
3. ensure the issue has a milestone
4. use `Backlog` when no thematic milestone fits
5. create a branch before editing

Canonical branch format lives in `CONTRIBUTING.md`:

```text
<actor>/<type>/<scope>/<task>-<id>
```

Do not implement non-trivial work directly on `main`.

## Hard engineering constraints

- Root-level API handlers and UI should stay aligned with the Prisma schema.
- Database/schema changes should ship with a migration and a PR note describing the impact.
- Keep workflow guidance in `CONTRIBUTING.md` instead of duplicating it here.

## Useful commands

```bash
npm run lint
npm run test
npm run typecheck
npm run migration:safe
```
