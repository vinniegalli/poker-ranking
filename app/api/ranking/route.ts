import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RankingRow } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  let query = supabase
    .from('session_players')
    .select(`
      player_id,
      soma_compra,
      soma_ganho,
      players(name),
      sessions!inner(date, is_closed)
    `)

  if (year) {
    query = query
      .gte('sessions.date', `${year}-01-01`)
      .lte('sessions.date', `${year}-12-31`)
  } else if (startDate && endDate) {
    query = query
      .gte('sessions.date', startDate)
      .lte('sessions.date', endDate)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map = new Map<string, {
    player_id: string; name: string
    participacoes: number; soma_compra: number; soma_ganho: number
  }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of data as any[]) {
    const pid = row.player_id
    const name = row.players?.name ?? 'Desconhecido'
    if (!map.has(pid)) {
      map.set(pid, { player_id: pid, name, participacoes: 0, soma_compra: 0, soma_ganho: 0 })
    }
    const e = map.get(pid)!
    e.participacoes += 1
    e.soma_compra += Number(row.soma_compra)
    e.soma_ganho += Number(row.soma_ganho)
  }

  const ranking: RankingRow[] = Array.from(map.values()).map((e) => ({
    player_id: e.player_id,
    name: e.name,
    participacoes: e.participacoes,
    soma_compra: e.soma_compra,
    soma_ganho: e.soma_ganho,
    soma_saldo: e.soma_ganho - e.soma_compra,
    media_compra: e.participacoes > 0 ? e.soma_compra / e.participacoes : 0,
    media_ganho: e.participacoes > 0 ? e.soma_ganho / e.participacoes : 0,
  }))

  ranking.sort((a, b) => b.soma_saldo - a.soma_saldo)
  return NextResponse.json(ranking)
}
