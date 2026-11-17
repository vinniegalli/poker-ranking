import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'
import { listSeasons } from '@/lib/seasons-server'
import { findSeasonForDate } from '@/lib/periodo'
import { MAX_PLAYERS, sessionValues } from '@/lib/calculations'

export async function GET() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_players(count)
    `)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type SessionRaw = { session_players: { count: number }[] } & Record<string, unknown>
  const sessions = (data as SessionRaw[]).map((s) => ({
    ...s,
    player_count: s.session_players?.[0]?.count ?? 0,
  }))

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const { date, notes, status } = body
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }
  if (status !== undefined && !['pending', 'active'].includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }

  // Valores: o que o admin mandou > temporada da data > padrão
  const season = findSeasonForDate(await listSeasons(), date)
  const base = sessionValues(season)
  const values = sessionValues({
    buyin_amount: body.buyin_amount ?? base.buyin_amount,
    rebuy_amount: body.rebuy_amount ?? base.rebuy_amount,
    caixa_fee: body.caixa_fee ?? base.caixa_fee,
  })
  if (values.buyin_amount <= 0 || values.rebuy_amount <= 0 || values.caixa_fee < 0) {
    return NextResponse.json({ error: 'Valores inválidos' }, { status: 400 })
  }
  const maxPlayers = body.max_players === undefined ? MAX_PLAYERS : Number(body.max_players)
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 30) {
    return NextResponse.json({ error: 'Limite de jogadores inválido (2 a 30)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      date,
      notes: notes || null,
      status: status ?? 'active',
      ...values,
      max_players: maxPlayers,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
