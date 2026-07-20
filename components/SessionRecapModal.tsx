'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatBRL } from '@/lib/calculations'
import { Badge, BadgeTheme } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { Trophy, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react'

const THEME_STYLES: Record<BadgeTheme, string> = {
  sequencia: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  estilo: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  recorde: 'bg-gold/10 text-gold border-gold/20',
  participacao: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  premio: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

interface RecapPlayer {
  player_id: string
  name: string
  saldo: number
  posBefore: number | null
  posAfter: number | null
  delta: number | null
  newBadges: Badge[]
}

interface Recap {
  session: { id: string; date: string }
  mvp: { name: string; saldo: number } | null
  players: RecapPlayer[]
}

interface SessionRecapModalProps {
  sessionId: string | null
  open: boolean
  onClose: () => void
}

function PositionChange({ posBefore, delta }: { posBefore: number | null; delta: number | null }) {
  if (posBefore === null) {
    return <span className="text-xs text-blue-400 font-medium">novo</span>
  }
  if (delta === null || delta === 0) {
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
        <Minus className="h-3 w-3" /> #{posBefore}
      </span>
    )
  }
  if (delta > 0) {
    return (
      <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-0.5">
        <ArrowUp className="h-3 w-3" /> {delta}
      </span>
    )
  }
  return (
    <span className="text-xs text-red-400 font-medium inline-flex items-center gap-0.5">
      <ArrowDown className="h-3 w-3" /> {Math.abs(delta)}
    </span>
  )
}

export function SessionRecapModal({ sessionId, open, onClose }: SessionRecapModalProps) {
  const [recap, setRecap] = useState<Recap | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !sessionId) return
    setLoading(true)
    fetch(`/api/sessions/${sessionId}/resumo`)
      .then((r) => r.json())
      .then((d) => { setRecap(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, sessionId])

  const dateFormatted = recap
    ? format(new Date(recap.session.date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
    : ''

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="card-border bg-card w-full max-w-sm mx-auto max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg capitalize">
            {loading ? 'Resumo da sessão' : dateFormatted}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
        )}

        {!loading && recap && (
          <div className="space-y-5 pt-1">
            {recap.mvp && (
              <div className="rounded-xl bg-gold/5 border border-gold/20 px-4 py-3 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">MVP da noite</p>
                  <p className="text-sm font-medium text-foreground truncate">{recap.mvp.name}</p>
                </div>
                <span className="font-mono-numbers font-semibold text-sm positive flex-shrink-0">
                  +{formatBRL(recap.mvp.saldo)}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Resultado</p>
              <div className="bg-secondary/30 rounded-lg divide-y divide-border/30">
                {recap.players.map((p) => (
                  <div key={p.player_id} className="px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                      <span className={cn(
                        'font-mono-numbers text-sm font-semibold flex-shrink-0',
                        p.saldo > 0 ? 'positive' : p.saldo < 0 ? 'negative' : 'text-muted-foreground'
                      )}>
                        {formatBRL(p.saldo)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <PositionChange posBefore={p.posBefore} delta={p.delta} />
                      {p.newBadges.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {p.newBadges.map((b) => (
                            <span
                              key={b.id}
                              title={`${b.label} — ${b.description}`}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                                THEME_STYLES[b.theme]
                              )}
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {b.icon} {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
