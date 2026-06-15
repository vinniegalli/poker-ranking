'use client'

import { RankingRow } from '@/types'
import { formatBRL } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RankingTableProps {
  data: RankingRow[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export function RankingTable({ data }: RankingTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhum dado para o período selecionado.
      </div>
    )
  }

  return (
    <div className="rounded-lg card-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-3 px-4 py-2.5 border-b border-border/50">
        <span className="text-muted-foreground text-xs font-medium">#</span>
        <span className="text-muted-foreground text-xs font-medium">Jogador</span>
        <span className="text-muted-foreground text-xs font-medium text-right hidden sm:block">Sessões</span>
        <span className="text-muted-foreground text-xs font-medium text-right hidden sm:block">Ganho</span>
        <span className="text-muted-foreground text-xs font-medium text-right">Saldo</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {data.map((row, index) => {
          const saldo = row.soma_saldo
          const isPositive = saldo > 0
          const isNegative = saldo < 0

          return (
            <div
              key={row.player_id}
              className={cn(
                'grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-3 items-center px-4 py-3',
                index === 0 && 'bg-gold/3'
              )}
            >
              {/* Position */}
              <span className="text-sm w-8">
                {index < 3
                  ? <span className="leading-none">{MEDALS[index]}</span>
                  : <span className="font-mono text-muted-foreground">{index + 1}</span>
                }
              </span>

              {/* Name + mobile sub-info */}
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{row.name}</p>
                <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                  {row.participacoes} sessões
                </p>
              </div>

              {/* Sessions — desktop only */}
              <span className="font-mono-numbers text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded text-right hidden sm:block">
                {row.participacoes}
              </span>

              {/* Ganho — desktop only */}
              <span className="font-mono-numbers text-sm text-muted-foreground text-right hidden sm:block">
                {formatBRL(row.soma_ganho)}
              </span>

              {/* Saldo — always visible */}
              <span
                className={cn(
                  'font-mono-numbers font-semibold text-sm inline-flex items-center gap-1 justify-end',
                  isPositive && 'positive',
                  isNegative && 'negative',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive
                  ? <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  : isNegative
                  ? <TrendingDown className="h-3 w-3 flex-shrink-0" />
                  : <Minus className="h-3 w-3 flex-shrink-0" />
                }
                {formatBRL(saldo)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
