import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('session_players')
    .select('player_id, soma_compra, soma_ganho, buyin_count, players(name), sessions!inner(date, is_closed)')
    .eq('sessions.is_closed', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).map((r) => ({
    player_id: r.player_id as string,
    name: (r.players?.name ?? 'Desconhecido') as string,
    soma_compra: Number(r.soma_compra),
    soma_ganho: Number(r.soma_ganho),
    buyin_count: Number(r.buyin_count),
    saldo: Number(r.soma_ganho) - Number(r.soma_compra),
    date: (Array.isArray(r.sessions) ? r.sessions[0]?.date : r.sessions?.date) as string,
  }))

  if (rows.length === 0) return NextResponse.json([])

  // Agrupado por jogador
  const byPlayer = new Map<string, { name: string; saldos: number[]; buyins: number[] }>()
  for (const r of rows) {
    if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, { name: r.name, saldos: [], buyins: [] })
    const p = byPlayer.get(r.player_id)!
    p.saldos.push(r.saldo)
    p.buyins.push(r.buyin_count)
  }

  // Maior ganho em uma sessão
  const biggestWin = rows.reduce((best, r) => r.saldo > (best?.saldo ?? -Infinity) ? r : best, rows[0])

  // Maior prejuízo em uma sessão
  const biggestLoss = rows.reduce((worst, r) => r.saldo < (worst?.saldo ?? Infinity) ? r : worst, rows[0])

  // Mais buy-ins em uma sessão
  const mostRebuys = rows.reduce((best, r) => r.buyin_count > (best?.buyin_count ?? 0) ? r : best, rows[0])

  // Mais sessões jogadas
  const mostSessions = Array.from(byPlayer.entries())
    .map(([, p]) => ({ name: p.name, count: p.saldos.length }))
    .sort((a, b) => b.count - a.count)[0]

  // Melhor aproveitamento (% de sessões lucrativas, mínimo 3 sessões)
  const bestWinrate = Array.from(byPlayer.entries())
    .filter(([, p]) => p.saldos.length >= 3)
    .map(([, p]) => ({
      name: p.name,
      rate: p.saldos.filter((s) => s > 0).length / p.saldos.length,
      wins: p.saldos.filter((s) => s > 0).length,
      total: p.saldos.length,
    }))
    .sort((a, b) => b.rate - a.rate)[0]

  // Mais derrotas
  const mostLosses = Array.from(byPlayer.entries())
    .map(([, p]) => ({ name: p.name, losses: p.saldos.filter((s) => s < 0).length }))
    .sort((a, b) => b.losses - a.losses)[0]

  // Jogador mais agressivo (maior média de buy-ins)
  const mostAggressive = Array.from(byPlayer.entries())
    .filter(([, p]) => p.saldos.length >= 3)
    .map(([, p]) => ({
      name: p.name,
      avg: p.buyins.reduce((s, b) => s + b, 0) / p.buyins.length,
    }))
    .sort((a, b) => b.avg - a.avg)[0]

  // Maior saldo positivo acumulado total
  const bestOverall = Array.from(byPlayer.entries())
    .map(([, p]) => ({ name: p.name, total: p.saldos.reduce((s, v) => s + v, 0) }))
    .sort((a, b) => b.total - a.total)[0]

  const stats = [
    biggestWin && biggestWin.saldo > 0 && {
      icon: '🏆',
      label: 'Maior ganho em uma sessão',
      player: biggestWin.name,
      value: biggestWin.saldo,
      type: 'currency',
      date: biggestWin.date,
    },
    biggestLoss && biggestLoss.saldo < 0 && {
      icon: '💸',
      label: 'Maior prejuízo em uma sessão',
      player: biggestLoss.name,
      value: biggestLoss.saldo,
      type: 'currency',
      date: biggestLoss.date,
    },
    mostSessions && {
      icon: '🎯',
      label: 'Mais sessões jogadas',
      player: mostSessions.name,
      value: mostSessions.count,
      type: 'sessions',
    },
    mostRebuys && mostRebuys.buyin_count > 1 && {
      icon: '🃏',
      label: 'Mais buy-ins em uma sessão',
      player: mostRebuys.name,
      value: mostRebuys.buyin_count,
      type: 'buyins',
      date: mostRebuys.date,
    },
    bestWinrate && {
      icon: '📈',
      label: 'Melhor aproveitamento',
      player: bestWinrate.name,
      value: Math.round(bestWinrate.rate * 100),
      type: 'percent',
      sub: `${bestWinrate.wins}/${bestWinrate.total} sessões`,
    },
    mostLosses && mostLosses.losses > 0 && {
      icon: '☠️',
      label: 'Mais derrotas',
      player: mostLosses.name,
      value: mostLosses.losses,
      type: 'sessions',
    },
    mostAggressive && {
      icon: '🔥',
      label: 'Jogador mais agressivo',
      player: mostAggressive.name,
      value: Math.round(mostAggressive.avg * 10) / 10,
      type: 'avg_buyins',
      sub: 'média de buy-ins/sessão',
    },
    bestOverall && bestOverall.total > 0 && {
      icon: '👑',
      label: 'Maior saldo total',
      player: bestOverall.name,
      value: bestOverall.total,
      type: 'currency',
    },
  ].filter(Boolean)

  return NextResponse.json(stats)
}
