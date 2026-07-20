import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const body = await req.json()

  const update: Record<string, unknown> = {}
  if ('rank' in body) update.rank = body.rank
  if ('prize_amount' in body) update.prize_amount = body.prize_amount
  if ('description' in body) update.description = body.description
  if ('claimed_by' in body) {
    update.claimed_by = body.claimed_by || null
    update.claimed_at = body.claimed_by ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from('quadra_mes')
    .update(update)
    .eq('id', params.id)
    .select('*, players(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { error } = await supabase.from('quadra_mes').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
