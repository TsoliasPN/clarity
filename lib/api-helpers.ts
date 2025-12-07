import { NextResponse } from 'next/server'
import { prisma } from './prisma'
import { buildRateMap } from './subscriptions'

function parseCookie(header: string | null, key: string) {
  if (!header) return null
  const cookies = header.split(';').map((c) => c.trim())
  const match = cookies.find((c) => c.startsWith(`${key}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

export function resolveUserId(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  const cookieUser = parseCookie(cookieHeader, 'clarity_user_id')
  return request.headers.get('x-user-id') || cookieUser || process.env.DEMO_USER_ID || null
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export async function loadUserContext(userId: string) {
  const [user, rates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true }
    }),
    prisma.exchangeRate.findMany()
  ])
  if (!user) return null
  return { user, rateMap: buildRateMap(rates) }
}

export async function logAudit(params: {
  userId: string
  subscriptionId?: string
  action: string
  payload?: any
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        action: params.action,
        payload: params.payload
      }
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}
