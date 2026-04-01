# CLAUDE.md

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first. It is the canonical workflow
contract for this repository.

## Live source of truth

- GitHub issues and milestones
- GitHub Actions CI results
- GitHub releases

Do not answer milestone or release questions from markdown snapshots alone.

## Workflow reminders

- Reuse or create a GitHub issue before non-trivial implementation.
- Every non-trivial issue needs a milestone. Use `Backlog` when no thematic milestone fits.
- Create a correctly named branch before editing.
- Keep the PR title in Conventional Commit format so the final squash commit is compliant.
- Squash is the normal merge path. Rebase is a maintainer exception.
- Keep schema changes paired with a migration and call out the impact in the PR.

Quick prompt shorthand is defined in `CONTRIBUTING.md`:

- `start <task>`
- `record it`
- `publish it`
- `propose it`
- `land it`
- `ship it`
- `finish it`
- `finish it for #<id>`
