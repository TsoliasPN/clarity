import { NextResponse } from 'next/server'
import { refreshExchangeRates } from '@/lib/rates'

const WINDOW_MS = 60_000
const LIMIT = 10
const hits = new Map<string, number[]>()

function rateLimit(key: string) {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  const timestamps = hits.get(key)?.filter((t) => t > windowStart) ?? []
  if (timestamps.length >= LIMIT) return false
  timestamps.push(now)
  hits.set(key, timestamps)
  return true
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.FX_REFRESH_API_KEY
    if (apiKey) {
      const provided = request.headers.get('x-api-key')
      if (provided !== apiKey) {
        return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, { status: 401 })
      }
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 })
    }

    const result = await refreshExchangeRates()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('FX refresh failed:', error)
    return NextResponse.json({ error: { code: 'FX_REFRESH_FAILED', message: 'FX refresh failed' } }, { status: 500 })
  }
}
