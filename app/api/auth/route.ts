import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME, createAdminSessionToken, isAdminRequest } from '@/lib/admin-server'

export const dynamic = 'force-dynamic'

/**
 * Diz se o cookie de admin (httpOnly, 30 dias) deste navegador ainda é válido.
 * Se for, renova por mais 30 dias (sessão deslizante): quem usa o app não é
 * deslogado no meio de um jogo só porque o login completou 30 dias.
 */
export async function GET(req: NextRequest) {
  const admin = isAdminRequest(req)
  const res = NextResponse.json({ admin }, { headers: { 'Cache-Control': 'no-store' } })
  if (admin) setAdminCookie(res)
  return res
}

function setAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
}

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 })
  }

  // Comparação em tempo constante (via hash, pra igualar tamanhos) + atraso em
  // senha errada pra deixar tentativa por força bruta bem mais lenta.
  const hash = (v: string) => crypto.createHash('sha256').update(v).digest()
  const ok = crypto.timingSafeEqual(hash(String(password ?? '')), hash(adminPassword))
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  setAdminCookie(res)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_COOKIE_NAME)
  return res
}
