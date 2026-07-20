'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { injectPixAmount } from '@/lib/pix'
import { formatBRL } from '@/lib/calculations'
import { useToast } from '@/hooks/use-toast'
import { QrCode, Copy, Check } from 'lucide-react'

interface PixPayButtonProps {
  amount: number
  pixStaticCode: string
}

export function PixPayButton({ amount, pixStaticCode }: PixPayButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const payload = injectPixAmount(pixStaticCode, amount)

  function handleCopy() {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true)
      toast({ title: 'Código copiado!' })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          title="Pagar via Pix"
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="card-border bg-card w-full max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg">Pagar via Pix</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="bg-secondary/40 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor a pagar</p>
            <p className="font-mono-numbers text-3xl font-bold text-gold">{formatBRL(amount)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pix copia e cola</p>
            <div className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-xs font-mono break-all text-foreground/80 max-h-24 overflow-y-auto">
              {payload}
            </div>
          </div>

          <Button
            onClick={handleCopy}
            className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold"
          >
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copiado!</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copiar código</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
            Cole no Pix Copia e Cola do seu banco. Depois de pagar, avise o administrador pra confirmar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
