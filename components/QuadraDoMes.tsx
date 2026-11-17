'use client'

import { useEffect, useState } from 'react'
import { QuadraMes, Player } from '@/types'
import { formatBRL } from '@/lib/calculations'
import { RANKS_ASC } from '@/lib/quadra-plano'
import { todayISO } from '@/lib/periodo'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuadraPlanoDialog } from '@/components/QuadraPlanoDialog'
import { CalendarRange, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUITS = [
  { symbol: '♠', color: '#1c1917' },
  { symbol: '♥', color: '#dc2626' },
  { symbol: '♦', color: '#dc2626' },
  { symbol: '♣', color: '#1c1917' },
]

const ROTATIONS = ['-4deg', '-1.5deg', '1.5deg', '4deg']
const TRANSLATIONS = ['-6px', '-2px', '2px', '6px']
const NONE = '__none__'

function PlayingCard({ rank, suit, rotation, translateY, small }: {
  rank: string
  suit: { symbol: string; color: string }
  rotation: string
  translateY: string
  small?: boolean
}) {
  return (
    <div
      className={cn(
        'relative bg-[#F5F0E8] flex flex-col select-none flex-shrink-0',
        small
          ? 'w-[30px] h-[42px] rounded-md -ml-3 first:ml-0'
          : 'w-[72px] h-[100px] sm:w-[84px] sm:h-[116px] rounded-xl'
      )}
      style={{
        transform: `rotate(${rotation}) translateY(${small ? '0px' : translateY})`,
        boxShadow: small ? '0 2px 6px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {small ? (
        <div className="absolute top-0.5 left-1 leading-none text-center">
          <div className="text-[10px] font-bold" style={{ color: suit.color, fontFamily: 'Georgia, serif' }}>{rank}</div>
          <div className="text-[9px]" style={{ color: suit.color }}>{suit.symbol}</div>
        </div>
      ) : (
        <>
          <div className="absolute top-2 left-2 leading-none text-center">
            <div className="text-sm sm:text-base font-bold" style={{ color: suit.color, fontFamily: 'Georgia, serif' }}>{rank}</div>
            <div className="text-xs sm:text-sm" style={{ color: suit.color }}>{suit.symbol}</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl" style={{ color: suit.color }}>{suit.symbol}</span>
          </div>
          <div className="absolute bottom-2 right-2 leading-none text-center rotate-180">
            <div className="text-sm sm:text-base font-bold" style={{ color: suit.color, fontFamily: 'Georgia, serif' }}>{rank}</div>
            <div className="text-xs sm:text-sm" style={{ color: suit.color }}>{suit.symbol}</div>
          </div>
        </>
      )}
    </div>
  )
}

function Fan({ rank, small }: { rank: string; small?: boolean }) {
  return (
    <div className={cn('flex items-end justify-center', small ? 'pl-1' : 'gap-1')}>
      {SUITS.map((suit, i) => (
        <PlayingCard key={suit.symbol} rank={rank} suit={suit} rotation={ROTATIONS[i]} translateY={TRANSLATIONS[i]} small={small} />
      ))}
    </div>
  )
}

/** Mês atual no fuso do Brasil, 'AAAA-MM-01' */
function getCurrentMonth() {
  return todayISO().slice(0, 7) + '-01'
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function QuadraDoMes() {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [quadras, setQuadras] = useState<QuadraMes[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Diálogos (cada um aponta pra quadra alvo)
  const [editTarget, setEditTarget] = useState<QuadraMes | 'new' | null>(null)
  const [claimTarget, setClaimTarget] = useState<QuadraMes | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuadraMes | null>(null)
  const [planoOpen, setPlanoOpen] = useState(false)

  // Formulário
  const [rank, setRank] = useState('A')
  const [prize, setPrize] = useState('')
  const [description, setDescription] = useState('')
  const [claimedBy, setClaimedBy] = useState(NONE)

  const currentMonth = getCurrentMonth()
  const usedRanks = new Set(quadras.map((q) => q.rank))

  useEffect(() => {
    fetchQuadras()
    fetch('/api/players').then((r) => r.json()).then((d) => setPlayers(Array.isArray(d) ? d : []))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchQuadras() {
    const res = await fetch(`/api/quadra?month=${currentMonth}`, { cache: 'no-store' })
    const data = await res.json()
    setQuadras(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openEdit(target: QuadraMes | 'new') {
    if (target === 'new') {
      const firstFree = [...RANKS_ASC].reverse().find((r) => !usedRanks.has(r)) ?? 'A'
      const lastPrize = quadras[0]?.prize_amount
      setRank(firstFree)
      setPrize(lastPrize ? String(lastPrize) : '')
      setDescription('')
    } else {
      setRank(target.rank)
      setPrize(String(target.prize_amount))
      setDescription(target.description ?? '')
    }
    setEditTarget(target)
  }

  async function handleSave() {
    if (!editTarget) return
    setSaving(true)
    const body = { rank, prize_amount: parseFloat(prize.replace(',', '.')) || 0, description: description || null }
    const res = editTarget === 'new'
      ? await fetch('/api/quadra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: currentMonth, ...body }),
        })
      : await fetch(`/api/quadra/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
    setSaving(false)
    if (res.ok) {
      toast({ title: editTarget === 'new' ? 'Quadra adicionada!' : 'Quadra atualizada!' })
      setEditTarget(null)
      fetchQuadras()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: err.error ?? 'Erro ao salvar', variant: 'destructive' })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const res = await fetch(`/api/quadra/${deleteTarget.id}`, { method: 'DELETE' })
    setSaving(false)
    if (res.ok) {
      setDeleteTarget(null)
      toast({ title: 'Quadra excluída.' })
      fetchQuadras()
    } else {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  async function handleClaim() {
    if (!claimTarget) return
    setSaving(true)
    const who = claimedBy === NONE ? null : claimedBy
    const res = await fetch(`/api/quadra/${claimTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimed_by: who }),
    })
    setSaving(false)
    if (res.ok) {
      setClaimTarget(null)
      toast({ title: who ? 'Quadra reivindicada!' : 'Reivindicação removida.' })
      fetchQuadras()
    } else {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  if (loading) return null
  if (quadras.length === 0 && !isAdmin) return null

  const single = quadras.length === 1 ? quadras[0] : null

  function AdminActions({ q }: { q: QuadraMes }) {
    if (!isAdmin) return null
    return (
      <div className="flex items-center flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-gold" title="Quem fez?"
          onClick={() => { setClaimedBy(q.claimed_by ?? NONE); setClaimTarget(q) }}>
          <Trophy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Editar"
          onClick={() => openEdit(q)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" title="Excluir"
          onClick={() => setDeleteTarget(q)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  function ClaimStatus({ q, short }: { q: QuadraMes; short?: boolean }) {
    return q.players ? (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Trophy className="h-3 w-3" /> Feita por <strong>{q.players.name}</strong>
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">{short ? 'Em aberto 🃏' : 'Ninguém fez ainda — boa sorte! 🃏'}</span>
    )
  }

  return (
    <div className="rounded-xl card-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {quadras.length > 1 ? 'Quadras do Mês' : 'Quadra do Mês'}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 first-letter:uppercase">{formatMonth(currentMonth)}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPlanoOpen(true)} title="Plano anual de quadras">
              <CalendarRange className="h-4 w-4 mr-1" /> Plano
            </Button>
            {usedRanks.size < 13 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => openEdit('new')} title="Adicionar quadra neste mês">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {quadras.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma quadra neste mês.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Toque em + para adicionar, ou monte o Plano do ano para elas trocarem sozinhas.
          </p>
        </div>
      ) : single ? (
        <>
          <div className="px-4 py-8"><Fan rank={single.rank} /></div>
          <div className="px-5 pb-4 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground font-medium">Quadra de {single.rank}</span>
              <div className="flex items-center gap-1">
                {single.prize_amount > 0 && (
                  <span className="font-mono-numbers font-bold text-gold mr-1">{formatBRL(single.prize_amount)}</span>
                )}
                <AdminActions q={single} />
              </div>
            </div>
            {single.description && <p className="text-xs text-muted-foreground mt-1">{single.description}</p>}
            <div className="mt-2"><ClaimStatus q={single} /></div>
          </div>
        </>
      ) : (
        <div className="mt-4 divide-y divide-border/50 border-t border-border/50">
          {quadras.map((q) => (
            <div key={q.id} className="px-5 py-3.5">
              <div className="flex items-center gap-4">
                <div className="w-[76px] flex-shrink-0"><Fan rank={q.rank} small /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-foreground font-medium whitespace-nowrap">Quadra de {q.rank}</span>
                    {q.prize_amount > 0 && (
                      <span className="font-mono-numbers text-sm font-bold text-gold whitespace-nowrap">{formatBRL(q.prize_amount)}</span>
                    )}
                  </div>
                  {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
                  <div className="mt-0.5"><ClaimStatus q={q} short /></div>
                </div>
              </div>
              {isAdmin && <div className="flex justify-end -mr-2 -mb-1.5"><AdminActions q={q} /></div>}
            </div>
          ))}
        </div>
      )}

      {/* Adicionar / editar */}
      <Dialog open={editTarget !== null} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="card-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editTarget === 'new' ? 'Adicionar quadra' : 'Editar quadra'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Carta</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {[...RANKS_ASC].reverse().map((r) => {
                  const taken = usedRanks.has(r) && !(editTarget !== 'new' && editTarget?.rank === r)
                  return (
                    <button key={r} type="button" disabled={taken} onClick={() => setRank(r)}
                      className={cn(
                        'h-10 rounded-lg text-sm font-semibold transition-colors',
                        rank === r ? 'bg-gold text-felt' : 'bg-secondary text-foreground hover:bg-secondary/70',
                        taken && 'opacity-30 cursor-not-allowed'
                      )}>
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Prêmio (R$)</Label>
              <Input type="text" inputMode="decimal" value={prize}
                onChange={(e) => setPrize(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="bg-secondary border-border h-12 font-mono-numbers" placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Observação (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border h-12" placeholder="Ex: acumula se ninguém fizer..." />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold">
              {saving ? 'Salvando...' : editTarget === 'new' ? 'Adicionar' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quem fez */}
      <Dialog open={claimTarget !== null} onOpenChange={(v) => !v && setClaimTarget(null)}>
        <DialogContent className="card-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Quem fez a quadra de {claimTarget?.rank}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Select value={claimedBy} onValueChange={setClaimedBy}>
              <SelectTrigger className="bg-secondary border-border h-12">
                <SelectValue placeholder="Selecionar jogador..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={NONE}>Ninguém (remover)</SelectItem>
                {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleClaim} disabled={saving} className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold">
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="card-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Excluir quadra de {deleteTarget?.rank}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Ela sai da lista deste mês.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1 border-border" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button disabled={saving} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isAdmin && <QuadraPlanoDialog open={planoOpen} onOpenChange={setPlanoOpen} onSaved={fetchQuadras} />}
    </div>
  )
}
