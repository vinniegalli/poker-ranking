import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcSomaCompra, calcCaixaContribution, sessionValues, MAX_PLAYERS as DEFAULT_MAX } from '@/lib/calculations'
import { isAdminRequest } from '@/lib/admin-server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { player_id } = await req.json()

  if (!player_id) {
    return NextResponse.json({ error: 'player_id is required' }, { status: 400 })
  }

  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()
  if (sErr || !session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

  // O link de convite é público: sem login de admin, só dá pra entrar em
  // sessão que ainda está aguardando confirmações.
  const isAdmin = isAdminRequest(req)
  if (!isAdmin && session.status !== 'pending') {
    return NextResponse.json({ error: 'As confirmações desta sessão foram encerradas.' }, { status: 403 })
  }
  if (session.status === 'closed') {
    return NextResponse.json({ error: 'Sessão encerrada.' }, { status: 400 })
  }

  const MAX_PLAYERS = Number(session.max_players) || DEFAULT_MAX
  const values = sessionValues(session)

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
  const soma_compra = calcSomaCompra(buyin_count, values)
  const caixa_contribution = calcCaixaContribution(values)

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
