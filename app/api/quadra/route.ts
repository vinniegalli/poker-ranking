import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'
import { CONFIG_KEY, parsePlano, ranksDoPlano, RANKS_ASC } from '@/lib/quadra-plano'

export const dynamic = 'force-dynamic'

const MONTH_RE = /^\d{4}-\d{2}-01$/

function byRank(a: { rank: string }, b: { rank: string }) {
  return RANKS_ASC.indexOf(a.rank) - RANKS_ASC.indexOf(b.rank)
}

async function listMonth(month: string) {
  return supabase
    .from('quadra_mes')
    .select('*, players(id, name)')
    .eq('month', month)
}

/**
 * Cria as quadras do mês a partir do plano anual, se o mês ainda não tiver
 * nenhuma. É o que faz "virou o mês, mudou a quadra" sem ninguém precisar
 * configurar. Meses que já têm quadra (mesmo editadas na mão) nunca são tocados.
 */
async function applyPlano(month: string): Promise<boolean> {
  const { data: cfg } = await supabase.from('config').select('value').eq('key', CONFIG_KEY).maybeSingle()
  const plano = parsePlano(cfg?.value)
  const ranks = ranksDoPlano(plano, month)
  if (!plano || ranks.length === 0) return false

  const { error } = await supabase
    .from('quadra_mes')
    .upsert(
      ranks.map((rank) => ({ month, rank, prize_amount: plano.premio, description: null })),
      { onConflict: 'month,rank', ignoreDuplicates: true }
    )
  if (error) {
    // Ex.: migração 03 ainda não rodada (sem índice único month+rank)
    console.warn('[quadra] não foi possível aplicar o plano:', error.message)
    return false
  }

  // Marca o mês como preenchido: se o admin apagar as quadras depois, o plano
  // não recria. (Duas visitas simultâneas não duplicam: o índice único segura.)
  const updated = { ...plano, aplicados: [...plano.aplicados, month.slice(0, 7)].slice(-36) }
  await supabase
    .from('config')
    .upsert({ key: CONFIG_KEY, value: JSON.stringify(updated), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  return true
}

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get('month') // 'YYYY-MM-01'

  if (month) {
    if (!MONTH_RE.test(month)) return NextResponse.json({ error: 'month inválido' }, { status: 400 })

    let { data, error } = await listMonth(month)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if ((data ?? []).length === 0 && (await applyPlano(month))) {
      ;({ data, error } = await listMonth(month))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json((data ?? []).sort(byRank))
  }

  const { data, error } = await supabase
    .from('quadra_mes')
    .select('*, players(id, name)')
    .order('month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { month, rank, prize_amount, description } = await req.json()

  if (!month || !rank) {
    return NextResponse.json({ error: 'month e rank obrigatórios' }, { status: 400 })
  }
  if (!MONTH_RE.test(month) || !RANKS_ASC.includes(rank)) {
    return NextResponse.json({ error: 'month ou rank inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('quadra_mes')
    .insert({ month, rank, prize_amount: prize_amount ?? 0, description: description || null })
    .select('*, players(id, name)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Já existe quadra de ${rank} neste mês.` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
