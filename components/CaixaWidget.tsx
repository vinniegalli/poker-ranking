'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/lib/calculations'
import { CaixaSaida } from '@/types'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
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
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CaixaWidgetProps {
  total: number
  label?: string
  onSaidaChange?: () => void
}

export function CaixaWidget({ total, label = 'Saldo em Caixa', onSaidaChange }: CaixaWidgetProps) {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [saidas, setSaidas] = useState<CaixaSaida[]>([])
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSaidas() }, [])

  async function fetchSaidas() {
    const res = await fetch('/api/caixa/saidas')
    const data = await res.json()
    setSaidas(Array.isArray(data) ? data : [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim() || !amount) return
    setSaving(true)
    const res = await fetch('/api/caixa/saidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc.trim(), amount: parseFloat(amount), date }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Saída registrada!' })
      setOpen(false)
      setDesc('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      fetchSaidas()
      onSaidaChange?.()
    } else {
      toast({ title: 'Erro ao registrar saída', variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/caixa/saidas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Saída removida' })
      fetchSaidas()
      onSaidaChange?.()
    } else {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  return (
    <div className="rounded-lg card-border bg-card">
      <div className="p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-gold mt-2 tracking-tight">
            {formatBRL(total)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Premiação acumulada
          </p>
        </div>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground mt-1 flex-shrink-0">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Registrar saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm card-border bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">Registrar Saída</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</Label>
                  <Input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ex: Premiação, compra de baralho..."
                    className="bg-secondary border-border"
                    autoFocus
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="bg-secondary border-border font-mono-numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Data</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
                >
                  {saving ? 'Salvando...' : 'Confirmar saída'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {saidas.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Saídas registradas</p>
          <div className="space-y-1.5">
            {saidas.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <span className="text-foreground/80 truncate">{s.description}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {format(new Date(s.date + 'T12:00:00'), "d MMM yy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="font-mono-numbers text-sm negative">−{formatBRL(s.amount)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
