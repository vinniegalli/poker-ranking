'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/lib/calculations'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Trash2, Medal, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PremiacaoEntry {
  id: string
  player_name: string
  placement: number | null
  amount: number
}

interface Distribution {
  distribution_id: string
  type: 'ranking' | 'quadra'
  date: string
  description: string | null
  total: number
  entries: PremiacaoEntry[]
}

interface Props {
  refreshKey?: number
  onDeleted?: () => void
}

const PLACEMENT_LABELS = ['1º', '2º', '3º', '4º', '5º']

export function PremiacoesSection({ refreshKey, onDeleted }: Props) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { fetchPremiacoes() }, [refreshKey])

  async function fetchPremiacoes() {
    const res = await fetch('/api/premiacoes')
    const data = await res.json()
    setDistributions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleDelete(distributionId: string) {
    setDeleting(distributionId)
    const res = await fetch(`/api/premiacoes/${distributionId}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      toast({ title: 'Premiação revertida.' })
      fetchPremiacoes()
      onDeleted?.()
    } else {
      toast({ title: 'Erro ao reverter', variant: 'destructive' })
    }
  }

  if (loading) return null
  if (distributions.length === 0) return null

  return (
    <div className="rounded-lg card-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Histórico de Premiações
        </p>
      </div>

      <div className="divide-y divide-border/50">
        {distributions.map((d) => {
          const dateFormatted = format(
            new Date(d.date + 'T12:00:00'),
            "d 'de' MMMM 'de' yyyy",
            { locale: ptBR }
          )
          const isRanking = d.type === 'ranking'

          return (
            <div key={d.distribution_id} className="px-5 py-4">
              {/* Header da distribuição */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {isRanking
                    ? <Medal className="h-4 w-4 text-gold flex-shrink-0" />
                    : <Trophy className="h-4 w-4 text-gold flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {d.description || (isRanking ? 'Premiação Ranking' : 'Quadra do Mês')}
                    </p>
                    <p className="text-xs text-muted-foreground">{dateFormatted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono-numbers font-semibold text-sm negative">
                    −{formatBRL(d.total)}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={deleting === d.distribution_id}
                      onClick={() => handleDelete(d.distribution_id)}
                      title="Reverter premiação"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Entries */}
              <div className="space-y-1 ml-6">
                {d.entries
                  .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99))
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {e.placement != null && (
                          <span className="text-xs text-muted-foreground/70 w-5">{PLACEMENT_LABELS[e.placement - 1]}</span>
                        )}
                        <span className="text-foreground/80">{e.player_name}</span>
                      </div>
                      <span className="font-mono-numbers text-sm positive">+{formatBRL(e.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
