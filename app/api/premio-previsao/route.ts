import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('premio_previsao')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

// Fixed ID — single-row pattern via upsert
const PREVISAO_ID = '00000000-0000-0000-0000-000000000001'

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { min_freq, placements, percentages } = await req.json()

  if (
    typeof min_freq !== 'number' ||
    typeof placements !== 'number' ||
    !Array.isArray(percentages)
  ) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('premio_previsao')
    .upsert(
      { id: PREVISAO_ID, min_freq, placements, percentages, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
