import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('session_players')
    .select('soma_compra, soma_ganho, sessions!inner(date, is_closed)')
    .eq('player_id', params.id)
    .eq('sessions.is_closed', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json({
      participacoes: 0,
      soma_saldo: 0,
      media_saldo: 0,
      media_compra: 0,
      media_ganho: 0,
      melhor_sessao: null,
      pior_sessao: null,
      maior_ganho: null,
      maior_gasto: null,
      melhor_mes: null,
      pior_mes: null,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[]

  const sessions = rows.map((r) => {
    const raw = r.sessions
    const s = Array.isArray(raw) ? raw[0] : raw
    return {
      date: s?.date ?? '',
      soma_compra: Number(r.soma_compra),
      soma_ganho: Number(r.soma_ganho),
      saldo: Number(r.soma_ganho) - Number(r.soma_compra),
    }
  })

  const participacoes = sessions.length
  const soma_saldo = sessions.reduce((s, r) => s + r.saldo, 0)
  const soma_compra_total = sessions.reduce((s, r) => s + r.soma_compra, 0)
  const soma_ganho_total = sessions.reduce((s, r) => s + r.soma_ganho, 0)

  const sorted_saldo = [...sessions].sort((a, b) => b.saldo - a.saldo)
  const sorted_ganho = [...sessions].sort((a, b) => b.soma_ganho - a.soma_ganho)
  const sorted_gasto = [...sessions].sort((a, b) => b.soma_compra - a.soma_compra)

  // Melhor/pior mês
  const monthMap = new Map<string, number>()
  for (const s of sessions) {
    const mes = s.date.slice(0, 7) // YYYY-MM
    monthMap.set(mes, (monthMap.get(mes) ?? 0) + s.saldo)
  }
  const months = Array.from(monthMap.entries()).map(([mes, saldo]) => ({ mes, saldo }))
  const sorted_months = [...months].sort((a, b) => b.saldo - a.saldo)

  return NextResponse.json({
    participacoes,
    soma_saldo,
    media_saldo: participacoes > 0 ? soma_saldo / participacoes : 0,
    media_compra: participacoes > 0 ? soma_compra_total / participacoes : 0,
    media_ganho: participacoes > 0 ? soma_ganho_total / participacoes : 0,
    melhor_sessao: sorted_saldo[0] ?? null,
    pior_sessao: sorted_saldo[sorted_saldo.length - 1] ?? null,
    maior_ganho: sorted_ganho[0] ?? null,
    maior_gasto: sorted_gasto[0] ?? null,
    melhor_mes: sorted_months[0] ?? null,
    pior_mes: sorted_months[sorted_months.length - 1] ?? null,
  })
}
