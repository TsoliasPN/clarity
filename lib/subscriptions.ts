import { Prisma, CycleType, Status, Subscription, ExchangeRate } from '@prisma/client'

export type RateMap = Record<string, number>

export const MONTHLY_MULTIPLIER: Record<CycleType, number> = {
  WEEKLY: 52 / 12, // weekly -> monthly approximation
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12
}

export type NormalizedSubscription = Subscription & {
  cost: number
  normalizedCost: number
  normalizedMonthlyCost: number
  wasConverted: boolean
  displayNote: string | null
}

export function buildRateMap(rates: Pick<ExchangeRate, 'currencyCode' | 'rateToUSD'>[]): RateMap {
  const rateMap: RateMap = { USD: 1 }
  rates.forEach((rate) => {
    rateMap[rate.currencyCode] = Number(rate.rateToUSD)
  })
  return rateMap
}

export function normalizeCurrency(
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

export function normalizeSubscription(
  sub: Subscription,
  baseCurrency: string,
  rates: RateMap
): NormalizedSubscription & { missingRates: string[] } {
  const sourceCurrency = sub.currency
  const targetCurrency = baseCurrency
  const cost = Number(sub.cost)

  const { amount: normalizedCostRaw, converted, missing } = normalizeCurrency(
    cost,
    sourceCurrency,
    targetCurrency,
    rates
  )

  const monthlyMultiplier = MONTHLY_MULTIPLIER[sub.billingCycle] ?? 1
  const normalizedCost = Number(normalizedCostRaw.toFixed(2))
  const normalizedMonthlyCost = Number((normalizedCostRaw * monthlyMultiplier).toFixed(2))

  return {
    ...sub,
    cost,
    normalizedCost,
    normalizedMonthlyCost,
    wasConverted: converted,
    displayNote:
      converted && sourceCurrency !== targetCurrency
        ? `Approx ${targetCurrency} ${normalizedCost.toFixed(2)} (${sourceCurrency}->${targetCurrency})`
        : null,
    missingRates: missing
  }
}

export function summarizeNormalized(subs: NormalizedSubscription[]) {
  const spendByCategory = subs.reduce((acc, sub) => {
    const category = sub.category ?? 'Uncategorized'
    acc[category] = Number(((acc[category] ?? 0) + sub.normalizedMonthlyCost).toFixed(2))
    return acc
  }, {} as Record<string, number>)

  const statusCounts = subs.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] ?? 0) + 1
    return acc
  }, {} as Record<Subscription['status'], number>)

  const totalMonthlySpend = subs.reduce((sum, sub) => sum + sub.normalizedMonthlyCost, 0)

  return {
    totalMonthlySpend: Number(totalMonthlySpend.toFixed(2)),
    spendByCategory,
    statusCounts
  }
}

export function parseDecimal(value: number | string) {
  return new Prisma.Decimal(typeof value === 'string' ? value : value.toString())
}

export function coerceIsoDate(value: string | Date) {
  return typeof value === 'string' ? new Date(value) : value
}

export function enforceCurrency(code: string) {
  return code.trim().toUpperCase()
}
