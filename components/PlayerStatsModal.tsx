'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatBRL } from '@/lib/calculations'
import { Badge, BadgeTheme } from '@/lib/badges'
import { RankingRow } from '@/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const THEME_STYLES: Record<BadgeTheme, string> = {
  sequencia: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  estilo: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  recorde: 'bg-gold/10 text-gold border-gold/20',
  participacao: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  premio: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

interface PlayerStats {
  participacoes: number
  soma_saldo: number
  media_saldo: number
  media_compra: number
  media_ganho: number
  melhor_sessao: { date: string; saldo: number } | null
  pior_sessao: { date: string; saldo: number } | null
  maior_ganho: { date: string; soma_ganho: number } | null
  maior_gasto: { date: string; soma_compra: number } | null
  melhor_mes: { mes: string; saldo: number } | null
  pior_mes: { mes: string; saldo: number } | null
  streak_atual: number
  melhor_sequencia: number
}

interface PlayerStatsModalProps {
  player: RankingRow
  rank: number
  open: boolean
  onClose: () => void
}

function StatRow({ label, value, colored }: { label: string; value: string; colored?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('font-mono-numbers text-sm font-medium', colored ? 'text-foreground' : 'text-foreground')}>
        {value}
      </span>
    </div>
  )
}

function SaldoValue({ value }: { value: number }) {
  return (
    <span className={cn(
      'font-mono-numbers text-sm font-medium inline-flex items-center gap-1',
      value > 0 ? 'positive' : value < 0 ? 'negative' : 'text-muted-foreground'
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {formatBRL(value)}
    </span>
  )
}

function fmtDate(d: string) {
  try { return format(new Date(d + 'T12:00:00'), "d 'de' MMM yy", { locale: ptBR }) }
  catch { return d }
}

function fmtMes(m: string) {
  try { return format(new Date(m + '-01T12:00:00'), "MMMM 'de' yyyy", { locale: ptBR }) }
  catch { return m }
}

export function PlayerStatsModal({ player, rank, open, onClose }: PlayerStatsModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(false)
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setActiveBadgeId(null)
    Promise.all([
      fetch(`/api/players/${player.player_id}/stats`).then((r) => r.json()),
      fetch(`/api/badges?player_id=${player.player_id}`).then((r) => r.json()),
    ])
      .then(([statsData, badgesData]) => {
        setStats(statsData)
        setBadges(Array.isArray(badgesData) ? badgesData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open, player.player_id])

  const MEDALS = ['🥇', '🥈', '🥉']
  const medal = rank <= 3 ? MEDALS[rank - 1] : `#${rank}`

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="card-border bg-card w-full max-w-sm mx-auto max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg flex items-center gap-2">
            <span className="text-base">{medal}</span>
            {player.name}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
        )}

        {!loading && stats && (
          <div className="space-y-5 pt-1">
            {/* Saldo total em destaque */}
            <div className={cn(
              'rounded-xl p-4 text-center',
              player.soma_saldo > 0 ? 'bg-emerald-500/8 border border-emerald-500/15'
                : player.soma_saldo < 0 ? 'bg-red-500/8 border border-red-500/15'
                : 'bg-secondary/50'
            )}>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Saldo total</p>
              <SaldoValue value={player.soma_saldo} />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.participacoes} sessões
                {stats.streak_atual >= 2 && (
                  <span className="text-amber-400 ml-2">🔥 {stats.streak_atual} seguidas</span>
                )}
              </p>
            </div>

            {/* Conquistas */}
            {badges.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Conquistas</p>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveBadgeId((cur) => (cur === b.id ? null : b.id))}
                        onMouseEnter={() => setActiveBadgeId(b.id)}
                        className={cn(
                          'h-10 w-10 rounded-full border flex items-center justify-center text-lg transition-transform',
                          THEME_STYLES[b.theme],
                          activeBadgeId === b.id ? 'ring-2 ring-gold scale-110' : 'hover:scale-105'
                        )}
                      >
                        {b.icon}
                      </button>
                    ))}
                  </div>
                  {activeBadgeId && (() => {
                    const active = badges.find((b) => b.id === activeBadgeId)
                    if (!active) return null
                    return (
                      <p className="text-xs text-foreground/80 mt-3 pt-3 border-t border-border/30">
                        <span className="font-medium text-foreground">{active.icon} {active.label}</span>
                        {' — '}{active.description}
                      </p>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Médias */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Médias por sessão</p>
              <div className="bg-secondary/30 rounded-lg px-3 py-1">
                <StatRow label="Média de saldo" value={formatBRL(stats.media_saldo)} />
                <StatRow label="Média de gasto" value={formatBRL(stats.media_compra)} />
                <StatRow label="Média de ganho" value={formatBRL(stats.media_ganho)} />
              </div>
            </div>

            {/* Records de sessão */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Recordes</p>
              <div className="bg-secondary/30 rounded-lg px-3 py-1">
                {stats.melhor_sessao && (
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Melhor sessão</p>
                      <p className="text-xs text-muted-foreground/60">{fmtDate(stats.melhor_sessao.date)}</p>
                    </div>
                    <SaldoValue value={stats.melhor_sessao.saldo} />
                  </div>
                )}
                {stats.pior_sessao && (
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Pior sessão</p>
                      <p className="text-xs text-muted-foreground/60">{fmtDate(stats.pior_sessao.date)}</p>
                    </div>
                    <SaldoValue value={stats.pior_sessao.saldo} />
                  </div>
                )}
                {stats.maior_ganho && (
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Maior ganho</p>
                      <p className="text-xs text-muted-foreground/60">{fmtDate(stats.maior_ganho.date)}</p>
                    </div>
                    <span className="font-mono-numbers text-sm font-medium positive">
                      {formatBRL(stats.maior_ganho.soma_ganho)}
                    </span>
                  </div>
                )}
                {stats.maior_gasto && (
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Maior gasto</p>
                      <p className="text-xs text-muted-foreground/60">{fmtDate(stats.maior_gasto.date)}</p>
                    </div>
                    <span className="font-mono-numbers text-sm font-medium negative">
                      {formatBRL(stats.maior_gasto.soma_compra)}
                    </span>
                  </div>
                )}
                {stats.melhor_sequencia >= 2 && (
                  <div className="flex items-center justify-between py-2">
                    <p className="text-xs text-muted-foreground">Maior sequência de vitórias</p>
                    <span className="text-sm font-medium text-amber-400">🔥 {stats.melhor_sequencia}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Melhor/pior mês */}
            {(stats.melhor_mes || stats.pior_mes) && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Por mês</p>
                <div className="bg-secondary/30 rounded-lg px-3 py-1">
                  {stats.melhor_mes && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor mês</p>
                        <p className="text-xs text-muted-foreground/60 capitalize">{fmtMes(stats.melhor_mes.mes)}</p>
                      </div>
                      <SaldoValue value={stats.melhor_mes.saldo} />
                    </div>
                  )}
                  {stats.pior_mes && stats.pior_mes.mes !== stats.melhor_mes?.mes && (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Pior mês</p>
                        <p className="text-xs text-muted-foreground/60 capitalize">{fmtMes(stats.pior_mes.mes)}</p>
                      </div>
                      <SaldoValue value={stats.pior_mes.saldo} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
