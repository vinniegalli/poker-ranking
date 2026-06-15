import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('premio_previsao')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { min_freq, placements, percentages } = await req.json()

  if (
    typeof min_freq !== 'number' ||
    typeof placements !== 'number' ||
    !Array.isArray(percentages)
  ) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Single-row pattern: delete all then insert
  await supabase.from('premio_previsao').delete().not('id', 'is', null)

  const { data, error } = await supabase
    .from('premio_previsao')
    .insert({ min_freq, placements, percentages, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
