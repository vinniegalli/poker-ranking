import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_players(count)
    `)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type SessionRaw = { session_players: { count: number }[] } & Record<string, unknown>
  const sessions = (data as SessionRaw[]).map((s) => ({
    ...s,
    player_count: s.session_players?.[0]?.count ?? 0,
  }))

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const { date, notes } = await req.json()
  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ date, notes: notes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
