import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'
import { listSeasons } from '@/lib/seasons-server'
import { parseSeasonBody, overlaps } from '@/lib/season-validation'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const parsed = parseSeasonBody(await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const season = parsed.value

  const others = (await listSeasons()).filter((s) => s.id !== params.id)
  const clash = others.find((s) => overlaps(s, season))
  if (clash) {
    return NextResponse.json({ error: `Período sobrepõe a temporada "${clash.name}".` }, { status: 409 })
  }

  // Alterar valores da temporada NÃO muda sessões já criadas (cada sessão guarda os seus).
  const { data, error } = await supabase.from('seasons').update(season).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** Remove só o registro da temporada — sessões, jogadores e caixa não são tocados. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { error } = await supabase.from('seasons').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
