import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcMvp } from '@/lib/calculations'
import { aggregateByPlayer, sortBySaldo } from '@/lib/ranking'
import { Badge, computeBadges, PlayerSessionRow } from '@/lib/badges'

interface Row extends PlayerSessionRow {
  session_id: string
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select('id, date, is_closed')
    .eq('id', params.id)
    .single()

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 404 })
  if (!session.is_closed) {
    return NextResponse.json({ error: 'Sessão ainda não foi encerrada' }, { status: 400 })
  }

  const year = session.date.slice(0, 4)

  const [
    { data: spData, error: spErr },
    { data: premiacoes, error: prErr },
    { data: quadra, error: qErr },
  ] = await Promise.all([
    supabase
      .from('session_players')
      .select('session_id, player_id, buyin_count, soma_compra, soma_ganho, players(name), sessions!inner(date, is_closed)')
      .eq('sessions.is_closed', true)
      .gte('sessions.date', `${year}-01-01`)
      .lte('sessions.date', `${year}-12-31`),
    supabase.from('premiacoes').select('player_id').not('player_id', 'is', null),
    supabase.from('quadra_mes').select('claimed_by').not('claimed_by', 'is', null),
  ])

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })
  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 })
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsAfter: Row[] = (spData as any[]).map((row) => {
    const s = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
    return {
      session_id: row.session_id,
      player_id: row.player_id,
      name: row.players?.name ?? 'Desconhecido',
      date: s?.date ?? '',
      buyin_count: Number(row.buyin_count),
      soma_compra: Number(row.soma_compra),
      soma_ganho: Number(row.soma_ganho),
    }
  })
  const rowsBefore = rowsAfter.filter((r) => r.session_id !== params.id)
  const thisSessionRows = rowsAfter.filter((r) => r.session_id === params.id)

  const playersWithPrize = new Set<string>([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(premiacoes as any[]).map((p) => p.player_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(quadra as any[]).map((q) => q.claimed_by),
  ])

  const rankingAfter = sortBySaldo(aggregateByPlayer(rowsAfter))
  const rankingBefore = sortBySaldo(aggregateByPlayer(rowsBefore))
  const posAfterByPlayer = new Map(rankingAfter.map((r, i) => [r.player_id, i + 1]))
  const posBeforeByPlayer = new Map(rankingBefore.map((r, i) => [r.player_id, i + 1]))

  const badgesAfter = computeBadges(rowsAfter, playersWithPrize)
  const badgesBefore = computeBadges(rowsBefore, playersWithPrize)

  const players = thisSessionRows.map((row) => {
    const posBefore = posBeforeByPlayer.get(row.player_id) ?? null
    const posAfter = posAfterByPlayer.get(row.player_id) ?? null
    const before = new Set((badgesBefore.get(row.player_id) ?? []).map((b) => b.id))
    const newBadges: Badge[] = (badgesAfter.get(row.player_id) ?? []).filter((b) => !before.has(b.id))

    return {
      player_id: row.player_id,
      name: row.name,
      saldo: row.soma_ganho - row.soma_compra,
      posBefore,
      posAfter,
      delta: posBefore !== null && posAfter !== null ? posBefore - posAfter : null,
      newBadges,
    }
  }).sort((a, b) => b.saldo - a.saldo)

  const mvp = calcMvp(thisSessionRows.map((r) => ({ name: r.name, saldo: r.soma_ganho - r.soma_compra })))

  return NextResponse.json({
    session: { id: session.id, date: session.date },
    mvp,
    players,
  })
}
