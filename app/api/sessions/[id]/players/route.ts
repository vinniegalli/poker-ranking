import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcSomaCompra, calcCaixaContribution } from '@/lib/calculations'

const MAX_PLAYERS = 10

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { player_id } = await req.json()

  if (!player_id) {
    return NextResponse.json({ error: 'player_id is required' }, { status: 400 })
  }

  // Verifica duplicata
  const { data: existing } = await supabase
    .from('session_players')
    .select('id')
    .eq('session_id', params.id)
    .eq('player_id', player_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Jogador já confirmado nesta sessão.' }, { status: 409 })
  }

  // Verifica limite de jogadores
  const { count, error: countErr } = await supabase
    .from('session_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', params.id)

  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })

  if ((count ?? 0) >= MAX_PLAYERS) {
    return NextResponse.json({ error: `Sessão lotada (máximo ${MAX_PLAYERS} jogadores)` }, { status: 400 })
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
      buyins_pagos: 0,
      soma_compra,
      soma_ganho: 0,
      caixa_contribution,
    })
    .select('*, players(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Re-checa o limite após o insert: duas requisições concorrentes podem passar
  // pelo check acima ao mesmo tempo, então a garantia real de não estourar o
  // limite vem daqui.
  const { count: finalCount, error: finalCountErr } = await supabase
    .from('session_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', params.id)

  if (!finalCountErr && (finalCount ?? 0) > MAX_PLAYERS) {
    await supabase.from('session_players').delete().eq('id', data.id)
    return NextResponse.json({ error: `Sessão lotada (máximo ${MAX_PLAYERS} jogadores)` }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
