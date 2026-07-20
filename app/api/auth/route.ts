import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME, createAdminSessionToken } from '@/lib/admin-server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_COOKIE_NAME)
  return res
}
