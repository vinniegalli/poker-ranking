'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Check, X } from 'lucide-react'

const DEFAULTS = {
  info_title: 'Regras e Informações',
  info_content: 'Buy-in: R$ 25,00 (R$ 20 pote + R$ 5 caixa)\nRe-buy: R$ 20,00\nMáximo 10 jogadores por mesa\n\nO caixa acumulado é distribuído ao final do ano.',
}

export default function InfoContent() {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [config, setConfig] = useState<Record<string, string>>(DEFAULTS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>(DEFAULTS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULTS, ...data }
        setConfig(merged)
        setDraft(merged)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    setSaving(false)
    if (res.ok) {
      setConfig(draft)
      setEditing(false)
      toast({ title: 'Informações salvas!' })
    } else {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  function handleCancel() {
    setDraft(config)
    setEditing(false)
  }

  const lines = (editing ? draft.info_content : config.info_content).split('\n')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          {editing ? (
            <Input
              value={draft.info_title}
              onChange={(e) => setDraft((d) => ({ ...d, info_title: e.target.value }))}
              className="font-display text-xl font-bold bg-transparent border-border h-auto py-1 px-2 text-foreground"
            />
          ) : (
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {config.info_title}
            </h1>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 ml-4">
            {editing ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 w-9 bg-gold text-felt hover:bg-gold/90"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditing(true)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl card-border bg-card">
        {editing ? (
          <textarea
            value={draft.info_content}
            onChange={(e) => setDraft((d) => ({ ...d, info_content: e.target.value }))}
            className="w-full bg-transparent p-5 text-foreground text-sm leading-relaxed resize-none outline-none min-h-[240px] font-sans"
            placeholder="Escreva as regras e informações aqui..."
          />
        ) : (
          <div className="p-5 space-y-2">
            {lines.map((line, i) =>
              line.trim() === '' ? (
                <div key={i} className="h-3" />
              ) : (
                <p key={i} className="text-foreground/85 text-sm leading-relaxed">
                  {line}
                </p>
              )
            )}
          </div>
        )}
      </div>

      {editing && (
        <p className="text-xs text-muted-foreground mt-3 px-1">
          Use linhas em branco para separar parágrafos.
        </p>
      )}
    </div>
  )
}
