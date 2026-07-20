import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [{ data: session, error: sErr }, { data: players, error: pErr }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', params.id).single(),
    supabase.from('session_players').select('*, players(*)').eq('session_id', params.id).order('created_at'),
  ])

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 404 })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({ ...session, session_players: players })
}

const PATCHABLE_FIELDS = ['status', 'is_closed', 'notes', 'date'] as const

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const rawBody = await req.json()
  const body: Record<string, unknown> = {}
  for (const field of PATCHABLE_FIELDS) {
    if (field in rawBody) body[field] = rawBody[field]
  }

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { error: playersErr } = await supabase.from('session_players').delete().eq('session_id', params.id)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })

  const { error } = await supabase.from('sessions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
