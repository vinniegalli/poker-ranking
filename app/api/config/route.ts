import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function GET() {
  const { data, error } = await supabase.from('config').select('key, value')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const config: Record<string, string> = {}
  for (const row of data ?? []) config[row.key] = row.value
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const body: Record<string, string> = await req.json()

  const rows = Object.entries(body).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))

  const { error } = await supabase
    .from('config')
    .upsert(rows, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
