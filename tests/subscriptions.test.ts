import { describe, expect, it } from 'vitest'
import { MONTHLY_MULTIPLIER, normalizeCurrency, normalizeSubscription } from '@/lib/subscriptions'

describe('billing multipliers', () => {
  it('maps cycles to monthly equivalents', () => {
    expect(MONTHLY_MULTIPLIER.WEEKLY).toBeCloseTo(52 / 12)
    expect(MONTHLY_MULTIPLIER.MONTHLY).toBe(1)
    expect(MONTHLY_MULTIPLIER.QUARTERLY).toBeCloseTo(1 / 3)
    expect(MONTHLY_MULTIPLIER.YEARLY).toBeCloseTo(1 / 12)
  })
})

describe('normalizeCurrency', () => {
  const rates = { USD: 1, EUR: 0.5 }

  it('converts when both rates exist', () => {
    const res = normalizeCurrency(10, 'EUR', 'USD', rates)
    expect(res.converted).toBe(true)
    expect(res.amount).toBeCloseTo(20)
    expect(res.missing).toHaveLength(0)
  })

  it('returns missing when rates unavailable', () => {
    const res = normalizeCurrency(10, 'GBP', 'USD', rates)
    expect(res.converted).toBe(false)
    expect(res.missing).toContain('GBP')
  })
})

describe('normalizeSubscription', () => {
  const rates = { USD: 1, EUR: 0.5 }
  const baseSub = {
    id: '1',
    userId: 'u',
    name: 'Test',
    provider: 'Prov',
    cost: 10 as any,
    currency: 'EUR',
    billingCycle: 'MONTHLY' as any,
    startDate: new Date(),
    nextBillDate: new Date(),
    status: 'ACTIVE' as any,
    category: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('calculates normalized monthly cost', () => {
    const res = normalizeSubscription(baseSub as any, 'USD', rates)
    expect(res.normalizedMonthlyCost).toBeCloseTo(20)
    expect(res.wasConverted).toBe(true)
  })

  it('includes missing rates when absent', () => {
    const res = normalizeSubscription(baseSub as any, 'GBP', rates)
    expect(res.missingRates).toContain('GBP')
  })
})
