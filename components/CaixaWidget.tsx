'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/lib/calculations'
import { CaixaSaida, CaixaEntrada } from '@/types'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CaixaWidgetProps {
  total: number
  label?: string
  onSaidaChange?: () => void
}

interface PremiacaoDistribution {
  distribution_id: string
  type: string
  date: string
  description: string | null
  total: number
}

type Movement =
  | (CaixaSaida & { kind: 'saida' })
  | (CaixaEntrada & { kind: 'entrada' })
  | (PremiacaoDistribution & { kind: 'premiacao' })

export function CaixaWidget({ total, label = 'Saldo em Caixa', onSaidaChange }: CaixaWidgetProps) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [saidas, setSaidas] = useState<CaixaSaida[]>([])
  const [entradas, setEntradas] = useState<CaixaEntrada[]>([])
  const [premiacoes, setPremiacoes] = useState<PremiacaoDistribution[]>([])

  const [saidaOpen, setSaidaOpen] = useState(false)
  const [saidaDesc, setSaidaDesc] = useState('')
  const [saidaAmount, setSaidaAmount] = useState('')
  const [saidaDate, setSaidaDate] = useState(new Date().toISOString().split('T')[0])
  const [savingSaida, setSavingSaida] = useState(false)

  const [entradaOpen, setEntradaOpen] = useState(false)
  const [entradaDesc, setEntradaDesc] = useState('')
  const [entradaAmount, setEntradaAmount] = useState('')
  const [entradaDate, setEntradaDate] = useState(new Date().toISOString().split('T')[0])
  const [savingEntrada, setSavingEntrada] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [sRes, eRes, pRes] = await Promise.all([
      fetch('/api/caixa/saidas'),
      fetch('/api/caixa/entradas'),
      fetch('/api/premiacoes'),
    ])
    const [sData, eData, pData] = await Promise.all([sRes.json(), eRes.json(), pRes.json()])
    setSaidas(Array.isArray(sData) ? sData : [])
    setEntradas(Array.isArray(eData) ? eData : [])
    setPremiacoes(Array.isArray(pData) ? pData : [])
  }

  async function handleCreateSaida(e: React.FormEvent) {
    e.preventDefault()
    if (!saidaDesc.trim() || !saidaAmount) return
    setSavingSaida(true)
    const res = await fetch('/api/caixa/saidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: saidaDesc.trim(), amount: parseFloat(saidaAmount), date: saidaDate }),
    })
    setSavingSaida(false)
    if (res.ok) {
      toast({ title: 'Saída registrada!' })
      setSaidaOpen(false); setSaidaDesc(''); setSaidaAmount('')
      setSaidaDate(new Date().toISOString().split('T')[0])
      fetchAll(); onSaidaChange?.()
    } else toast({ title: 'Erro ao registrar saída', variant: 'destructive' })
  }

  async function handleCreateEntrada(e: React.FormEvent) {
    e.preventDefault()
    if (!entradaDesc.trim() || !entradaAmount) return
    setSavingEntrada(true)
    const res = await fetch('/api/caixa/entradas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: entradaDesc.trim(), amount: parseFloat(entradaAmount), date: entradaDate }),
    })
    setSavingEntrada(false)
    if (res.ok) {
      toast({ title: 'Entrada registrada!' })
      setEntradaOpen(false); setEntradaDesc(''); setEntradaAmount('')
      setEntradaDate(new Date().toISOString().split('T')[0])
      fetchAll(); onSaidaChange?.()
    } else toast({ title: 'Erro ao registrar entrada', variant: 'destructive' })
  }

  async function handleDeleteSaida(id: string) {
    const res = await fetch(`/api/caixa/saidas/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Removida' }); fetchAll(); onSaidaChange?.() }
    else toast({ title: 'Erro ao remover', variant: 'destructive' })
  }

  async function handleDeleteEntrada(id: string) {
    const res = await fetch(`/api/caixa/entradas/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Removida' }); fetchAll(); onSaidaChange?.() }
    else toast({ title: 'Erro ao remover', variant: 'destructive' })
  }

  async function handleDeletePremiacao(distributionId: string) {
    const res = await fetch(`/api/premiacoes/${distributionId}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Premiação revertida' }); fetchAll(); onSaidaChange?.() }
    else toast({ title: 'Erro ao reverter premiação', variant: 'destructive' })
  }

  // Merge todas as movimentações ordenadas por data desc
  const movements: Movement[] = [
    ...saidas.map(s => ({ ...s, kind: 'saida' as const })),
    ...entradas.map(e => ({ ...e, kind: 'entrada' as const })),
    ...premiacoes.map(p => ({ ...p, id: p.distribution_id, kind: 'premiacao' as const })),
  ].sort((a, b) => {
    const da = new Date('date' in a ? a.date : '').getTime()
    const db = new Date('date' in b ? b.date : '').getTime()
    return db - da
  })

  return (
    <div className="rounded-lg card-border bg-card">
      <div className="p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-gold mt-2 tracking-tight">
            {formatBRL(total)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Premiação acumulada</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-1 flex-shrink-0">
            {/* Entrada */}
            <Dialog open={entradaOpen} onOpenChange={setEntradaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm card-border bg-card" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Registrar Entrada</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEntrada} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</Label>
                    <Input value={entradaDesc} onChange={e => setEntradaDesc(e.target.value)}
                      placeholder="Ex: Saldo anterior, aporte inicial..."
                      className="bg-secondary border-border" autoFocus required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor (R$)</Label>
                      <Input type="number" step="0.01" min="0.01" value={entradaAmount}
                        onChange={e => setEntradaAmount(e.target.value)}
                        placeholder="0,00" className="bg-secondary border-border font-mono-numbers" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Data</Label>
                      <Input type="date" value={entradaDate} onChange={e => setEntradaDate(e.target.value)}
                        className="bg-secondary border-border" />
                    </div>
                  </div>
                  <Button type="submit" disabled={savingEntrada}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {savingEntrada ? 'Salvando...' : 'Confirmar entrada'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Saída */}
            <Dialog open={saidaOpen} onOpenChange={setSaidaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-border text-muted-foreground hover:text-foreground">
                  <Minus className="h-3.5 w-3.5 mr-1.5" />
                  Saída
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm card-border bg-card" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Registrar Saída</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSaida} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</Label>
                    <Input value={saidaDesc} onChange={e => setSaidaDesc(e.target.value)}
                      placeholder="Ex: Premiação, compra de baralho..."
                      className="bg-secondary border-border" autoFocus required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor (R$)</Label>
                      <Input type="number" step="0.01" min="0.01" value={saidaAmount}
                        onChange={e => setSaidaAmount(e.target.value)}
                        placeholder="0,00" className="bg-secondary border-border font-mono-numbers" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Data</Label>
                      <Input type="date" value={saidaDate} onChange={e => setSaidaDate(e.target.value)}
                        className="bg-secondary border-border" />
                    </div>
                  </div>
                  <Button type="submit" disabled={savingSaida}
                    className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold">
                    {savingSaida ? 'Salvando...' : 'Confirmar saída'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {movements.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Movimentações</p>
          <div className="space-y-1.5">
            {movements.map((m) => {
              const isPos = m.kind === 'entrada'
              const isPremiacao = m.kind === 'premiacao'
              const amount = isPremiacao ? (m as PremiacaoDistribution).total : (m as CaixaSaida).amount
              const label = isPremiacao
                ? (m as PremiacaoDistribution).description || ((m as PremiacaoDistribution).type === 'ranking' ? 'Premiação Ranking' : 'Quadra do Mês')
                : (m as CaixaSaida).description

              return (
                <div key={m.kind + '-' + ('distribution_id' in m ? m.distribution_id : m.id)} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground/80 truncate">{label}</span>
                    {isPremiacao && (
                      <span className="text-xs text-gold/60 ml-1.5">premiação</span>
                    )}
                    <span className="text-muted-foreground text-xs ml-2">
                      {format(new Date(m.date + 'T12:00:00'), "d MMM yy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={`font-mono-numbers text-sm ${isPos ? 'positive' : 'negative'}`}>
                      {isPos ? '+' : '−'}{formatBRL(amount)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (m.kind === 'saida') handleDeleteSaida(m.id)
                          else if (m.kind === 'entrada') handleDeleteEntrada(m.id)
                          else handleDeletePremiacao((m as PremiacaoDistribution).distribution_id)
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors -mr-1 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title={isPremiacao ? 'Reverter premiação' : 'Remover'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
