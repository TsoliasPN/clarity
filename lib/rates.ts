import { prisma } from './prisma'

const DEFAULT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'HKD',
  'NZD',
  'SEK',
  'KRW',
  'SGD',
  'NOK',
  'MXN',
  'INR',
  'ZAR',
  'TRY',
  'BRL'
]

export async function fetchLatestUsdRates() {
  const resp = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
  if (!resp.ok) throw new Error(`FX API failed: ${resp.status}`)
  const json = await resp.json()
  if (!json?.rates) throw new Error('FX payload missing rates')
  return json.rates as Record<string, number>
}

export async function refreshExchangeRates(currencies = DEFAULT_CURRENCIES) {
  const rates = await fetchLatestUsdRates()
  const now = new Date()

  const updates = currencies
    .filter((code) => rates[code])
    .map((code) =>
      prisma.exchangeRate.upsert({
        where: { currencyCode: code },
        update: { rateToUSD: rates[code], lastUpdated: now },
        create: { currencyCode: code, rateToUSD: rates[code], lastUpdated: now }
      })
    )

  await Promise.all(updates)
  return { updated: updates.length, lastUpdated: now }
}
