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
  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
