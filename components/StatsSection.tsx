'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/lib/calculations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Stat {
  icon: string
  label: string
  player: string
  value: number
  type: 'currency' | 'sessions' | 'buyins' | 'percent' | 'avg_buyins'
  date?: string
  sub?: string
}

function formatValue(stat: Stat): string {
  switch (stat.type) {
    case 'currency': return formatBRL(Math.abs(stat.value))
    case 'percent': return `${stat.value}%`
    case 'sessions': return `${stat.value}×`
    case 'buyins': return `${stat.value}×`
    case 'avg_buyins': return `${stat.value}×`
    default: return String(stat.value)
  }
}

function isNegative(stat: Stat) {
  return stat.type === 'currency' && stat.value < 0
}

export function StatsSection() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => { setStats(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  if (loading || stats.length === 0) return null

  return (
    <div className="rounded-lg card-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Hall da Fama
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">Recordes de todas as sessões encerradas</p>
      </div>

      <div className="divide-y divide-border/50">
        {stats.map((stat, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4">
            <span className="text-2xl w-8 flex-shrink-0 text-center">{stat.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-medium text-foreground truncate">{stat.player}</p>
              {stat.sub && <p className="text-xs text-muted-foreground/70">{stat.sub}</p>}
              {stat.date && (
                <p className="text-xs text-muted-foreground/60">
                  {format(new Date(stat.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <span className={`font-mono-numbers font-bold text-base flex-shrink-0 ${isNegative(stat) ? 'negative' : 'text-gold'}`}>
              {isNegative(stat) && '−'}{formatValue(stat)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
