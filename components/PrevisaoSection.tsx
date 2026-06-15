'use client'

import { useEffect, useState } from 'react'
import { RankingChart } from '@/components/RankingChart'
import { formatBRL } from '@/lib/calculations'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { RankingRow } from '@/types'
import { cn } from '@/lib/utils'
import { BarChart2, Trophy, Pencil } from 'lucide-react'

interface Previsao {
  id: string
  min_freq: number
  placements: number
  percentages: number[]
  updated_at: string
}

interface Props {
  ranking: RankingRow[]
  caixaTotal: number
  year?: string
}

const MEDALS = ['🥇', '🥈', '🥉', '4º', '5º']

export function PrevisaoSection({ ranking, caixaTotal, year }: Props) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [previsao, setPrevisao] = useState<Previsao | null>(null)
  const [totalSessions, setTotalSessions] = useState(0)
  const [view, setView] = useState<'previsao' | 'grafico'>('previsao')
  const [loading, setLoading] = useState(true)

  // Edit form
  const [editOpen, setEditOpen] = useState(false)
  const [editMinFreq, setEditMinFreq] = useState(60)
  const [editPlacements, setEditPlacements] = useState(3)
  const [editPcts, setEditPcts] = useState<string[]>(['50', '30', '20'])
  const [saving, setSaving] = useState(false)

  // Fetch previsão config once on mount
  useEffect(() => {
    fetch('/api/premio-previsao')
      .then(r => r.json())
      .then(pv => { setPrevisao(pv ?? null); setLoading(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch sessions count whenever ranking updates (closed session → ranking changes)
  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(sessions => {
        setTotalSessions(
          Array.isArray(sessions)
            ? sessions.filter((s: { is_closed: boolean }) => s.is_closed).length
            : 0
        )
      })
  }, [ranking]) // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit() {
    if (previsao) {
      setEditMinFreq(previsao.min_freq)
      setEditPlacements(previsao.placements)
      setEditPcts(previsao.percentages.map(String))
    } else {
      setEditMinFreq(60)
      setEditPlacements(3)
      setEditPcts(['50', '30', '20'])
    }
    setEditOpen(true)
  }

  function handlePlacementsChange(n: number) {
    setEditPlacements(n)
    setEditPcts(prev => {
      const next = [...prev]
      while (next.length < n) next.push('')
      return next.slice(0, n)
    })
  }

  const editTotalPct = editPcts.reduce((s, v) => s + (parseFloat(v) || 0), 0)

  async function handleSave() {
    const percentages = editPcts.map(v => parseFloat(v) || 0)
    setSaving(true)
    const res = await fetch('/api/premio-previsao', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_freq: editMinFreq, placements: editPlacements, percentages }),
    })
    setSaving(false)
    if (res.ok) {
      // Use PUT response directly to avoid stale GET cache
      const saved = await res.json()
      setPrevisao(saved)
      toast({ title: 'Previsão atualizada!' })
      setEditOpen(false)
    } else {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const qualifiers = previsao && totalSessions > 0
    ? ranking
        .filter(p => (p.participacoes / totalSessions) * 100 >= previsao.min_freq)
        .slice(0, previsao.placements)
    : []

  const totalPrize = qualifiers.reduce((s, _, i) => {
    const pct = previsao?.percentages[i] ?? 0
    return s + Math.round((pct / 100) * caixaTotal * 100) / 100
  }, 0)

  const totalConfigPct = previsao?.percentages.reduce((s, v) => s + v, 0) ?? 0

  return (
    <div className="space-y-3">
      {/* Toggle + edit button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setView('previsao')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
              view === 'previsao'
                ? 'bg-gold text-felt shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Trophy className="h-3 w-3" />
            Previsão
          </button>
          <button
            onClick={() => setView('grafico')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
              view === 'grafico'
                ? 'bg-gold text-felt shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart2 className="h-3 w-3" />
            Evolução
          </button>
        </div>

        {isAdmin && view === 'previsao' && (
          <Button
            variant="ghost" size="sm"
            onClick={openEdit}
            className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            {previsao ? 'Editar previsão' : 'Configurar previsão'}
          </Button>
        )}
      </div>

      {/* Content */}
      {view === 'grafico' ? (
        <RankingChart year={year} />
      ) : (
        <div className="rounded-lg card-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : !previsao ? (
            <div className="p-8 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma previsão configurada.</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="mt-3 border-border" onClick={openEdit}>
                  Configurar previsão
                </Button>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Config bar */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs bg-secondary/40 rounded-lg px-3 py-2.5">
                <span className="text-muted-foreground">
                  Freq. mín. <strong className="text-foreground">{previsao.min_freq}%</strong>
                </span>
                <span className="text-border hidden sm:inline">·</span>
                <span className="text-muted-foreground">
                  Top <strong className="text-foreground">{previsao.placements}</strong>
                </span>
                <span className="text-border hidden sm:inline">·</span>
                <span className="font-mono-numbers text-muted-foreground">
                  {previsao.percentages.map(p => `${p}%`).join(' / ')}
                </span>
                <span className="ml-auto">
                  <span className="text-muted-foreground">total </span>
                  <strong className={cn(
                    'font-mono-numbers',
                    totalConfigPct === 100 ? 'text-emerald-400' : 'text-yellow-500'
                  )}>
                    {totalConfigPct}%
                  </strong>
                </span>
              </div>

              {/* Qualifiers */}
              {totalSessions === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma sessão encerrada ainda.
                </p>
              ) : qualifiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum jogador com ≥{previsao.min_freq}% de frequência em {totalSessions} sessões.
                </p>
              ) : (
                <div className="space-y-2">
                  {qualifiers.map((p, i) => {
                    const pct = previsao.percentages[i] ?? 0
                    const prize = Math.round((pct / 100) * caixaTotal * 100) / 100
                    const freq = Math.round((p.participacoes / totalSessions) * 100)

                    return (
                      <div key={p.player_id} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-3">
                        <span className="text-lg w-8 text-center flex-shrink-0 leading-none">{MEDALS[i]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {freq}% frequência · {p.participacoes}/{totalSessions} sessões
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono-numbers font-bold text-gold">{formatBRL(prize)}</p>
                          <p className="text-xs text-muted-foreground">{pct}% do caixa</p>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center justify-between px-3 pt-1">
                    <span className="text-xs text-muted-foreground">Total previsto</span>
                    <span className="font-mono-numbers font-semibold text-gold text-sm">
                      {formatBRL(totalPrize)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm card-border bg-card" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Previsão de Premiação</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Min frequency */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Frequência mínima
              </Label>
              <div className="flex items-center gap-2 bg-secondary rounded-lg px-4 py-2.5">
                <button
                  onClick={() => setEditMinFreq(Math.max(0, editMinFreq - 5))}
                  className="text-foreground/60 hover:text-foreground font-bold text-xl w-6 leading-none"
                >−</button>
                <div className="flex-1 flex items-center justify-center gap-1">
                  <Input
                    type="number" min={0} max={100}
                    value={editMinFreq}
                    onChange={e => setEditMinFreq(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="bg-transparent border-0 p-0 h-auto font-mono-numbers font-bold text-xl text-foreground text-center w-16 focus-visible:ring-0"
                  />
                  <span className="text-muted-foreground font-semibold">%</span>
                </div>
                <button
                  onClick={() => setEditMinFreq(Math.min(100, editMinFreq + 5))}
                  className="text-gold hover:text-gold/70 font-bold text-xl w-6 leading-none"
                >+</button>
              </div>
            </div>

            {/* Placements count */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Colocações premiadas
              </Label>
              <div className="flex items-center gap-2 bg-secondary rounded-lg px-4 py-2.5">
                <button
                  onClick={() => handlePlacementsChange(Math.max(1, editPlacements - 1))}
                  className="text-foreground/60 hover:text-foreground font-bold text-xl w-6 leading-none"
                >−</button>
                <span className="flex-1 text-center font-mono-numbers font-bold text-xl text-foreground">
                  {editPlacements}
                </span>
                <button
                  onClick={() => handlePlacementsChange(Math.min(5, editPlacements + 1))}
                  className="text-gold hover:text-gold/70 font-bold text-xl w-6 leading-none"
                >+</button>
              </div>
            </div>

            {/* Percentage per placement */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                % do caixa por colocação
              </Label>
              <div className="space-y-2">
                {editPcts.map((pct, i) => {
                  const computed = caixaTotal > 0
                    ? Math.round(((parseFloat(pct) || 0) / 100) * caixaTotal * 100) / 100
                    : null

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-base w-7 text-center flex-shrink-0">{MEDALS[i]}</span>
                      <div className="flex-1 flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-2">
                        <Input
                          type="number" min={0} max={100} step={1}
                          value={pct}
                          onChange={e => {
                            const next = [...editPcts]
                            next[i] = e.target.value
                            setEditPcts(next)
                          }}
                          placeholder="0"
                          className="bg-transparent border-0 p-0 h-auto font-mono-numbers font-semibold text-foreground text-right focus-visible:ring-0 w-full"
                        />
                        <span className="text-muted-foreground text-sm flex-shrink-0">%</span>
                      </div>
                      {computed !== null && (parseFloat(pct) || 0) > 0 && (
                        <span className="text-xs text-muted-foreground font-mono-numbers w-20 text-right flex-shrink-0">
                          {formatBRL(computed)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Total % indicator */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className={cn(
                  'font-mono-numbers font-semibold text-sm',
                  editTotalPct === 100
                    ? 'text-emerald-400'
                    : editTotalPct > 100
                    ? 'negative'
                    : 'text-yellow-500'
                )}>
                  {editTotalPct}%
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    {editTotalPct === 100
                      ? '✓'
                      : editTotalPct < 100
                      ? `(faltam ${100 - editTotalPct}%)`
                      : `(excede ${editTotalPct - 100}%)`}
                  </span>
                </span>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || editTotalPct === 0}
              className="w-full h-11 bg-gold text-felt hover:bg-gold/90 font-semibold"
            >
              {saving ? 'Salvando...' : 'Salvar previsão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
