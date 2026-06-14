'use client'


import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, UserPlus, CheckCircle2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BuyinForm } from '@/components/BuyinForm'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { SessionWithPlayers, Player } from '@/types'
import { formatBRL } from '@/lib/calculations'
import { cn } from '@/lib/utils'

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const { toast } = useToast()

  const [session, setSession] = useState<SessionWithPlayers | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [closing, setClosing] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSession(); fetchPlayers() }, [id])

  async function fetchSession() {
    const res = await fetch(`/api/sessions/${id}`)
    if (!res.ok) { router.push('/sessoes'); return }
    const data = await res.json()
    setSession(data)
    setLoading(false)
  }

  async function fetchPlayers() {
    const res = await fetch('/api/players')
    const data = await res.json()
    setPlayers(Array.isArray(data) ? data : [])
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault()
    setAddingPlayer(true)

    let playerId = selectedPlayerId

    if (addMode === 'new') {
      if (!newPlayerName.trim()) { setAddingPlayer(false); return }
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      })
      if (!res.ok) {
        toast({ title: 'Erro ao criar jogador', variant: 'destructive' })
        setAddingPlayer(false)
        return
      }
      const newPlayer = await res.json()
      playerId = newPlayer.id
    }

    const res = await fetch(`/api/sessions/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })
    setAddingPlayer(false)

    if (res.ok) {
      toast({ title: 'Jogador adicionado!' })
      setAddPlayerOpen(false)
      setSelectedPlayerId('')
      setNewPlayerName('')
      fetchSession()
      fetchPlayers()
    } else {
      const err = await res.json()
      toast({ title: err.error || 'Erro ao adicionar jogador', variant: 'destructive' })
    }
  }

  async function handleRemovePlayer(sessionPlayerId: string) {
    const res = await fetch(`/api/sessions/${id}/players/${sessionPlayerId}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Jogador removido' })
      fetchSession()
    } else {
      toast({ title: 'Erro ao remover jogador', variant: 'destructive' })
    }
  }

  async function handleCloseSession() {
    setClosing(true)
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_closed: true }),
    })
    setClosing(false)
    if (res.ok) {
      toast({ title: 'Sessão encerrada!' })
      fetchSession()
    } else {
      toast({ title: 'Erro ao encerrar sessão', variant: 'destructive' })
    }
  }

  if (loading || !session) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-muted-foreground">
        Carregando sessão...
      </div>
    )
  }

  const date = new Date(session.date + 'T12:00:00')
  const totalPot = session.session_players.reduce((sum, sp) => sum + Number(sp.soma_compra), 0)
  const totalCaixa = session.session_players.reduce((sum, sp) => sum + Number(sp.caixa_contribution), 0)
  const totalPaid = session.session_players.reduce((sum, sp) => sum + Number(sp.soma_ganho), 0)

  const existingIds = new Set(session.session_players.map((sp) => sp.player_id))
  const availablePlayers = players.filter((p) => !existingIds.has(p.id))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/sessoes"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar às sessões
      </Link>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold capitalize">
            {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
          {session.notes && (
            <p className="text-muted-foreground text-sm mt-1">{session.notes}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {session.is_closed ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Encerrada
              </Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Em andamento
              </Badge>
            )}
          </div>
        </div>

        {isAdmin && !session.is_closed && (
          <div className="flex gap-2">
            <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border hover:border-gold/50">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Jogador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm gold-border gold-glow bg-card">
                <DialogHeader>
                  <DialogTitle className="font-display text-gold">Adicionar Jogador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={addMode === 'existing' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAddMode('existing')}
                      className={addMode === 'existing' ? 'bg-gold text-felt' : 'border-border'}
                    >
                      Existente
                    </Button>
                    <Button
                      type="button"
                      variant={addMode === 'new' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAddMode('new')}
                      className={addMode === 'new' ? 'bg-gold text-felt' : 'border-border'}
                    >
                      Novo
                    </Button>
                  </div>

                  {addMode === 'existing' ? (
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Jogador</Label>
                      <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {availablePlayers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Nome do Jogador</Label>
                      <Input
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Nome..."
                        className="bg-secondary border-border"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-secondary/40 rounded p-2">
                    Buy-in inicial: <span className="text-gold font-mono-numbers">R$ 25,00</span>
                    {' '}(R$ 20 pote + R$ 5 caixa)
                  </div>

                  <Button
                    type="submit"
                    disabled={addingPlayer || (addMode === 'existing' && !selectedPlayerId)}
                    className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
                  >
                    {addingPlayer ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseSession}
              disabled={closing}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {closing ? 'Encerrando...' : 'Encerrar Sessão'}
            </Button>
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jogadores', value: session.session_players.length },
          { label: 'Total Compras', value: formatBRL(totalPot) },
          { label: 'Total Pago', value: formatBRL(totalPaid) },
          { label: 'Contribuição Caixa', value: formatBRL(totalCaixa) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg gold-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-mono-numbers font-semibold text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Players table */}
      {session.session_players.length === 0 ? (
        <div className="rounded-lg gold-border bg-card p-12 text-center text-muted-foreground">
          Nenhum jogador nesta sessão ainda.
        </div>
      ) : (
        <div className="rounded-lg gold-border gold-glow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Jogador</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Buy-ins</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Compra</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Ganho</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Saldo</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {session.session_players.map((sp) => {
                const saldo = Number(sp.soma_ganho) - Number(sp.soma_compra)
                return (
                  <tr key={sp.id} className="border-b border-border/20 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {sp.players?.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="font-mono text-xs bg-secondary/60">
                        {sp.buyin_count}×
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-numbers text-muted-foreground">
                      {formatBRL(Number(sp.soma_compra))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-numbers">
                      {formatBRL(Number(sp.soma_ganho))}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono-numbers font-semibold',
                      saldo > 0 ? 'positive' : saldo < 0 ? 'negative' : 'text-muted-foreground'
                    )}>
                      {formatBRL(saldo)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!session.is_closed && (
                            <BuyinForm sessionPlayer={sp} onUpdate={fetchSession} />
                          )}
                          {!session.is_closed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemovePlayer(sp.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
