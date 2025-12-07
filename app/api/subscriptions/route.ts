import { NextResponse } from 'next/server'
import { CycleType, Subscription } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type RateMap = Record<string, number>

const MONTHLY_MULTIPLIER: Record<CycleType, number> = {
  WEEKLY: 52 / 12, // weekly -> monthly approximation
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12
}

function resolveUserId(request: Request): string | null {
  const url = new URL(request.url)
  return (
    url.searchParams.get('userId') ||
    request.headers.get('x-user-id') ||
    process.env.DEMO_USER_ID ||
    null
  )
}

function normalizeCurrency(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  rates: RateMap
) {
  const missing: string[] = []
  const sourceRate = rates[sourceCurrency]
  const targetRate = rates[targetCurrency]

  if (!sourceRate) missing.push(sourceCurrency)
  if (!targetRate) missing.push(targetCurrency)

  if (missing.length) {
    return { amount, converted: false, missing }
  }

  const usdValue = amount / sourceRate
  const normalized = usdValue * targetRate

  return { amount: normalized, converted: true, missing }
}

export async function GET(request: Request) {
  try {
    const userId = resolveUserId(request)

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const [user, subscriptions, rates] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true }
      }),
      prisma.subscription.findMany({
        where: { userId },
        orderBy: { nextBillDate: 'asc' }
      }),
      prisma.exchangeRate.findMany()
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rateMap: RateMap = { USD: 1 }
    rates.forEach((rate) => {
      rateMap[rate.currencyCode] = rate.rateToUSD.toNumber()
    })

    const missingRates = new Set<string>()

    const normalizedSubscriptions = subscriptions.map((sub) => {
      const sourceCurrency = sub.currency
      const targetCurrency = user.baseCurrency
      const cost = sub.cost.toNumber()

      const { amount: normalizedCostRaw, converted, missing } = normalizeCurrency(
        cost,
        sourceCurrency,
        targetCurrency,
        rateMap
      )

      missing.forEach((code) => missingRates.add(code))

      const monthlyMultiplier = MONTHLY_MULTIPLIER[sub.billingCycle] ?? 1
      const normalizedCost = Number(normalizedCostRaw.toFixed(2))
      const normalizedMonthlyCost = Number(
        (normalizedCostRaw * monthlyMultiplier).toFixed(2)
      )

      return {
        ...sub,
        cost,
        normalizedCost,
        normalizedMonthlyCost,
        wasConverted: converted,
        displayNote:
          converted && sourceCurrency !== targetCurrency
            ? `Approx ${targetCurrency} ${normalizedCost.toFixed(
                2
              )} (${sourceCurrency}->${targetCurrency})`
            : null
      }
    })

    const totalMonthlySpend = normalizedSubscriptions.reduce(
      (sum, sub) => sum + sub.normalizedMonthlyCost,
      0
    )

    const spendByCategory = normalizedSubscriptions.reduce(
      (acc, sub) => {
        const category = sub.category ?? 'Uncategorized'
        acc[category] = Number(
          ((acc[category] ?? 0) + sub.normalizedMonthlyCost).toFixed(2)
        )
        return acc
      },
      {} as Record<string, number>
    )

    const statusCounts = normalizedSubscriptions.reduce(
      (acc, sub) => {
        acc[sub.status] = (acc[sub.status] ?? 0) + 1
        return acc
      },
      {} as Record<Subscription['status'], number>
    )

    return NextResponse.json({
      data: normalizedSubscriptions,
      meta: {
        baseCurrency: user.baseCurrency,
        totalMonthlySpend: Number(totalMonthlySpend.toFixed(2)),
        count: normalizedSubscriptions.length,
        missingRates: Array.from(missingRates),
        spendByCategory,
        statusCounts
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
