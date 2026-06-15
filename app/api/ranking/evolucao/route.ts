import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')

  let sessionsQuery = supabase
    .from('sessions')
    .select('id, date')
    .eq('is_closed', true)
    .order('date', { ascending: true })

  if (year) {
    sessionsQuery = sessionsQuery
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
  }

  const { data: sessions, error: sErr } = await sessionsQuery
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
  if (!sessions || sessions.length === 0) return NextResponse.json({ data: [], players: [] })

  const sessionIds = sessions.map((s) => s.id)

  const { data: sps, error: spErr } = await supabase
    .from('session_players')
    .select('session_id, player_id, soma_compra, soma_ganho, players(name)')
    .in('session_id', sessionIds)

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })

  // Rastreia saldo acumulado por jogador
  const cumulative: Record<string, number> = {}
  const playerNames: Record<string, string> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const sp of (sps ?? []) as any[]) {
    playerNames[sp.player_id] = sp.players?.name ?? 'Desconhecido'
  }

  const chartData = sessions.map((session) => {
    const d = new Date(session.date + 'T12:00:00')
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: Record<string, any> = { date: session.date, label }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = (sps ?? [] as any[]).filter((sp: any) => sp.session_id === session.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const sp of entries as any[]) {
      const name = playerNames[sp.player_id]
      // saldo da sessão excluindo caixa
      const sessionSaldo = Number(sp.soma_ganho) - Number(sp.soma_compra)
      cumulative[sp.player_id] = (cumulative[sp.player_id] ?? 0) + sessionSaldo
      point[name] = cumulative[sp.player_id]
    }

    // carry forward para jogadores ausentes nessa sessão
    for (const [pid, saldo] of Object.entries(cumulative)) {
      const name = playerNames[pid]
      if (!(name in point)) {
        point[name] = saldo
      }
    }

    return point
  })

  return NextResponse.json({ data: chartData, players: Object.values(playerNames) })
}
