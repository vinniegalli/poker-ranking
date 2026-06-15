import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')

  // 1. Contribuições das sessões (R$5/jogador, sessões não-pendentes)
  const { data: spRows, error: spErr } = await supabase
    .from('session_players')
    .select('caixa_contribution, sessions!inner(date, status)')

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })

  type SPRow = { caixa_contribution: number; sessions: { date: string; status: string } | { date: string; status: string }[] | null }
  const totalSessoes = (spRows as unknown as SPRow[]).reduce((sum, row) => {
    const raw = row.sessions
    const s = Array.isArray(raw) ? raw[0] : raw
    if (!s || s.status === 'pending') return sum
    if (year && !s.date.startsWith(year)) return sum
    return sum + Number(row.caixa_contribution)
  }, 0)

  // 2. Entradas manuais (saldo inicial, correções históricas, etc.)
  const { data: entradas, error: eErr } = await supabase
    .from('caixa_entradas')
    .select('amount, date')

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 })

  const totalEntradas = (entradas as { amount: number; date: string }[]).reduce((sum, e) => {
    if (year && !e.date.startsWith(year)) return sum
    return sum + Number(e.amount)
  }, 0)

  // 3. Saídas (despesas)
  let saidaQuery = supabase.from('caixa_saidas').select('amount, date')
  if (year) {
    saidaQuery = saidaQuery
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
  }

  const { data: saidas, error: sErr } = await saidaQuery
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  const totalSaidas = (saidas as { amount: number }[]).reduce((sum, r) => sum + Number(r.amount), 0)

  // 4. Premiações distribuídas (saem do caixa)
  const { data: premiacoes, error: prErr } = await supabase
    .from('premiacoes')
    .select('amount, date')

  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 })

  const totalPremiacoes = (premiacoes as { amount: number; date: string }[]).reduce((sum, p) => {
    if (year && !p.date.startsWith(year)) return sum
    return sum + Number(p.amount)
  }, 0)

  return NextResponse.json({ total: totalSessoes + totalEntradas - totalSaidas - totalPremiacoes })
}
