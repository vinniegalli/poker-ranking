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
import { calcAcertoFinal, calcFaltaPagar, calcSomaCompra, calcTotalPago, formatBRL } from '@/lib/calculations'
import { useToast } from '@/hooks/use-toast'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuyinFormProps {
  sessionPlayer: SessionPlayer & { players: Player }
  onUpdate: () => void
}

// Formato brasileiro: "." é separador de milhar, "," é separador decimal
function parseMoneyStr(s: string): number {
  const normalized = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

export function BuyinForm({ sessionPlayer, onUpdate }: BuyinFormProps) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [buyinCount, setBuyinCount] = useState(sessionPlayer.buyin_count)
  const [buyinsPagos, setBuyinsPagos] = useState(sessionPlayer.buyins_pagos ?? sessionPlayer.buyin_count)
  const [somaGanho, setSomaGanho] = useState(sessionPlayer.soma_ganho)
  const [ganhoStr, setGanhoStr] = useState(
    sessionPlayer.soma_ganho > 0 ? String(sessionPlayer.soma_ganho).replace('.', ',') : ''
  )
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  function incBuyin() {
    // Fichas novas começam como não pagas — o jogador paga via Pix ou o admin
    // confirma manualmente em "Compras pagas" depois.
    setBuyinCount((c) => c + 1)
  }

  function decBuyin() {
    setBuyinCount((c) => {
      const next = Math.max(1, c - 1)
      setBuyinsPagos((p) => Math.min(p, next))
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionPlayer.session_id}/players/${sessionPlayer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyin_count: buyinCount, buyins_pagos: buyinsPagos, soma_ganho: somaGanho }),
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
  const faltaPagar = calcFaltaPagar(buyinCount, buyinsPagos, sessionPlayer.caixa_contribution)
  const saldo = somaGanho - somaCompra
  const acertoFinal = calcAcertoFinal(buyinCount, somaGanho, buyinsPagos, sessionPlayer.caixa_contribution)

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) {
        setBuyinCount(sessionPlayer.buyin_count)
        setBuyinsPagos(sessionPlayer.buyins_pagos ?? sessionPlayer.buyin_count)
        const g = sessionPlayer.soma_ganho
        setSomaGanho(g)
        setGanhoStr(g > 0 ? String(g).replace('.', ',') : '')
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
          {/* Buy-in counter */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Buy-ins</p>
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-2 py-3">
              <Button
                type="button"
                variant="ghost"
                onClick={decBuyin}
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
                onClick={incBuyin}
                className="h-16 w-16 rounded-xl text-3xl font-bold text-gold hover:bg-gold/10 active:scale-95 transition-transform"
              >
                +
              </Button>
            </div>
          </div>

          {/* Compras pagas — quantas das fichas acima já foram pagas em dinheiro */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
              Compras pagas
            </p>
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBuyinsPagos((p) => Math.max(0, p - 1))}
                className="h-10 w-10 rounded-lg text-xl font-bold text-foreground hover:bg-white/10 active:scale-95 transition-transform"
              >
                −
              </Button>

              <span className="font-mono-numbers text-lg font-semibold text-foreground">
                {buyinsPagos} <span className="text-muted-foreground font-normal">de {buyinCount}</span>
              </span>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setBuyinsPagos((p) => Math.min(buyinCount, p + 1))}
                className="h-10 w-10 rounded-lg text-xl font-bold text-gold hover:bg-gold/10 active:scale-95 transition-transform"
              >
                +
              </Button>
            </div>
            {faltaPagar > 0 && (
              <p className="text-amber-400 text-xs mt-2">
                Faltam {formatBRL(faltaPagar)} em fichas não pagas ainda.
              </p>
            )}
          </div>

          {/* Ganho — type="text" para aceitar vírgula no Android */}
          <div className="space-y-2">
            <Label htmlFor="ganho" className="text-muted-foreground text-xs uppercase tracking-wider">
              Valor ganho (R$)
            </Label>
            <Input
              id="ganho"
              type="text"
              inputMode="decimal"
              value={ganhoStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.,]/g, '')
                setGanhoStr(raw)
                setSomaGanho(parseMoneyStr(raw))
              }}
              onBlur={() => {
                const v = parseMoneyStr(ganhoStr)
                setSomaGanho(v)
                setGanhoStr(v > 0 ? String(v).replace('.', ',') : '')
              }}
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
            <div className="flex justify-between text-muted-foreground border-b border-border/30 pb-2">
              <span>Resultado do jogo</span>
              <span className="font-mono-numbers">{formatBRL(saldo)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1">
              <span className="text-foreground">Acerto final</span>
              <span className={cn(
                'font-mono-numbers',
                acertoFinal > 0 ? 'positive' : acertoFinal < 0 ? 'negative' : 'text-muted-foreground'
              )}>
                {formatBRL(acertoFinal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {acertoFinal > 0
                ? 'Você deve devolver esse valor ao jogador.'
                : acertoFinal < 0
                  ? 'O jogador ainda deve esse valor a você.'
                  : 'Conta fechada, nada a acertar.'}
            </p>
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
