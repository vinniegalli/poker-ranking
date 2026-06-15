import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // 'YYYY-MM-DD' first day of month

  let query = supabase
    .from('quadra_mes')
    .select('*, players(id, name)')
    .order('month', { ascending: false })

  if (month) {
    query = query.eq('month', month)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { month, rank, prize_amount, description } = await req.json()

  if (!month || !rank) {
    return NextResponse.json({ error: 'month e rank obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('quadra_mes')
    .insert({ month, rank, prize_amount: prize_amount ?? 0, description: description || null })
    .select('*, players(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
