'use client'

import { RankingRow } from '@/types'
import { formatBRL } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RankingTableProps {
  data: RankingRow[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export function RankingTable({ data }: RankingTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Nenhum dado disponível para o período selecionado.
      </div>
    )
  }

  return (
    <div className="rounded-lg card-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-10 text-muted-foreground font-mono text-xs">#</TableHead>
            <TableHead className="text-muted-foreground text-xs font-medium">Jogador</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs font-medium">Sessões</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs font-medium hidden md:table-cell">Média/Sessão</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs font-medium hidden sm:table-cell">Ganho</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs font-medium">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const saldo = row.soma_saldo
            const isPositive = saldo > 0
            const isNegative = saldo < 0

            return (
              <TableRow
                key={row.player_id}
                className={cn(
                  'border-border/40 transition-colors hover:bg-white/3',
                  index === 0 && 'bg-gold/3'
                )}
              >
                <TableCell className="font-mono text-sm w-10">
                  {index < 3 ? (
                    <span>{MEDALS[index]}</span>
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {row.name}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono-numbers text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                    {row.participacoes}
                  </span>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono-numbers text-xs text-muted-foreground">
                      gasto {formatBRL(row.media_compra)}
                    </span>
                    <span className="font-mono-numbers text-xs text-muted-foreground">
                      ganho {formatBRL(row.media_ganho)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono-numbers text-sm hidden sm:table-cell">
                  {formatBRL(row.soma_ganho)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-mono-numbers font-medium text-sm inline-flex items-center gap-1 justify-end',
                      isPositive && 'positive',
                      isNegative && 'negative',
                      !isPositive && !isNegative && 'text-muted-foreground'
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {formatBRL(saldo)}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
