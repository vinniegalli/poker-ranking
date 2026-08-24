import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { findExactPlayer, findSimilarPlayers } from '@/lib/player-names'

export async function GET() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * Cria um jogador novo. Antes de inserir, checa se já existe alguém com o mesmo
 * nome (ou parecido) — o link de convite é público e o caso comum é o jogador
 * recadastrar a si mesmo sem olhar a lista, rachando o histórico dele em dois.
 *
 * `confirm_new: true` significa que o usuário viu as sugestões e disse que
 * nenhuma delas é ele. Nome idêntico é bloqueado mesmo assim.
 */
export async function POST(req: NextRequest) {
  const { name, confirm_new } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const trimmed = name.trim()

  const { data: players, error: listErr } = await supabase.from('players').select('id, name')
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const exact = findExactPlayer(trimmed, players ?? [])
  if (exact) {
    return NextResponse.json(
      { error: 'duplicate', message: `${exact.name} já está cadastrado.`, existing: exact },
      { status: 409 }
    )
  }

  if (!confirm_new) {
    const similar = findSimilarPlayers(trimmed, players ?? [])
    if (similar.length > 0) {
      return NextResponse.json(
        { error: 'similar', message: 'Encontramos jogadores parecidos.', suggestions: similar },
        { status: 409 }
      )
    }
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ name: trimmed })
    .select()
    .single()

  // 23505 = unique_violation: o índice único por nome normalizado no banco é a
  // última linha de defesa contra duas confirmações simultâneas com o mesmo nome.
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'duplicate', message: `${trimmed} já está cadastrado.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
