import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CycleType, Status } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  normalizeSubscription,
  summarizeNormalized,
  parseDecimal,
  coerceIsoDate,
  enforceCurrency
} from '@/lib/subscriptions'
import { loadUserContext, resolveUserId, badRequest, logAudit } from '@/lib/api-helpers'

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

const subscriptionCreateSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  cost: costSchema,
  currency: currencySchema,
  billingCycle: z.nativeEnum(CycleType),
  startDate: dateSchema,
  nextBillDate: dateSchema,
  status: z.nativeEnum(Status).default(Status.ACTIVE),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable()
})

const subscriptionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  cost: costSchema.optional(),
  currency: currencySchema.optional(),
  billingCycle: z.nativeEnum(CycleType).optional(),
  startDate: dateSchema.optional(),
  nextBillDate: dateSchema.optional(),
  status: z.nativeEnum(Status).optional(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable()
})

export async function GET(request: Request) {
  try {
    const userId = resolveUserId(request)
    if (!userId) return badRequest('Missing user')

    const context = await loadUserContext(userId)
    if (!context) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [subscriptions, alerts, ratesMeta] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId },
        orderBy: { nextBillDate: 'asc' }
      }),
      prisma.alert.findMany({
        where: { userId },
        orderBy: { triggerDate: 'asc' },
        take: 20
      }),
      prisma.exchangeRate.aggregate({
        _max: { lastUpdated: true },
        _count: { currencyCode: true }
      })
    ])

    const missingRates = new Set<string>()
    const normalized = subscriptions.map((sub) => {
      const result = normalizeSubscription(sub, context.user.baseCurrency, context.rateMap)
      result.missingRates.forEach((code) => missingRates.add(code))
      return result
    })

    const summary = summarizeNormalized(normalized)

    return NextResponse.json({
      data: normalized,
      alerts,
      meta: {
        baseCurrency: context.user.baseCurrency,
        ...summary,
        count: normalized.length,
        missingRates: Array.from(missingRates),
        fxLastUpdated: ratesMeta._max.lastUpdated,
        fxCount: ratesMeta._count.currencyCode
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = resolveUserId(request)
    if (!userId) return badRequest('Missing user')

    const context = await loadUserContext(userId)
    if (!context) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const parsed = subscriptionCreateSchema.parse(body)

    const created = await prisma.subscription.create({
      data: {
        ...parsed,
        userId,
        cost: parseDecimal(parsed.cost),
        currency: enforceCurrency(parsed.currency),
        startDate: parsed.startDate,
        nextBillDate: parsed.nextBillDate,
        status: parsed.status ?? Status.ACTIVE
      }
    })

    await logAudit({
      userId,
      subscriptionId: created.id,
      action: 'SUBSCRIPTION_CREATED',
      payload: parsed
    })

    const normalized = normalizeSubscription(created, context.user.baseCurrency, context.rateMap)

    return NextResponse.json({ data: normalized }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.errors.map((e) => e.message).join('; '))
    }
    console.error('API Error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = resolveUserId(request)
    if (!userId) return badRequest('Missing user')

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return badRequest('Missing subscription id')

    const context = await loadUserContext(userId)
    if (!context) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await prisma.subscription.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = subscriptionUpdateSchema.parse(body)

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...parsed,
        cost: parsed.cost !== undefined ? parseDecimal(parsed.cost) : undefined,
        currency: parsed.currency ? enforceCurrency(parsed.currency) : undefined,
        startDate: parsed.startDate,
        nextBillDate: parsed.nextBillDate
      }
    })

    await logAudit({
      userId,
      subscriptionId: id,
      action: 'SUBSCRIPTION_UPDATED',
      payload: parsed
    })

    const normalized = normalizeSubscription(updated, context.user.baseCurrency, context.rateMap)
    return NextResponse.json({ data: normalized })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(error.errors.map((e) => e.message).join('; '))
    }
    console.error('API Error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = resolveUserId(request)
    if (!userId) return badRequest('Missing user')

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return badRequest('Missing subscription id')

    const existing = await prisma.subscription.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    await prisma.subscription.delete({ where: { id } })
    await logAudit({
      userId,
      subscriptionId: id,
      action: 'SUBSCRIPTION_DELETED'
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } }, { status: 500 })
  }
}
