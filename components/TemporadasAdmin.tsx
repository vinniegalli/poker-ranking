'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSeasons } from '@/hooks/use-seasons'
import { useToast } from '@/hooks/use-toast'
import { Season } from '@/types'
import { DEFAULT_VALUES, calcEntrada, formatBRL } from '@/lib/calculations'
import { todayISO } from '@/lib/periodo'
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react'

type Form = {
  name: string
  start_date: string
  end_date: string
  buyin: string
  rebuy: string
  caixa: string
  close_current: boolean
}

const money = (n: number) => String(n).replace('.', ',')
const parseMoney = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))
const fmtDate = (d: string) => format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })

/** Sugestão de início da próxima temporada: 1º de janeiro se já for nov/dez, senão hoje */
function suggestedStart(): { date: string; year: number } {
  const today = todayISO()
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  return month >= 11 ? { date: `${year + 1}-01-01`, year: year + 1 } : { date: today, year }
}

export function TemporadasAdmin() {
  const { seasons, reload } = useSeasons()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const current = seasons.find((s) => !s.end_date)

  function openNew() {
    const base = current ?? DEFAULT_VALUES
    const { date, year } = suggestedStart()
    setEditing(null)
    setForm({
      name: `Temporada ${year}`,
      start_date: date,
      end_date: '',
      buyin: money(base.buyin_amount),
      rebuy: money(base.rebuy_amount),
      caixa: money(base.caixa_fee),
      close_current: !!current,
    })
    setOpen(true)
  }

  function openEdit(s: Season) {
    setEditing(s)
    setForm({
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date ?? '',
      buyin: money(s.buyin_amount),
      rebuy: money(s.rebuy_amount),
      caixa: money(s.caixa_fee),
      close_current: false,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    const body = {
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date || null,
      buyin_amount: parseMoney(form.buyin),
      rebuy_amount: parseMoney(form.rebuy),
      caixa_fee: parseMoney(form.caixa),
      close_current: form.close_current,
    }
    const res = await fetch(editing ? `/api/seasons/${editing.id}` : '/api/seasons', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: editing ? 'Temporada atualizada' : 'Temporada criada!' })
      setOpen(false)
      reload()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: err.error ?? 'Erro ao salvar temporada', variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/seasons/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    if (res.ok) {
      toast({ title: 'Temporada removida (sessões continuam intactas)' })
      reload()
    } else {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const preview = form
    ? calcEntrada({
        buyin_amount: parseMoney(form.buyin) || 0,
        rebuy_amount: parseMoney(form.rebuy) || 0,
        caixa_fee: parseMoney(form.caixa) || 0,
      })
    : 0

  return (
    <div className="rounded-xl card-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Temporadas (admin)
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
            Cada temporada tem seu ranking, caixa e recordes. Encerrar uma temporada não apaga
            nada — o histórico continua em &quot;Todos os tempos&quot;.
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-gold text-felt hover:bg-gold/90 flex-shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {seasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma temporada cadastrada. (Se você acabou de atualizar o app, rode a migração 01 no Supabase.)
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {seasons.map((s) => (
            <div key={s.id} className="py-3 flex items-center gap-3">
              <CalendarRange className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {s.name}
                  {!s.end_date && <span className="ml-2 text-xs text-gold">em andamento</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(s.start_date)} → {s.end_date ? fmtDate(s.end_date) : 'hoje'}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Buy-in {formatBRL(s.buyin_amount)} · Rebuy {formatBRL(s.rebuy_amount)} · Caixa {formatBRL(s.caixa_fee)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(s)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {confirmDelete === s.id ? (
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => handleDelete(s.id)}>
                  Confirmar?
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="card-border bg-card sm:max-w-sm max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editing ? 'Editar temporada' : 'Nova temporada'}
            </DialogTitle>
          </DialogHeader>
          {form && (
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-secondary border-border" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Início</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="bg-secondary border-border" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Fim (opcional)</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="bg-secondary border-border" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 -mt-2">
                Deixe o fim vazio para uma temporada em andamento. Ex.: semestral = 01/01 a 30/06.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([['buyin', 'Buy-in'], ['rebuy', 'Rebuy'], ['caixa', 'Caixa']] as const).map(([k, label]) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">{label} (R$)</Label>
                    <Input type="text" inputMode="decimal" value={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value.replace(/[^0-9.,]/g, '') })}
                      className="bg-secondary border-border font-mono-numbers" required />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Entrada (buy-in + caixa): <span className="text-gold font-mono-numbers">{formatBRL(preview)}</span>.
                {editing && ' Mudar valores aqui vale só para sessões novas.'}
              </p>

              {!editing && current && (
                <label className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3 py-3 cursor-pointer">
                  <input type="checkbox" checked={form.close_current}
                    onChange={(e) => setForm({ ...form, close_current: e.target.checked })}
                    className="mt-1 accent-amber-400" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium block">Encerrar &quot;{current.name}&quot;</span>
                    Ela termina na véspera do início da nova. Se sobrar saldo no caixa, lance uma
                    entrada &quot;Saldo da temporada anterior&quot; na nova (ou distribua a premiação antes).
                  </span>
                </label>
              )}

              <Button type="submit" disabled={saving} className="w-full h-11 bg-gold text-felt hover:bg-gold/90 font-semibold">
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar temporada'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
