'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Users, UserPlus, Lock, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Session, SessionPlayer, Player } from '@/types'
import { normalizeName } from '@/lib/player-names'
import { cn } from '@/lib/utils'

const MAX_PLAYERS = 10

type SP = SessionPlayer & { players: Player }
type SessionData = Session & { session_players: SP[] }

export default function ConfirmarContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [session, setSession] = useState<SessionData | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedName, setConfirmedName] = useState('')

  // Seleção do jogador
  const [mode, setMode] = useState<'select' | 'new'>('select')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Anti-duplicata: nomes já cadastrados que podem ser a mesma pessoa
  const [suggestions, setSuggestions] = useState<Player[] | null>(null)
  const [exactDuplicate, setExactDuplicate] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [sessionRes, playersRes] = await Promise.all([
      fetch(`/api/sessions/${id}`),
      fetch('/api/players'),
    ])
    if (sessionRes.ok) setSession(await sessionRes.json())
    if (playersRes.ok) setAllPlayers(await playersRes.json())
    setLoading(false)
  }

  function resetDuplicateCheck() {
    setSuggestions(null)
    setExactDuplicate(false)
  }

  /** Confirma presença de um jogador que já existe */
  async function confirmPlayer(playerId: string, name: string) {
    setError('')
    setSubmitting(true)

    const res = await fetch(`/api/sessions/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })

    setSubmitting(false)

    if (res.ok) {
      setConfirmedName(name)
      setConfirmed(true)
      resetDuplicateCheck()
      fetchData()
    } else {
      const err = await res.json()
      setError(err.error || 'Erro ao confirmar presença.')
    }
  }

  /**
   * Cria o jogador novo. Se o backend achar nome igual ou parecido, mostra as
   * sugestões em vez de cadastrar — `confirmNew` é o "não sou nenhum desses".
   */
  async function createAndConfirm(confirmNew: boolean) {
    const name = newName.trim()
    if (!name) return

    setError('')
    resetDuplicateCheck()
    setSubmitting(true)

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, confirm_new: confirmNew }),
    })

    if (res.status === 409) {
      const err = await res.json()
      setSuggestions(err.existing ? [err.existing] : err.suggestions ?? [])
      setExactDuplicate(err.error === 'duplicate')
      setSubmitting(false)
      return
    }

    if (!res.ok) {
      setError('Erro ao criar jogador.')
      setSubmitting(false)
      return
    }

    const p: Player = await res.json()
    await confirmPlayer(p.id, name)
  }

  function handleConfirm() {
    if (mode === 'new') {
      createAndConfirm(false)
      return
    }
    const player = allPlayers.find((p) => p.id === selectedId)
    if (player) confirmPlayer(player.id, player.name)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-foreground font-medium">Sessão não encontrada.</p>
        </div>
      </div>
    )
  }

  const date = new Date(session.date + 'T12:00:00')
  const confirmedPlayers = session.session_players
  const count = confirmedPlayers.length
  const isFull = count >= MAX_PLAYERS
  const confirmedIds = new Set(confirmedPlayers.map((sp) => sp.player_id))
  const availablePlayers = allPlayers.filter((p) => !confirmedIds.has(p.id))

  const searchTerm = normalizeName(search)
  const visiblePlayers = searchTerm
    ? availablePlayers.filter((p) => normalizeName(p.name).includes(searchTerm))
    : availablePlayers

  const isUnavailable = session.status !== 'pending'

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 px-4 pb-16">
      {/* Logo */}
      <div className="mb-8 font-display font-bold tracking-[0.18em] text-sm uppercase select-none">
        <span className="text-foreground">STACK</span><span className="text-gold">S</span>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Session info card */}
        <div className="rounded-xl card-border bg-card px-5 py-5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Sessão de poker</p>
          <h1 className="font-display text-xl font-bold text-foreground capitalize">
            {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {format(date, 'yyyy')}
            {session.notes && ` · ${session.notes}`}
          </p>

          {/* Counter */}
          <div className="mt-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 bg-secondary/50 rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full transition-all"
                style={{ width: `${(count / MAX_PLAYERS) * 100}%` }}
              />
            </div>
            <span className="text-sm font-mono-numbers font-semibold text-foreground tabular-nums">
              {count}<span className="text-muted-foreground font-normal">/{MAX_PLAYERS}</span>
            </span>
          </div>
        </div>

        {/* Confirmed players list */}
        {confirmedPlayers.length > 0 && (
          <div className="rounded-xl card-border bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Confirmados</p>
            <div className="space-y-2">
              {confirmedPlayers.map((sp) => (
                <div key={sp.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-foreground">{sp.players?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation form or states */}
        {isUnavailable ? (
          <div className="rounded-xl card-border bg-card px-5 py-6 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-foreground font-medium text-sm">
              {session.status === 'active' ? 'Sessão em andamento' : 'Sessão encerrada'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              As confirmações foram encerradas.
            </p>
          </div>
        ) : isFull ? (
          <div className="rounded-xl card-border bg-card px-5 py-6 text-center">
            <p className="text-2xl mb-2">🃏</p>
            <p className="text-foreground font-medium text-sm">Mesa cheia!</p>
            <p className="text-muted-foreground text-xs mt-1">
              Os {MAX_PLAYERS} lugares estão preenchidos.
            </p>
          </div>
        ) : confirmed ? (
          <div className="rounded-xl card-border bg-card px-5 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-foreground font-semibold">Presença confirmada!</p>
            <p className="text-muted-foreground text-sm mt-1">
              Vejo você na mesa, <span className="text-foreground font-medium">{confirmedName}</span>! 🃏
            </p>
          </div>
        ) : (
          <div className="rounded-xl card-border bg-card px-5 py-5 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Confirmar presença</p>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('select'); resetDuplicateCheck(); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  mode === 'select'
                    ? 'bg-gold text-felt'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Meu nome já está aqui
              </button>
              <button
                onClick={() => { setMode('new'); resetDuplicateCheck(); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  mode === 'new'
                    ? 'bg-gold text-felt'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <UserPlus className="h-3.5 w-3.5 inline mr-1.5" />
                Primeiro jogo
              </button>
            </div>

            {mode === 'select' ? (
              availablePlayers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-2">
                  Todos os jogadores já confirmaram.
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar seu nome..."
                      className="bg-secondary border-border h-11 text-base pl-9"
                    />
                  </div>
                  {visiblePlayers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-2">
                      Nenhum jogador com esse nome. Se é seu primeiro jogo, use a aba ao lado.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {visiblePlayers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedId(p.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors',
                            selectedId === p.id
                              ? 'bg-gold/15 text-gold border border-gold/30'
                              : 'bg-secondary text-foreground hover:bg-secondary/70'
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            ) : (
              <>
                <Input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); resetDuplicateCheck() }}
                  placeholder="Seu nome"
                  className="bg-secondary border-border h-12 text-base"
                  autoFocus
                />
                <p className="text-muted-foreground/70 text-xs">
                  Só use isso se for mesmo sua primeira vez. Se já jogou antes, procure seu
                  nome na outra aba — cadastro novo racha seu histórico e suas conquistas.
                </p>
              </>
            )}

            {/* Aviso de possível duplicata */}
            {suggestions && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 space-y-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">
                      {exactDuplicate ? 'Esse nome já está cadastrado' : 'Já tem alguém parecido na lista'}
                    </p>
                    <p className="text-xs text-amber-200/70 mt-0.5">
                      Se for você, toque no seu nome — assim seu histórico continua num cadastro só.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {suggestions.map((p) => {
                    const already = confirmedIds.has(p.id)
                    return (
                      <button
                        key={p.id}
                        disabled={already || submitting}
                        onClick={() => confirmPlayer(p.id, p.name)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors',
                          already
                            ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                            : 'bg-secondary text-foreground hover:bg-secondary/70'
                        )}
                      >
                        {p.name}
                        {already && <span className="text-xs ml-2">(já confirmado)</span>}
                      </button>
                    )
                  })}
                </div>

                {exactDuplicate ? (
                  <p className="text-xs text-amber-200/70">
                    Se for outra pessoa, adicione um sobrenome pra diferenciar.
                  </p>
                ) : (
                  <button
                    onClick={() => createAndConfirm(true)}
                    disabled={submitting}
                    className="text-xs text-amber-200/80 underline underline-offset-2 hover:text-amber-100"
                  >
                    Não sou nenhum desses, cadastrar &quot;{newName.trim()}&quot;
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}

            <Button
              onClick={handleConfirm}
              disabled={submitting || (mode === 'select' && !selectedId) || (mode === 'new' && !newName.trim())}
              className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold text-base"
            >
              {submitting ? 'Confirmando...' : 'Confirmar presença'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
