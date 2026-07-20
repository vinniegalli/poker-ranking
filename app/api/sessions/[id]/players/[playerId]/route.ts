import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'
import { calcSomaCompra } from '@/lib/calculations'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const patch: Record<string, unknown> = {}

  if (body.buyin_count !== undefined) {
    const buyinCount = Number(body.buyin_count)
    if (!Number.isInteger(buyinCount) || buyinCount < 0) {
      return NextResponse.json({ error: 'buyin_count inválido' }, { status: 400 })
    }
    patch.buyin_count = buyinCount
    // soma_compra é sempre derivado do buyin_count no servidor, nunca aceito do cliente
    patch.soma_compra = calcSomaCompra(buyinCount)
  }

  if (body.soma_ganho !== undefined) {
    const somaGanho = Number(body.soma_ganho)
    if (!Number.isFinite(somaGanho) || somaGanho < 0) {
      return NextResponse.json({ error: 'soma_ganho inválido' }, { status: 400 })
    }
    patch.soma_ganho = somaGanho
  }

  if (body.buyins_pagos !== undefined) {
    const buyinsPagos = Number(body.buyins_pagos)
    if (!Number.isInteger(buyinsPagos) || buyinsPagos < 0) {
      return NextResponse.json({ error: 'buyins_pagos inválido' }, { status: 400 })
    }

    let maxBuyins: number
    if (patch.buyin_count !== undefined) {
      maxBuyins = patch.buyin_count as number
    } else {
      const { data: current, error: curErr } = await supabase
        .from('session_players')
        .select('buyin_count')
        .eq('id', params.playerId)
        .single()
      if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 })
      maxBuyins = current.buyin_count
    }

    if (buyinsPagos > maxBuyins) {
      return NextResponse.json({ error: 'buyins_pagos não pode ser maior que buyin_count' }, { status: 400 })
    }
    patch.buyins_pagos = buyinsPagos
  }

  if (body.is_paid !== undefined) patch.is_paid = Boolean(body.is_paid)

  const { data, error } = await supabase
    .from('session_players')
    .update(patch)
    .eq('id', params.playerId)
    .eq('session_id', params.id)
    .select('*, players(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('id', params.playerId)
    .eq('session_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
