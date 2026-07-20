import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function GET() {
  const { data, error } = await supabase
    .from('premiacoes')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupa por distribution_id
  type Row = {
    id: string; distribution_id: string; type: string; player_id: string | null
    player_name: string; placement: number | null; amount: number
    description: string | null; date: string; created_at: string
  }
  const rows = (data ?? []) as Row[]
  const groups = new Map<string, {
    distribution_id: string; type: string; date: string
    description: string | null; total: number; entries: Row[]
  }>()

  for (const row of rows) {
    if (!groups.has(row.distribution_id)) {
      groups.set(row.distribution_id, {
        distribution_id: row.distribution_id,
        type: row.type,
        date: row.date,
        description: row.description,
        total: 0,
        entries: [],
      })
    }
    const g = groups.get(row.distribution_id)!
    g.total += Number(row.amount)
    g.entries.push(row)
  }

  return NextResponse.json(Array.from(groups.values()))
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { type, date, description, entries } = await req.json()

  if (!type || !entries?.length) {
    return NextResponse.json({ error: 'type e entries são obrigatórios' }, { status: 400 })
  }

  const distributionId = crypto.randomUUID()
  const d = date || new Date().toISOString().split('T')[0]

  const rows = entries.map((e: {
    player_id?: string; player_name: string; placement?: number; amount: number
  }) => ({
    distribution_id: distributionId,
    type,
    player_id: e.player_id || null,
    player_name: e.player_name,
    placement: e.placement ?? null,
    amount: Number(e.amount),
    description: description || null,
    date: d,
  }))

  const { error } = await supabase.from('premiacoes').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ distribution_id: distributionId }, { status: 201 })
}
