import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('session_players')
    .update({
      buyin_count: body.buyin_count,
      soma_compra: body.soma_compra,
      soma_ganho: body.soma_ganho,
    })
    .eq('id', params.playerId)
    .eq('session_id', params.id)
    .select('*, players(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('id', params.playerId)
    .eq('session_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
