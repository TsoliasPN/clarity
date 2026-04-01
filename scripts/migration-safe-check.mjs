import { execSync } from 'node:child_process'

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function runPrismaValidate() {
  execSync('npx prisma validate', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/clarity'
    }
  })
}

function changedFiles() {
  const baseRef = process.env.BASE_REF || process.env.GITHUB_BASE_REF
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

function schemaDiff() {
  const baseRef = process.env.BASE_REF || process.env.GITHUB_BASE_REF
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
      return run(`git diff --unified=0 ${range} -- prisma/schema.prisma`)
    } catch {
      // Try the next range.
    }
  }

  return ''
}

function isRelationOnlySchemaChange(diffText) {
  const relationFieldLine = /^[+-]\s*[A-Za-z_]\w*\s+[A-Z]\w*(?:\[\]|\?)?(?:\s+@relation\(.*\))?\s*$/
  const changedLines = diffText
    .split(/\r?\n/)
    .filter((line) => /^[+-]/.test(line))
    .filter((line) => !/^\+\+\+|^---/.test(line))
    .map((line) => line.trim())
    .filter((line) => line !== '+' && line !== '-')
    .filter((line) => !/^[+-]\s*(\/\/|@@|model\s|enum\s|generator\s|datasource\s)/.test(line))

  return changedLines.length > 0 && changedLines.every((line) => relationFieldLine.test(line))
}

const files = changedFiles()
const diff = schemaDiff()
const schemaChanged = files.some((file) => file === 'prisma/schema.prisma')
const migrationChanged = files.some((file) => file.startsWith('prisma/migrations/'))
const errors = []

try {
  runPrismaValidate()
} catch (error) {
  errors.push('Prisma schema validation failed.')
}

if (schemaChanged && !migrationChanged && !isRelationOnlySchemaChange(diff)) {
  errors.push(
    'Schema changes must include a Prisma migration under prisma/migrations/, unless the diff is relation-only and does not affect the database schema.'
  )
}

if (errors.length > 0) {
  console.error('Migration-safe checks failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Migration-safe checks passed.')
