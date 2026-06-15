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

// CalendarDays used only in empty state

export default function SessoesPage() {
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<(Session & { player_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [inviteMode, setInviteMode] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      body: JSON.stringify({ date: newDate, notes: newNotes || null, status: inviteMode ? 'pending' : 'active' }),
    })
    setCreating(false)
    if (res.ok) {
      toast({ title: inviteMode ? 'Sessão criada — compartilhe o link de convite!' : 'Sessão criada com sucesso!' })
      setOpen(false)
      setNewDate('')
      setNewNotes('')
      setInviteMode(false)
      fetchSessions()
    } else {
      toast({ title: 'Erro ao criar sessão', variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    if (res.ok) {
      toast({ title: 'Sessão excluída' })
      fetchSessions()
    } else {
      toast({ title: 'Erro ao excluir sessão', variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
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
            <DialogContent className="sm:max-w-sm card-border bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">Nova Sessão</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Data</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Observações (opcional)</Label>
                  <Input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ex: Aniversário do João..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setInviteMode((v) => !v)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 mt-0.5 rounded-full transition-colors focus:outline-none ${inviteMode ? 'bg-gold' : 'bg-border'}`}
                    role="switch"
                    aria-checked={inviteMode}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${inviteMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-foreground">Modo convite</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cria link para jogadores confirmarem presença antes de iniciar
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
                >
                  {creating ? 'Criando...' : inviteMode ? 'Criar com convite' : 'Criar Sessão'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando sessões...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 rounded-lg card-border bg-card">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma sessão registrada ainda.</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Sessão&quot; para começar.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={isAdmin ? (id) => setDeleteTarget(id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Confirmação de delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm card-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Excluir sessão?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Todos os jogadores e dados desta sessão serão removidos permanentemente.
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={deleting}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
