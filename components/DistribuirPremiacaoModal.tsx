'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/calculations'
import { useToast } from '@/hooks/use-toast'
import { RankingRow, Player } from '@/types'
import { Gift, Trophy, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  caixaTotal: number
  onDistribuido: () => void
}

const PLACEMENT_LABELS = ['1º lugar', '2º lugar', '3º lugar', '4º lugar', '5º lugar']

export function DistribuirPremiacaoModal({ caixaTotal, onDistribuido }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'ranking' | 'quadra'>('ranking')

  // Ranking state
  const [placements, setPlacements] = useState(3)
  const [minFreq, setMinFreq] = useState(60)
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [percentages, setPercentages] = useState<Record<string, string>>({})

  // Quadra state
  const [players, setPlayers] = useState<Player[]>([])
  const [quadraPlayer, setQuadraPlayer] = useState('')
  const [quadraAmount, setQuadraAmount] = useState('')

  // Shared
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch('/api/ranking').then(r => r.json()),
      fetch('/api/sessions').then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
    ]).then(([rank, sessions, pls]) => {
      setRanking(Array.isArray(rank) ? rank : [])
      const closed = Array.isArray(sessions)
        ? sessions.filter((s: { is_closed: boolean }) => s.is_closed).length
        : 0
      setTotalSessions(closed)
      setPlayers(Array.isArray(pls) ? pls : [])
    })
  }, [open])

  // Qualificados para o ranking
  const qualified = totalSessions > 0
    ? ranking
        .filter(p => (p.participacoes / totalSessions) * 100 >= minFreq)
        .slice(0, placements)
    : []

  const totalPct = qualified.reduce((s, p) => s + (parseFloat(percentages[p.player_id] || '0') || 0), 0)
  const totalAmounts = (totalPct / 100) * caixaTotal
  const overBudget = totalPct > 100

  async function handleSubmitRanking() {
    if (qualified.length === 0) {
      toast({ title: 'Nenhum jogador qualificado', variant: 'destructive' })
      return
    }
    const entries = qualified.map((p, i) => {
      const pct = parseFloat(percentages[p.player_id] || '0') || 0
      return {
        player_id: p.player_id,
        player_name: p.name,
        placement: i + 1,
        amount: Math.round((pct / 100) * caixaTotal * 100) / 100,
      }
    }).filter(e => e.amount > 0)

    if (entries.length === 0) {
      toast({ title: 'Defina ao menos uma porcentagem', variant: 'destructive' })
      return
    }

    setSaving(true)
    const res = await fetch('/api/premiacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ranking',
        date,
        description: description || `Premiação Ranking`,
        entries,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Premiação distribuída!' })
      setOpen(false)
      setPercentages({})
      setDescription('')
      onDistribuido()
    } else {
      const err = await res.json()
      toast({ title: err.error || 'Erro ao distribuir', variant: 'destructive' })
    }
  }

  async function handleSubmitQuadra() {
    if (!quadraPlayer || !quadraAmount) {
      toast({ title: 'Selecione o jogador e o valor', variant: 'destructive' })
      return
    }
    const player = players.find(p => p.id === quadraPlayer)
    if (!player) return

    setSaving(true)
    const res = await fetch('/api/premiacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quadra',
        date,
        description: description || `Quadra do Mês`,
        entries: [{
          player_id: quadraPlayer,
          player_name: player.name,
          amount: parseFloat(quadraAmount),
        }],
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Premiação registrada!' })
      setOpen(false)
      setQuadraPlayer('')
      setQuadraAmount('')
      setDescription('')
      onDistribuido()
    } else {
      const err = await res.json()
      toast({ title: err.error || 'Erro ao registrar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold text-felt hover:bg-gold/90 font-semibold h-9 px-3 text-sm" size="sm">
          <Gift className="h-3.5 w-3.5 sm:mr-2" />
          <span className="hidden sm:inline">Distribuir Premiação</span>
          <span className="sm:hidden">Prêmio</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="card-border bg-card sm:max-w-md max-h-[90dvh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Distribuir Premiação</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {(['ranking', 'quadra'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                mode === m ? 'bg-gold text-felt' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'ranking' ? <><Medal className="h-3.5 w-3.5" /> Ranking</> : <><Trophy className="h-3.5 w-3.5" /> Quadra do Mês</>}
            </button>
          ))}
        </div>

        {/* Caixa ref */}
        <div className="bg-secondary/40 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Saldo disponível</span>
          <span className="font-mono-numbers font-semibold text-gold">{formatBRL(caixaTotal)}</span>
        </div>

        {/* ─── RANKING MODE ─── */}
        {mode === 'ranking' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Colocações</Label>
                <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                  <button onClick={() => setPlacements(Math.max(1, placements - 1))}
                    className="text-foreground font-bold text-lg w-6 hover:text-gold">−</button>
                  <span className="flex-1 text-center font-mono-numbers font-semibold text-foreground">{placements}</span>
                  <button onClick={() => setPlacements(Math.min(5, placements + 1))}
                    className="text-gold font-bold text-lg w-6 hover:text-gold/70">+</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Freq. mínima</Label>
                <div className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-2">
                  <Input
                    type="number" min={0} max={100}
                    value={minFreq}
                    onChange={e => setMinFreq(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="bg-transparent border-0 p-0 h-auto font-mono-numbers font-semibold text-foreground text-center w-12 focus-visible:ring-0"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Qualified players */}
            {totalSessions === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Carregando...</p>
            ) : qualified.length === 0 ? (
              <div className="rounded-lg bg-secondary/40 px-4 py-4 text-center">
                <p className="text-muted-foreground text-sm">Nenhum jogador com ≥{minFreq}% de frequência.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Reduza a frequência mínima.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Qualificados ({qualified.length}/{placements})
                  {qualified.length < placements && (
                    <span className="text-yellow-500 ml-1">— menos que o solicitado</span>
                  )}
                </p>
                {qualified.map((p, i) => {
                  const freq = Math.round((p.participacoes / totalSessions) * 100)
                  const pct = parseFloat(percentages[p.player_id] || '0') || 0
                  const computed = Math.round((pct / 100) * caixaTotal * 100) / 100
                  return (
                    <div key={p.player_id} className="flex items-center gap-3 bg-secondary/40 rounded-lg px-3 py-2.5">
                      <span className="text-xs text-muted-foreground w-12 flex-shrink-0">{PLACEMENT_LABELS[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{freq}% freq · {p.participacoes} sessões</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {pct > 0 && (
                          <span className="text-xs text-muted-foreground font-mono-numbers">{formatBRL(computed)}</span>
                        )}
                        <div className="flex items-center gap-1 w-20">
                          <Input
                            type="number" min={0} max={100} step={1}
                            value={percentages[p.player_id] ?? ''}
                            onChange={e => setPercentages(a => ({ ...a, [p.player_id]: e.target.value }))}
                            placeholder="0"
                            className="bg-transparent border-b border-border rounded-none px-1 h-7 font-mono-numbers text-sm focus-visible:ring-0 focus-visible:border-gold text-right"
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Total */}
                <div className="flex items-center justify-between px-3 pt-1">
                  <span className="text-xs text-muted-foreground">
                    Total ({Math.round(totalPct)}%)
                    {overBudget && <span className="text-yellow-500 ml-1">— ultrapassa 100%</span>}
                  </span>
                  <span className={cn('font-mono-numbers font-semibold text-sm', overBudget ? 'negative' : 'text-foreground')}>
                    {formatBRL(totalAmounts)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Descrição (opcional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Premiação anual 2026" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border" />
            </div>

            <Button
              onClick={handleSubmitRanking}
              disabled={saving || qualified.length === 0 || overBudget || totalPct === 0}
              className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold"
            >
              {saving ? 'Distribuindo...' : `Confirmar · ${Math.round(totalPct)}% = ${formatBRL(totalAmounts)}`}
            </Button>
          </div>
        )}

        {/* ─── QUADRA MODE ─── */}
        {mode === 'quadra' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Jogador</Label>
              <Select value={quadraPlayer} onValueChange={setQuadraPlayer}>
                <SelectTrigger className="bg-secondary border-border h-12">
                  <SelectValue placeholder="Quem fez a quadra?" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Valor (R$)</Label>
              <Input
                type="number" step={0.01} min={0.01}
                value={quadraAmount}
                onChange={e => setQuadraAmount(e.target.value)}
                placeholder="0,00"
                className="bg-secondary border-border h-12 font-mono-numbers"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Descrição (opcional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Quadra de Ases - junho/26" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border" />
            </div>

            {quadraAmount && parseFloat(quadraAmount) > caixaTotal && (
              <p className="text-xs negative">Valor acima do saldo em caixa ({formatBRL(caixaTotal)})</p>
            )}

            <Button
              onClick={handleSubmitQuadra}
              disabled={saving || !quadraPlayer || !quadraAmount || parseFloat(quadraAmount) > caixaTotal}
              className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold"
            >
              {saving ? 'Registrando...' : `Confirmar · ${quadraAmount ? formatBRL(parseFloat(quadraAmount) || 0) : 'R$0,00'}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
