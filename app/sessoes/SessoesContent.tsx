'use client'


import { useEffect, useState } from 'react'
import { SessionCard } from '@/components/SessionCard'
import { useAdmin } from '@/hooks/use-admin'
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
import { Session } from '@/types'
import { Plus, CalendarDays } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SessoesPage() {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<(Session & { player_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    const res = await fetch('/api/sessions')
    const data = await res.json()
    setSessions(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newDate) return
    setCreating(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, notes: newNotes || null }),
    })
    setCreating(false)
    if (res.ok) {
      toast({ title: 'Sessão criada com sucesso!' })
      setOpen(false)
      setNewDate('')
      setNewNotes('')
      fetchSessions()
    } else {
      toast({ title: 'Erro ao criar sessão', variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold flex items-center gap-3">
            <CalendarDays className="h-7 w-7" />
            Sessões
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Todas as noites de jogo registradas
          </p>
        </div>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-felt hover:bg-gold/90 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm gold-border gold-glow bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-gold text-xl">Nova Sessão</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">Data</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">Observações (opcional)</Label>
                  <Input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ex: Aniversário do João..."
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
                >
                  {creating ? 'Criando...' : 'Criar Sessão'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando sessões...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 rounded-lg gold-border bg-card">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma sessão registrada ainda.</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Sessão&quot; para começar.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
