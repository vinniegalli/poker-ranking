import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const body = await req.json()

  const patch: Record<string, unknown> = {}
  if (body.buyin_count !== undefined) patch.buyin_count = body.buyin_count
  if (body.soma_compra !== undefined) patch.soma_compra = body.soma_compra
  if (body.soma_ganho !== undefined) patch.soma_ganho = body.soma_ganho
  if (body.is_paid !== undefined) patch.is_paid = body.is_paid

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
