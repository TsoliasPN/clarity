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

const files = changedFiles()
const schemaChanged = files.some((file) => file === 'prisma/schema.prisma')
const migrationChanged = files.some((file) => file.startsWith('prisma/migrations/'))
const errors = []

try {
  runPrismaValidate()
} catch (error) {
  errors.push('Prisma schema validation failed.')
}

if (schemaChanged && !migrationChanged) {
  errors.push('Schema changes must include a Prisma migration under prisma/migrations/.')
}

if (errors.length > 0) {
  console.error('Migration-safe checks failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Migration-safe checks passed.')
