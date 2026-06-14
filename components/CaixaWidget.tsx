import { Coins } from 'lucide-react'
import { formatBRL } from '@/lib/calculations'

interface CaixaWidgetProps {
  total: number
  label?: string
}

export function CaixaWidget({ total, label = 'Saldo em Caixa' }: CaixaWidgetProps) {
  return (
    <div className="rounded-lg gold-border gold-glow bg-card p-5 flex items-center gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center">
        <Coins className="h-6 w-6 text-gold" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold text-gold mt-0.5">
          {formatBRL(total)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Premiação acumulada anual
        </p>
      </div>
    </div>
  )
}
