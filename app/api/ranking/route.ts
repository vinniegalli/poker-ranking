import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RankingRow } from '@/types'
import { calcCurrentStreak } from '@/lib/calculations'
import { aggregateByPlayer, sortBySaldo } from '@/lib/ranking'
import { parseRange } from '@/lib/periodo'

export async function GET(req: NextRequest) {
  const range = parseRange(new URL(req.url).searchParams)

  let query = supabase
    .from('session_players')
    .select(`
      player_id,
      soma_compra,
      soma_ganho,
      players(name),
      sessions!inner(date, is_closed)
    `)
    .eq('sessions.is_closed', true)

  if (range) {
    query = query
      .gte('sessions.date', range.start)
      .lte('sessions.date', range.end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).map((row) => {
    const s = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
    return {
      player_id: row.player_id,
      name: row.players?.name ?? 'Desconhecido',
      date: s?.date ?? '',
      soma_compra: Number(row.soma_compra),
      soma_ganho: Number(row.soma_ganho),
    }
  })

  const aggregated = sortBySaldo(aggregateByPlayer(rows))

  const ranking: RankingRow[] = aggregated.map((e) => ({
    player_id: e.player_id,
    name: e.name,
    participacoes: e.participacoes,
    soma_compra: e.soma_compra,
    soma_ganho: e.soma_ganho,
    soma_saldo: e.soma_saldo,
    media_compra: e.participacoes > 0 ? e.soma_compra / e.participacoes : 0,
    media_ganho: e.participacoes > 0 ? e.soma_ganho / e.participacoes : 0,
    streak: calcCurrentStreak(e.sessions),
  }))

  return NextResponse.json(ranking)
}
