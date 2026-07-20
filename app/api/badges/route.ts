import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Badge, computeBadges, PlayerSessionRow } from '@/lib/badges'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('player_id')

  const [
    { data: spData, error: spErr },
    { data: premiacoes, error: prErr },
    { data: quadra, error: qErr },
  ] = await Promise.all([
    supabase
      .from('session_players')
      .select('player_id, buyin_count, soma_compra, soma_ganho, players(name), sessions!inner(date, is_closed)')
      .eq('sessions.is_closed', true),
    supabase.from('premiacoes').select('player_id').not('player_id', 'is', null),
    supabase.from('quadra_mes').select('claimed_by').not('claimed_by', 'is', null),
  ])

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })
  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 })
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: PlayerSessionRow[] = (spData as any[]).map((row) => {
    const s = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
    return {
      player_id: row.player_id,
      name: row.players?.name ?? 'Desconhecido',
      date: s?.date ?? '',
      buyin_count: Number(row.buyin_count),
      soma_compra: Number(row.soma_compra),
      soma_ganho: Number(row.soma_ganho),
    }
  })

  const playersWithPrize = new Set<string>([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(premiacoes as any[]).map((p) => p.player_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(quadra as any[]).map((q) => q.claimed_by),
  ])

  const badgesByPlayer = computeBadges(rows, playersWithPrize)

  if (playerId) {
    return NextResponse.json(badgesByPlayer.get(playerId) ?? [])
  }

  const result: Record<string, Badge[]> = {}
  for (const [pid, badges] of badgesByPlayer) {
    result[pid] = badges
  }
  return NextResponse.json(result)
}
