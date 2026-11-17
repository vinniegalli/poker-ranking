'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { injectPixAmount } from '@/lib/pix'
import { formatBRL } from '@/lib/calculations'
import { whatsappLink } from '@/lib/whatsapp'
import { Copy, Check, MessageCircle } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  playerName: string
  sessionLabel: string
  pixStaticCode?: string
  adminWhatsapp?: string
}

/**
 * Passo a passo do pagamento da entrada após confirmar presença no convite:
 * 1. copia o Pix (com o valor já embutido), 2. manda o comprovante no WhatsApp
 * do admin, 3. aguarda o admin marcar como pago na sessão.
 */
export function EntradaPagamentoDialog({
  open, onOpenChange, amount, playerName, sessionLabel, pixStaticCode, adminWhatsapp,
}: Props) {
  const [copied, setCopied] = useState(false)

  let payload = ''
  try {
    payload = pixStaticCode ? injectPixAmount(pixStaticCode, amount) : ''
  } catch {
    payload = ''
  }

  const message =
    `Oi! Sou ${playerName} e paguei ${formatBRL(amount)} da entrada do poker (${sessionLabel}). ` +
    `Segue o comprovante 👇`
  const waUrl = whatsappLink(adminWhatsapp, message)

  function handleCopy() {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-border bg-card w-full max-w-sm mx-auto max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg">Pague sua entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="bg-secondary/40 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor</p>
            <p className="font-mono-numbers text-3xl font-bold text-gold">{formatBRL(amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{playerName} · {sessionLabel}</p>
          </div>

          <ol className="space-y-4">
            <li className="space-y-2">
              <p className="text-sm text-foreground"><span className="text-gold font-semibold">1.</span> Pague via Pix copia e cola</p>
              {payload ? (
                <>
                  <div className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-xs font-mono break-all text-foreground/80 max-h-20 overflow-y-auto">
                    {payload}
                  </div>
                  <Button onClick={handleCopy} className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold">
                    {copied ? <><Check className="h-4 w-4 mr-2" /> Copiado! Cole no app do banco</> : <><Copy className="h-4 w-4 mr-2" /> Copiar código Pix</>}
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  O Pix ainda não foi configurado — fale com o organizador para pagar.
                </p>
              )}
            </li>

            <li className="space-y-2">
              <p className="text-sm text-foreground"><span className="text-gold font-semibold">2.</span> Mande o comprovante no WhatsApp</p>
              {waUrl ? (
                <Button asChild variant="outline" className="w-full h-12 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" /> Enviar comprovante
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Envie o comprovante para o organizador.</p>
              )}
            </li>

            <li>
              <p className="text-sm text-foreground"><span className="text-gold font-semibold">3.</span> Pronto!</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Sua vaga já está reservada. Assim que o organizador conferir o pagamento, seu nome
                aparece como <span className="text-emerald-400">pago</span> nesta página.
              </p>
            </li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
