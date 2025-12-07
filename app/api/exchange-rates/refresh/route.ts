import { NextResponse } from 'next/server'
import { refreshExchangeRates } from '@/lib/rates'

export async function GET() {
  try {
    const result = await refreshExchangeRates()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('FX refresh failed:', error)
    return NextResponse.json({ error: 'FX refresh failed' }, { status: 500 })
  }
}
