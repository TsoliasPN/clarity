import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'
import { CycleType, Status } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  normalizeSubscription,
  parseDecimal,
  coerceIsoDate,
  enforceCurrency
} from '@/lib/subscriptions'
import { loadUserContext, resolveUserId, badRequest } from '@/lib/api-helpers'

const costSchema = z
  .union([z.number(), z.string()])
  .transform((val) => {
    const num = typeof val === 'string' ? Number(val) : val
    if (!Number.isFinite(num)) throw new Error('Invalid cost')
    return num
  })
  .refine((num) => num >= 0, 'Cost must be positive')

const dateSchema = z.union([z.string(), z.date()]).transform(coerceIsoDate)
const currencySchema = z.string().min(3).max(3).transform(enforceCurrency)

const importRowSchema = z
  .object({
    name: z.string().min(1),
    provider: z.string().optional().nullable(),
    cost: costSchema,
    currency: currencySchema,
    billingCycle: z.nativeEnum(CycleType).default(CycleType.MONTHLY),
    startDate: dateSchema.optional(),
    nextBillDate: dateSchema.optional(),
    status: z.nativeEnum(Status).default(Status.ACTIVE),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable()
  })
  .transform((row) => {
    const next = row.nextBillDate ?? row.startDate ?? new Date()
    const start = row.startDate ?? next
    return {
      ...row,
      startDate: start,
      nextBillDate: next,
      status: row.status ?? Status.ACTIVE
    }
  })

export async function POST(request: Request) {
  try {
    const userId = resolveUserId(request)
    if (!userId) return badRequest('Missing userId')

    const context = await loadUserContext(userId)
    if (!context) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const url = new URL(request.url)
    const shouldCommit = url.searchParams.get('commit') === 'true'

    const csvText = await request.text()
    if (!csvText.trim()) return badRequest('CSV payload is empty')

    let rows: any[]
    try {
      rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
    } catch (err) {
      return badRequest('Unable to parse CSV')
    }

    const previews = []
    const errors: { row: number; message: string }[] = []
    const validRows: Awaited<ReturnType<typeof importRowSchema['parse']>>[] = []

    rows.forEach((row, index) => {
      try {
        const parsed = importRowSchema.parse(row)
        validRows.push(parsed)
        const stub = normalizeSubscription(
          {
            id: `preview-${index}`,
            userId,
            name: parsed.name,
            provider: parsed.provider ?? '',
            cost: parseDecimal(parsed.cost),
            currency: parsed.currency,
            billingCycle: parsed.billingCycle,
            startDate: parsed.startDate,
            nextBillDate: parsed.nextBillDate,
            status: parsed.status,
            category: parsed.category ?? undefined,
            description: parsed.description ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          context.user.baseCurrency,
          context.rateMap
        )
        previews.push(stub)
      } catch (err: any) {
        const message = err instanceof z.ZodError ? err.errors.map((e) => e.message).join('; ') : 'Invalid row'
        errors.push({ row: index + 1, message })
      }
    })

    let createdCount = 0
    if (shouldCommit && validRows.length > 0) {
      await prisma.$transaction(
        validRows.map((row) =>
          prisma.subscription.create({
            data: {
              ...row,
              userId,
              cost: parseDecimal(row.cost),
              currency: enforceCurrency(row.currency),
              startDate: row.startDate,
              nextBillDate: row.nextBillDate,
              status: row.status ?? Status.ACTIVE
            }
          })
        )
      )
      createdCount = validRows.length
    }

    return NextResponse.json({
      preview: previews,
      stats: {
        totalRows: rows.length,
        valid: validRows.length,
        invalid: errors.length,
        created: createdCount,
        committed: shouldCommit
      },
      errors
    })
  } catch (error) {
    console.error('Import API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
