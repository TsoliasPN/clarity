# GEMINI.md

Use [`CONTRIBUTING.md`](./CONTRIBUTING.md) as the canonical workflow contract
for this repository.

## Live source of truth

- GitHub issues and milestones
- CI, release, and smoke-test runs
- releases

`README.md` and `DEVELOPMENT.md` are orientation layers, not the live tracker.

## Agent rules

- Reuse or create a GitHub issue before non-trivial implementation.
- Every non-trivial issue needs a milestone. Use `Backlog` when no thematic milestone fits.
- Create a correctly named branch before editing: `actor/type/scope/task-id`.
- Keep PR titles in Conventional Commit format so the final squash commit is compliant.
- Normal merge path is squash. Rebase is maintainer-only.
- Call out Prisma migration impact when schema files change.

Quick prompt shorthand is defined in `CONTRIBUTING.md`:

- `start <task>`
- `record it`
- `publish it`
- `propose it`
- `land it`
- `ship it`
- `finish it`
- `finish it for #<id>`

Shared agent execution protocol: see the `Agent execution protocol` section in `AGENTS.md`.

## CI Action Failure & Guardrail Rules

- On any CI/Action failure, extract logs via `gh run view <run_id> --log-failed`, identify root cause, and implement pre-flight prevention.
