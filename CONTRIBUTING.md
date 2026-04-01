# Contributing to Clarity

`CONTRIBUTING.md` is the canonical workflow contract for this repository.
Agent-specific files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md` should point here instead of redefining the
process.

## Source of truth

- GitHub is the live source of truth for issues, milestones, CI runs, and releases.
- `README.md` is the repo orientation layer.
- `DEVELOPMENT.md` is the local setup and runtime guide.

## Non-trivial changes are issue-first

Treat the following as non-trivial and route them through a GitHub issue before
implementation:

- frontend, API, auth, database, schema, migration, infrastructure, docs, or workflow changes
- refactors, test/tooling work, or repo-admin changes that affect delivery
- changes to `.github/` surfaces, CI, or branch protection

Only a narrow docs-only exception may skip issue creation.

### Required workflow

1. Search GitHub issues and milestones first.
2. Reuse an existing issue if it already covers the work.
3. If no matching issue exists, create one before implementation starts.
4. Every non-trivial issue must have a milestone:
   - Use an existing thematic milestone when it clearly fits.
   - Use `Backlog` when no thematic milestone fits.
   - Create a new thematic milestone only for a genuine new workstream or roadmap bucket.
5. Create a work branch from `main` using the canonical naming scheme.
6. Implement the change and run the relevant validation.
7. Open a pull request with the required template fields completed.
8. Merge with squash as the normal path. Rebase is a maintainer-only exception.

Agents should create missing issues and milestones automatically when the work
requires them. Do not start non-trivial implementation directly on `main`.

## Quick agent prompts

These are shorthand prompts you can use with coding agents. They are not shell
commands.

- `start <task>`: issue + milestone + branch, then begin work
- `record it`: commit current changes
- `publish it`: push current branch
- `propose it`: open or update the PR
- `land it`: squash-merge the PR after checks and approval
- `ship it`: commit + push + PR
- `finish it`: commit + push + PR + merge
- `finish it for #<id>`: canonical full-flow shorthand tied to an issue

## Branch naming

Canonical branch format:

```text
<actor>/<type>/<scope>/<task>-<id>
```

Rules:

- all segments must be lowercase and kebab-case
- `<id>` is mandatory
- keep names concise
- use `shared` only when no single domain clearly dominates the work

Allowed values:

| Segment | Allowed values |
|---|---|
| `actor` | `codex`, `claude`, `copilot`, `gemini`, `local`, `human` |
| `type` | `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf` |
| `scope` | `frontend`, `api`, `db`, `auth`, `infra`, `docs`, `shared` |

Examples:

- `codex/chore/shared/contribution-operating-system-1`
- `human/docs/docs/workflow-clarity-12`

## Commits and pull requests

Intermediate commit messages are not a blocking policy surface.

The enforced Conventional Commit format applies to:

- the pull request title
- the final squash commit message

Required format:

```text
<type>(<scope>): <description>
```

Allowed `type` and `scope` values match the branch naming tables above.

### PR requirements

Every normal PR must include:

- a linked issue
- a short summary of what changed and why
- the affected scope
- the validation that was run
- a database/schema impact note when Prisma files or migrations changed

Conditionally required:

- screenshots or preview evidence for visible UI changes
- docs impact when behavior or contributor flow changed
- rollback notes for risky or production-impacting changes

### Trivial docs-only exception

Issue-less PRs are allowed only when every changed file is limited to Markdown or
plain text docs and the PR does not touch any of the following:

- workflows
- configs
- schemas
- scripts
- code-bearing paths

Use the PR template checkboxes to declare this exception explicitly.

## Merge policy

- `main` is the integration branch.
- Squash merge is the normal and documented merge path.
- Rebase merge remains available only as a maintainer exception.
- Merge commits should stay disabled.

## Required checks

The branch protection baseline is:

- `Contribution guardrails`
- `Lint / test`
- `Typecheck`
- `Migration-safe checks`

## Repo-specific engineering constraints

- GitHub is the live tracker; do not answer milestone or release questions from markdown snapshots alone.
- Schema changes should ship with a Prisma migration and keep `prisma/schema.prisma` aligned with the migration history.
- Keep database/schema impact explicit in PRs and workflow checks.

## Useful commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run typecheck
npm run migration:safe
npx prisma migrate dev
```
