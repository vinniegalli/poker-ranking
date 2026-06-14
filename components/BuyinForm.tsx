'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
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
import { calcSomaCompra, formatBRL } from '@/lib/calculations'
import { useToast } from '@/hooks/use-toast'

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
      toast({ title: 'Atualizado com sucesso!' })
      setOpen(false)
      onUpdate()
    } else {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-gold hover:text-gold/80 hover:bg-gold/10 h-7 px-2">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm gold-border gold-glow bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-gold">
            {sessionPlayer.players.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground/80">Buy-ins</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border"
                onClick={() => setBuyinCount(Math.max(1, buyinCount - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono-numbers text-xl font-bold text-foreground w-8 text-center">
                {buyinCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border"
                onClick={() => setBuyinCount(buyinCount + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-sm text-muted-foreground">
                = {formatBRL(calcSomaCompra(buyinCount))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ganho" className="text-foreground/80">
              Soma Ganho (R$)
            </Label>
            <Input
              id="ganho"
              type="number"
              step="0.01"
              min="0"
              value={somaGanho}
              onChange={(e) => setSomaGanho(parseFloat(e.target.value) || 0)}
              className="bg-secondary border-border font-mono-numbers"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-secondary/40 rounded p-3 space-y-1">
            <div className="flex justify-between">
              <span>Soma Compra:</span>
              <span className="font-mono-numbers">{formatBRL(calcSomaCompra(buyinCount))}</span>
            </div>
            <div className="flex justify-between">
              <span>Soma Ganho:</span>
              <span className="font-mono-numbers">{formatBRL(somaGanho)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border/50 pt-1 mt-1">
              <span>Saldo:</span>
              <span className={`font-mono-numbers ${somaGanho - calcSomaCompra(buyinCount) >= 0 ? 'positive' : 'negative'}`}>
                {formatBRL(somaGanho - calcSomaCompra(buyinCount))}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
