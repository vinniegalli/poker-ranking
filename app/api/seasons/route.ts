import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'
import { listSeasons } from '@/lib/seasons-server'
import { parseSeasonBody, previousDay, overlaps } from '@/lib/season-validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await listSeasons())
}

/**
 * Cria uma temporada nova. Com `close_current: true`, encerra a temporada em
 * andamento (end_date = véspera do início da nova). Nada é apagado: o ranking
 * de cada temporada é só um filtro pelas datas dela.
 */
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const body = await req.json()
  const parsed = parseSeasonBody(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const season = parsed.value

  const existing = await listSeasons()
  const toClose = body.close_current
    ? existing.filter((s) => s.end_date === null && s.start_date < season.start_date)
    : []
  const closeDate = previousDay(season.start_date)

  // Checa sobreposição considerando as temporadas que serão encerradas
  const after = existing.map((s) => (toClose.includes(s) ? { ...s, end_date: closeDate } : s))
  const clash = after.find((s) => overlaps(s, season))
  if (clash) {
    return NextResponse.json(
      { error: `Período sobrepõe a temporada "${clash.name}". Ajuste as datas ou encerre a atual.` },
      { status: 409 }
    )
  }

  for (const s of toClose) {
    const { error } = await supabase.from('seasons').update({ end_date: closeDate }).eq('id', s.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data, error } = await supabase.from('seasons').insert(season).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
