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
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RankingTableProps {
  data: RankingRow[]
}

export function RankingTable({ data }: RankingTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Nenhum dado disponível para o período selecionado.
      </div>
    )
  }

  return (
    <div className="rounded-lg gold-border gold-glow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-10 text-muted-foreground font-mono text-xs">#</TableHead>
            <TableHead className="text-muted-foreground">Jogador</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">Sessões</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">Soma Compra</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">Soma Ganho</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">Saldo</TableHead>
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
                  'border-border/30 transition-colors',
                  index === 0 && 'bg-gold/5',
                  'hover:bg-white/5'
                )}
              >
                <TableCell className="font-mono text-muted-foreground text-sm">
                  {index === 0 ? (
                    <span className="text-gold font-bold">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-slate-400">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-amber-700">🥉</span>
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {row.name}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-xs bg-secondary/60">
                    {row.participacoes}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono-numbers text-sm text-muted-foreground">
                  {formatBRL(row.soma_compra)}
                </TableCell>
                <TableCell className="text-right font-mono-numbers text-sm text-foreground">
                  {formatBRL(row.soma_ganho)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-mono-numbers font-semibold text-sm flex items-center justify-end gap-1',
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
