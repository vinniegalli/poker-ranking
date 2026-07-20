import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function GET() {
  const { data, error } = await supabase
    .from('caixa_saidas')
    .select('*')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { description, amount, date } = await req.json()

  if (!description || !amount) {
    return NextResponse.json({ error: 'description e amount são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('caixa_saidas')
    .insert({
      description,
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
