import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')

  let query = supabase.from('caixa').select('amount, sessions(date)')

  if (year) {
    query = query
      .gte('sessions.date', `${year}-01-01`)
      .lte('sessions.date', `${year}-12-31`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = (data as { amount: number }[]).reduce((sum, r) => sum + Number(r.amount), 0)
  return NextResponse.json({ total })
}
