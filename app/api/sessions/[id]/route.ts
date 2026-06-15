import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 404 })

  const { data: players, error: pErr } = await supabase
    .from('session_players')
    .select('*, players(*)')
    .eq('session_id', params.id)
    .order('created_at')

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({ ...session, session_players: players })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  // Bloqueia encerramento se pote não estiver fechado
  if (body.is_closed === true || body.status === 'closed') {
    const { data: sps, error: spErr } = await supabase
      .from('session_players')
      .select('soma_compra, soma_ganho')
      .eq('session_id', params.id)

    if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 })

    const totalCompra = (sps ?? []).reduce((s, r) => s + Number(r.soma_compra), 0)
    const totalGanho = (sps ?? []).reduce((s, r) => s + Number(r.soma_ganho), 0)

    if (Math.abs(totalGanho - totalCompra) >= 0.01) {
      return NextResponse.json(
        { error: `Pote não fechado: compras ${totalCompra.toFixed(2)} ≠ ganhos ${totalGanho.toFixed(2)}` },
        { status: 422 }
      )
    }
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await supabase.from('session_players').delete().eq('session_id', params.id)

  const { error } = await supabase.from('sessions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
