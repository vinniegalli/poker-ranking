import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD not configured')
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

/** Gera o valor do cookie de sessão admin: expiração assinada com HMAC. */
export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + ADMIN_COOKIE_MAX_AGE * 1000
  const payload = String(expiresAt)
  return `${payload}.${sign(payload)}`
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = sign(payload)
  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (signatureBuf.length !== expectedBuf.length) return false
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return false

  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && Date.now() < expiresAt
}

export function isAdminRequest(req: NextRequest): boolean {
  return isValidToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
}

/** Retorna uma resposta 401 se o request não tiver uma sessão admin válida, senão null. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  return null
}
