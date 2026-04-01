import { execSync } from 'node:child_process'

const BRANCH_RE = /^(codex|claude|copilot|gemini|local|human)\/(feat|fix|refactor|chore|docs|test|perf)\/(frontend|api|db|auth|infra|docs|shared)\/[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/
const TITLE_RE = /^(feat|fix|refactor|chore|docs|test|perf)\((frontend|api|db|auth|infra|docs|shared)\): .+/

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function argValue(name) {
  const prefix = `--${name}=`
  const withEquals = process.argv.find((value) => value.startsWith(prefix))
  if (withEquals) {
    return withEquals.slice(prefix.length)
  }

  const index = process.argv.indexOf(`--${name}`)
  if (index >= 0) {
    return process.argv[index + 1] ?? ''
  }

  return ''
}

function currentBranch() {
  return (
    process.env.BRANCH_NAME ||
    argValue('branch') ||
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    run('git branch --show-current')
  )
}

function changedFiles() {
  const baseRef = process.env.BASE_REF || argValue('base-ref')
  const ranges = []

  if (baseRef) {
    ranges.push(`${baseRef}...HEAD`)
    if (!baseRef.startsWith('origin/')) {
      ranges.push(`origin/${baseRef}...HEAD`)
    }
  } else {
    ranges.push('origin/main...HEAD', 'main...HEAD')
  }

  for (const range of ranges) {
    try {
      const output = run(`git diff --name-only ${range}`)
      return output ? output.split(/\r?\n/).filter(Boolean) : []
    } catch {
      // Try the next range.
    }
  }

  return []
}

function hasLinkedIssue(body) {
  return /(?:Fix|Close|Resolve)s?\s+#\d+|Linked issue:\s*#\d+/i.test(body)
}

function isDocsOnly(files) {
  return files.length > 0 && files.every((file) => /\.(md|txt)$/i.test(file))
}

const errors = []
const branch = currentBranch()
const title = process.env.PR_TITLE || argValue('title')
const body = process.env.PR_BODY || argValue('body')
const files = changedFiles()

if (branch && branch !== 'main' && !BRANCH_RE.test(branch)) {
  errors.push(
    `Branch "${branch}" does not match the canonical pattern <actor>/<type>/<scope>/<task>-<id>.`
  )
}

if (title && !TITLE_RE.test(title)) {
  errors.push(
    `PR title "${title}" must use Conventional Commit format: <type>(<scope>): <description>.`
  )
}

if (body) {
  if (!hasLinkedIssue(body) && !isDocsOnly(files)) {
    errors.push('PR body must link the issue or use a docs-only exception.')
  }

  if (/prisma\/schema\.prisma|prisma\/migrations\//i.test(files.join('\n'))) {
    if (!/database\s*\/\s*schema impact/i.test(body) || /No database or schema changes/i.test(body)) {
      errors.push(
        'PR body must describe the database/schema impact when Prisma schema or migration files change.'
      )
    }
  }
}

if (errors.length > 0) {
  console.error('Contribution guardrails failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Contribution guardrails passed.')
