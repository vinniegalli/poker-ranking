import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcSomaCompra, calcCaixaContribution } from '@/lib/calculations'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { player_id } = await req.json()

  if (!player_id) {
    return NextResponse.json({ error: 'player_id is required' }, { status: 400 })
  }

  const buyin_count = 1
  const soma_compra = calcSomaCompra(buyin_count)
  const caixa_contribution = calcCaixaContribution()

  const { data, error } = await supabase
    .from('session_players')
    .insert({
      session_id: params.id,
      player_id,
      buyin_count,
      soma_compra,
      soma_ganho: 0,
      caixa_contribution,
    })
    .select('*, players(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('caixa').insert({
    session_id: params.id,
    amount: caixa_contribution,
    description: `Buy-in de jogador na sessão`,
  })

  return NextResponse.json(data, { status: 201 })
}
