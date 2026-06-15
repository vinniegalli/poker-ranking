import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')

  // Soma caixa_contribution de todos os jogadores em sessões iniciadas/encerradas
  const { data: spRows, error: spErr } = await supabase
    .from('session_players')
    .select('caixa_contribution, sessions!inner(date, status)')

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })

  type SPRow = { caixa_contribution: number; sessions: { date: string; status: string } | { date: string; status: string }[] | null }
  const totalEntradas = (spRows as unknown as SPRow[]).reduce((sum, row) => {
    const raw = row.sessions
    const s = Array.isArray(raw) ? raw[0] : raw
    if (!s) return sum
    if (s.status === 'pending') return sum               // sessão ainda não iniciada, não conta
    if (year && !s.date.startsWith(year)) return sum    // filtro de ano
    return sum + Number(row.caixa_contribution)
  }, 0)

  // Saídas do caixa (inalterado)
  let saidaQuery = supabase.from('caixa_saidas').select('amount, date')
  if (year) {
    saidaQuery = saidaQuery
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
  }

  const { data: saidas, error: sErr } = await saidaQuery
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  const totalSaidas = (saidas as { amount: number }[]).reduce((sum, r) => sum + Number(r.amount), 0)

  return NextResponse.json({ total: totalEntradas - totalSaidas })
}
