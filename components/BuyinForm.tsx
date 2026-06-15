'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAdmin } from '@/hooks/use-admin'
import { SessionPlayer, Player } from '@/types'
import { calcSomaCompra, calcTotalPago, formatBRL } from '@/lib/calculations'
import { useToast } from '@/hooks/use-toast'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuyinFormProps {
  sessionPlayer: SessionPlayer & { players: Player }
  onUpdate: () => void
}

export function BuyinForm({ sessionPlayer, onUpdate }: BuyinFormProps) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [buyinCount, setBuyinCount] = useState(sessionPlayer.buyin_count)
  const [somaGanho, setSomaGanho] = useState(sessionPlayer.soma_ganho)
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  async function handleSave() {
    setLoading(true)
    const somaCompra = calcSomaCompra(buyinCount)
    const res = await fetch(`/api/sessions/${sessionPlayer.session_id}/players/${sessionPlayer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyin_count: buyinCount, soma_ganho: somaGanho, soma_compra: somaCompra }),
    })
    setLoading(false)
    if (res.ok) {
      toast({ title: 'Atualizado!' })
      setOpen(false)
      onUpdate()
    } else {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const somaCompra = calcSomaCompra(buyinCount)
  const totalPago = calcTotalPago(buyinCount)
  // saldo = ganho - compra no pote (caixa é separado e não entra)
  const saldo = somaGanho - somaCompra

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) {
        setBuyinCount(sessionPlayer.buyin_count)
        setSomaGanho(sessionPlayer.soma_ganho)
      }
      setOpen(v)
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/5"
          title="Editar buy-ins"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="card-border bg-card w-full max-w-sm mx-auto max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg">
            {sessionPlayer.players.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-1">
          {/* Buy-in counter — botões grandes para mobile */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Buy-ins</p>
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-2 py-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBuyinCount(Math.max(1, buyinCount - 1))}
                className="h-16 w-16 rounded-xl text-3xl font-bold text-foreground hover:bg-white/10 active:scale-95 transition-transform"
              >
                −
              </Button>

              <div className="text-center">
                <span className="font-mono-numbers text-5xl font-bold text-foreground">
                  {buyinCount}
                </span>
                <p className="text-muted-foreground text-sm mt-1 font-mono-numbers">
                  {formatBRL(totalPago)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setBuyinCount(buyinCount + 1)}
                className="h-16 w-16 rounded-xl text-3xl font-bold text-gold hover:bg-gold/10 active:scale-95 transition-transform"
              >
                +
              </Button>
            </div>
          </div>

          {/* Ganho */}
          <div className="space-y-2">
            <Label htmlFor="ganho" className="text-muted-foreground text-xs uppercase tracking-wider">
              Valor ganho (R$)
            </Label>
            <Input
              id="ganho"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={somaGanho || ''}
              onChange={(e) => setSomaGanho(parseFloat(e.target.value) || 0)}
              className="bg-secondary border-border font-mono-numbers text-base h-12"
              placeholder="0,00"
            />
          </div>

          {/* Resumo */}
          <div className="bg-secondary/40 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Pote</span>
              <span className="font-mono-numbers">{formatBRL(somaCompra)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Caixa</span>
              <span className="font-mono-numbers text-xs">R$5,00 (fixo)</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-b border-border/30 pb-2">
              <span>Total pago</span>
              <span className="font-mono-numbers">{formatBRL(totalPago)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ganho</span>
              <span className="font-mono-numbers">{formatBRL(somaGanho)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border/50 pt-2 mt-1">
              <span className="text-foreground">Saldo</span>
              <span className={cn(
                'font-mono-numbers',
                saldo > 0 ? 'positive' : saldo < 0 ? 'negative' : 'text-muted-foreground'
              )}>
                {formatBRL(saldo)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold text-base"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
