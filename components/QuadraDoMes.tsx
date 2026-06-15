'use client'

import { useEffect, useState } from 'react'
import { QuadraMes, Player } from '@/types'
import { formatBRL } from '@/lib/calculations'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, Trophy, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

const SUITS = [
  { symbol: '♠', label: 'Espadas', color: '#1c1917' },
  { symbol: '♥', label: 'Copas', color: '#dc2626' },
  { symbol: '♦', label: 'Ouros', color: '#dc2626' },
  { symbol: '♣', label: 'Paus', color: '#1c1917' },
]

const ROTATIONS = ['-4deg', '-1.5deg', '1.5deg', '4deg']
const TRANSLATIONS = ['-6px', '-2px', '2px', '6px']

interface PlayingCardProps {
  rank: string
  suit: { symbol: string; color: string }
  rotation: string
  translateY: string
}

function PlayingCard({ rank, suit, rotation, translateY }: PlayingCardProps) {
  return (
    <div
      className="relative w-[72px] h-[100px] sm:w-[84px] sm:h-[116px] bg-[#F5F0E8] rounded-xl shadow-2xl flex flex-col select-none flex-shrink-0"
      style={{
        transform: `rotate(${rotation}) translateY(${translateY})`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top-left */}
      <div className="absolute top-2 left-2 leading-none text-center">
        <div className="text-sm sm:text-base font-bold" style={{ color: suit.color, fontFamily: 'Georgia, serif' }}>{rank}</div>
        <div className="text-xs sm:text-sm" style={{ color: suit.color }}>{suit.symbol}</div>
      </div>

      {/* Center suit */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl" style={{ color: suit.color }}>{suit.symbol}</span>
      </div>

      {/* Bottom-right (rotated) */}
      <div className="absolute bottom-2 right-2 leading-none text-center rotate-180">
        <div className="text-sm sm:text-base font-bold" style={{ color: suit.color, fontFamily: 'Georgia, serif' }}>{rank}</div>
        <div className="text-xs sm:text-sm" style={{ color: suit.color }}>{suit.symbol}</div>
      </div>
    </div>
  )
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function QuadraDoMes() {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [quadra, setQuadra] = useState<QuadraMes | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form state
  const [rank, setRank] = useState('A')
  const [prize, setPrize] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Claim state
  const [claimedBy, setClaimedBy] = useState('')

  const currentMonth = getCurrentMonth()

  useEffect(() => {
    fetchQuadra()
    fetch('/api/players').then(r => r.json()).then(setPlayers)
  }, [])

  async function fetchQuadra() {
    setLoading(true)
    const res = await fetch(`/api/quadra?month=${currentMonth}`)
    const data = await res.json()
    setQuadra(Array.isArray(data) && data.length > 0 ? data[0] : null)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const body = { rank, prize_amount: parseFloat(prize) || 0, description: description || null }

    if (quadra) {
      const res = await fetch(`/api/quadra/${quadra.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setQuadra(await res.json()); toast({ title: 'Quadra atualizada!' }) }
    } else {
      const res = await fetch('/api/quadra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth, ...body }),
      })
      if (res.ok) { setQuadra(await res.json()); toast({ title: 'Quadra do mês configurada!' }) }
    }

    setSaving(false)
    setConfigOpen(false)
  }

  async function handleDelete() {
    if (!quadra) return
    setSaving(true)
    const res = await fetch(`/api/quadra/${quadra.id}`, { method: 'DELETE' })
    setSaving(false)
    if (res.ok) {
      setQuadra(null)
      setDeleteOpen(false)
      toast({ title: 'Quadra excluída.' })
    } else {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  async function handleClaim() {
    if (!quadra) return
    setSaving(true)
    const res = await fetch(`/api/quadra/${quadra.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimed_by: claimedBy || null }),
    })
    setSaving(false)
    if (res.ok) {
      setQuadra(await res.json())
      setClaimOpen(false)
      toast({ title: claimedBy ? 'Quadra reivindicada!' : 'Reivindicação removida.' })
    }
  }

  if (loading) return null
  if (!quadra && !isAdmin) return null

  const claimedPlayer = quadra?.players

  return (
    <div className="rounded-xl card-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Quadra do Mês
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 capitalize">
            {quadra ? formatMonth(quadra.month) : formatMonth(currentMonth)}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {quadra && (
              <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-gold">
                    <Trophy className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-border bg-card sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Reivindicar quadra</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <p className="text-sm text-muted-foreground">
                      Quem fez a quadra de <strong className="text-foreground">{quadra.rank}</strong>?
                    </p>
                    <Select value={claimedBy} onValueChange={setClaimedBy}>
                      <SelectTrigger className="bg-secondary border-border h-12">
                        <SelectValue placeholder="Selecionar jogador..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="">Nenhum (remover)</SelectItem>
                        {players.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleClaim}
                      disabled={saving}
                      className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold"
                    >
                      {saving ? 'Salvando...' : 'Confirmar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {quadra && (
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-border bg-card sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Excluir quadra do mês?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    A quadra de <strong className="text-foreground">{quadra.rank}</strong> deste mês será removida permanentemente.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" className="flex-1 border-border" onClick={() => setDeleteOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      disabled={saving}
                      className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      {saving ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={configOpen} onOpenChange={(v) => {
              if (v && quadra) { setRank(quadra.rank); setPrize(String(quadra.prize_amount)); setDescription(quadra.description ?? '') }
              setConfigOpen(v)
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  {quadra ? <Settings className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="card-border bg-card sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">
                    {quadra ? 'Editar quadra' : 'Configurar quadra do mês'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Rank</Label>
                    <Select value={rank} onValueChange={setRank}>
                      <SelectTrigger className="bg-secondary border-border h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {RANKS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Prêmio (R$)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={prize}
                      onChange={(e) => setPrize(e.target.value)}
                      className="bg-secondary border-border h-12 font-mono-numbers"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Observação (opcional)</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-secondary border-border h-12"
                      placeholder="Ex: Quadra de Ases acumula..."
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold"
                  >
                    {saving ? 'Salvando...' : quadra ? 'Salvar' : 'Configurar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {!quadra ? (
        <div className="px-5 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma quadra configurada para este mês.
          </p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Clique em + para configurar.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="flex items-end justify-center gap-1 px-4 py-8">
            {SUITS.map((suit, i) => (
              <PlayingCard
                key={suit.symbol}
                rank={quadra.rank}
                suit={suit}
                rotation={ROTATIONS[i]}
                translateY={TRANSLATIONS[i]}
              />
            ))}
          </div>

          {/* Info */}
          <div className="px-5 pb-5 space-y-2 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground font-medium">
                Quadra de {quadra.rank}s
              </span>
              {quadra.prize_amount > 0 && (
                <span className="font-mono-numbers font-bold text-gold">
                  {formatBRL(quadra.prize_amount)}
                </span>
              )}
            </div>

            {quadra.description && (
              <p className="text-xs text-muted-foreground">{quadra.description}</p>
            )}

            <div className={cn(
              'flex items-center gap-2 text-sm mt-1',
              claimedPlayer ? 'text-emerald-400' : 'text-muted-foreground'
            )}>
              {claimedPlayer ? (
                <>
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Reivindicada por <strong>{claimedPlayer.name}</strong></span>
                </>
              ) : (
                <>
                  <span className="text-lg">🃏</span>
                  <span>Não reivindicada — boa sorte!</span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
