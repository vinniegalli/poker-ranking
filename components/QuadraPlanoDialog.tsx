'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { todayISO } from '@/lib/periodo'
import {
  CONFIG_KEY, MESES_NOMES, QuadraPlano, RANKS_ASC, parsePlano, sortRanks, suggestPlano,
} from '@/lib/quadra-plano'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

/** Sugestão de início: janeiro do ano que vem se já for nov/dez, senão o mês seguinte */
function defaultInicio(): string {
  const t = todayISO()
  const y = Number(t.slice(0, 4))
  const m = Number(t.slice(5, 7))
  if (m >= 11) return `${y + 1}-01`
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

export function QuadraPlanoDialog({ open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast()
  const [plano, setPlano] = useState<QuadraPlano | null>(null)
  const [premioStr, setPremioStr] = useState('50')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [existed, setExisted] = useState(false)

  useEffect(() => {
    if (!open) return
    setExpanded(null)
    fetch('/api/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((cfg) => {
        const saved = parsePlano(cfg?.[CONFIG_KEY])
        setExisted(!!saved)
        const p = saved ?? { inicio: defaultInicio(), premio: 50, meses: suggestPlano(3), aplicados: [] }
        setPlano(p)
        setPremioStr(String(p.premio).replace('.', ','))
      })
  }, [open])

  function toggle(month: string, rank: string) {
    if (!plano) return
    const cur = plano.meses[month] ?? []
    const next = cur.includes(rank) ? cur.filter((r) => r !== rank) : [...cur, rank]
    setPlano({ ...plano, meses: { ...plano.meses, [month]: sortRanks(next) } })
  }

  async function handleSave() {
    if (!plano) return
    setSaving(true)
    const toSave: QuadraPlano = { ...plano, premio: parseFloat(premioStr.replace(',', '.')) || 0 }
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [CONFIG_KEY]: JSON.stringify(toSave) }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: 'Plano de quadras salvo!' })
      onOpenChange(false)
      onSaved?.()
    } else {
      toast({ title: 'Erro ao salvar o plano', variant: 'destructive' })
    }
  }

  // Quantas vezes cada carta aparece no ano (pra ver se ficou equilibrado)
  const counts = new Map(RANKS_ASC.map((r) => [r, 0]))
  if (plano) for (const ranks of Object.values(plano.meses)) for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1)
  const missing = RANKS_ASC.filter((r) => counts.get(r) === 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-border bg-card sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Plano anual de quadras</DialogTitle>
        </DialogHeader>

        {!plano ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Virou o mês, as quadras daquele mês são criadas sozinhas com as cartas abaixo.
              Meses que já têm quadra não mudam — dá pra ajustar na mão a qualquer momento.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Vale a partir de</Label>
                <Input type="month" value={plano.inicio}
                  onChange={(e) => e.target.value && setPlano({ ...plano, inicio: e.target.value })}
                  className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Prêmio cada (R$)</Label>
                <Input type="text" inputMode="decimal" value={premioStr}
                  onChange={(e) => setPremioStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="bg-secondary border-border font-mono-numbers" />
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 px-3 py-3 space-y-2">
              <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Sugestões prontas
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((n) => (
                  <Button key={n} type="button" variant="outline" size="sm" className="border-border text-xs h-9"
                    onClick={() => setPlano({ ...plano, meses: suggestPlano(n) })}>
                    {n} por mês
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Cada mês anda uma carta (jan 2·7·10, fev 3·8·J...), então as 13 aparecem quase o mesmo número de vezes no ano.
              </p>
            </div>

            <div className="divide-y divide-border/50 rounded-lg border border-border/50">
              {MESES_NOMES.map((nome, i) => {
                const key = String(i + 1)
                const ranks = plano.meses[key] ?? []
                const isOpen = expanded === key
                return (
                  <div key={key}>
                    <button type="button" onClick={() => setExpanded(isOpen ? null : key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                      <span className="text-sm text-foreground w-20 flex-shrink-0">{nome}</span>
                      <span className="flex-1 flex flex-wrap gap-1">
                        {ranks.length === 0 ? (
                          <span className="text-xs text-muted-foreground">sem quadra</span>
                        ) : ranks.map((r) => (
                          <span key={r} className="min-w-[26px] text-center rounded bg-gold/15 text-gold text-xs font-semibold px-1.5 py-0.5">{r}</span>
                        ))}
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-7 gap-1.5 px-3 pb-3">
                        {[...RANKS_ASC].reverse().map((r) => (
                          <button key={r} type="button" onClick={() => toggle(key, r)}
                            className={cn(
                              'h-9 rounded-md text-sm font-semibold transition-colors',
                              ranks.includes(r) ? 'bg-gold text-felt' : 'bg-secondary text-muted-foreground hover:text-foreground'
                            )}>
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-muted-foreground">
              No ano: {RANKS_ASC.map((r) => `${r}×${counts.get(r)}`).join(' · ')}
              {missing.length > 0 && <span className="text-amber-400"> — sem: {missing.join(', ')}</span>}
            </p>

            <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold">
              {saving ? 'Salvando...' : existed ? 'Salvar plano' : 'Ativar plano'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
