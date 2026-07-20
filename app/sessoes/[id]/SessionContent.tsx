'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft, UserPlus, CheckCircle2, Trash2,
  Copy, Check, PlayCircle, Users, AlertTriangle, Scale, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BuyinForm } from '@/components/BuyinForm'
import { PixPayButton } from '@/components/PixPayButton'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { SessionWithPlayers, Player } from '@/types'
import { calcAcertoFinal, calcFaltaPagar, formatBRL } from '@/lib/calculations'
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
  const [reopening, setReopening] = useState(false)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pixConfig, setPixConfig] = useState({ pix_key: '', pix_nome: '', pix_cidade: '' })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSession(); fetchPlayers(); fetchPixConfig() }, [id])

  async function fetchSession() {
    const res = await fetch(`/api/sessions/${id}`)
    if (!res.ok) { router.push('/sessoes'); return }
    setSession(await res.json())
    setLoading(false)
  }

  async function fetchPlayers() {
    const res = await fetch('/api/players')
    const data = await res.json()
    setPlayers(Array.isArray(data) ? data : [])
  }

  async function fetchPixConfig() {
    const res = await fetch('/api/config')
    const data = await res.json()
    setPixConfig((c) => ({ ...c, ...data }))
  }

  async function patchSession(body: Record<string, unknown>) {
    return fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function handleStart() {
    setStarting(true)
    const res = await patchSession({ status: 'active' })
    setStarting(false)
    if (res.ok) { toast({ title: 'Sessão iniciada!' }); fetchSession() }
    else toast({ title: 'Erro ao iniciar', variant: 'destructive' })
  }

  async function handleClose() {
    setClosing(true)
    const res = await patchSession({ status: 'closed', is_closed: true })
    setClosing(false)
    if (res.ok) {
      toast({ title: 'Sessão encerrada!' })
      fetchSession()
    } else {
      const body = await res.json().catch(() => ({}))
      toast({ title: body.error ?? 'Erro ao encerrar', variant: 'destructive' })
    }
  }

  async function handleReopen() {
    setReopening(true)
    const res = await patchSession({ status: 'active', is_closed: false })
    setReopening(false)
    if (res.ok) { toast({ title: 'Sessão reaberta!' }); fetchSession() }
    else toast({ title: 'Erro ao reabrir', variant: 'destructive' })
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
        setAddingPlayer(false); return
      }
      playerId = (await res.json()).id
    }

    const res = await fetch(`/api/sessions/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })
    setAddingPlayer(false)
    if (res.ok) {
      toast({ title: 'Jogador adicionado!' })
      setAddPlayerOpen(false); setSelectedPlayerId(''); setNewPlayerName('')
      fetchSession(); fetchPlayers()
    } else {
      const err = await res.json()
      toast({ title: err.error || 'Erro ao adicionar', variant: 'destructive' })
    }
  }

  async function handleRemovePlayer(spId: string) {
    const res = await fetch(`/api/sessions/${id}/players/${spId}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'Removido' }); fetchSession() }
    else toast({ title: 'Erro ao remover', variant: 'destructive' })
  }

  async function handleTogglePaid(spId: string, currentPaid: boolean) {
    const res = await fetch(`/api/sessions/${id}/players/${spId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paid: !currentPaid }),
    })
    if (res.ok) fetchSession()
    else toast({ title: 'Erro ao atualizar pagamento', variant: 'destructive' })
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/sessoes/${id}/confirmar`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast({ title: 'Link copiado!' })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading || !session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-muted-foreground text-sm">
        Carregando sessão...
      </div>
    )
  }

  const { status } = session
  const date = new Date(session.date + 'T12:00:00')
  const confirmedCount = session.session_players.length
  const isFull = confirmedCount >= 10
  const totalCompra = session.session_players.reduce((s, sp) => s + Number(sp.soma_compra), 0)
  const totalGanho = session.session_players.reduce((s, sp) => s + Number(sp.soma_ganho), 0)
  const totalCaixa = session.session_players.reduce((s, sp) => s + Number(sp.caixa_contribution), 0)
  const existingIds = new Set(session.session_players.map((sp) => sp.player_id))
  const availablePlayers = players.filter((p) => !existingIds.has(p.id))
  const diff = totalGanho - totalCompra
  const isBalanced = Math.abs(diff) < 0.01

  const mvp = session.session_players.reduce<{ name: string; saldo: number } | null>((best, sp) => {
    const saldo = Number(sp.soma_ganho) - Number(sp.soma_compra)
    if (saldo <= 0) return best
    if (!best || saldo > best.saldo) return { name: sp.players?.name ?? '', saldo }
    return best
  }, null)

  const statusBadge = {
    pending: <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Aguardando confirmações</Badge>,
    active: <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">Em andamento</Badge>,
    closed: <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Encerrada</Badge>,
  }[status]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/sessoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Sessões
      </Link>

      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-foreground capitalize tracking-tight">
          {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          {format(date, 'yyyy', { locale: ptBR })}
          {session.notes && ` · ${session.notes}`}
        </p>
        <div className="mt-2">{statusBadge}</div>
      </div>

      {/* ─── FASE: PENDING ─── */}
      {status === 'pending' && (
        <>
          {/* Link de convite */}
          <div className="rounded-xl card-border bg-card px-5 py-4 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Link de convite</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-xs text-muted-foreground font-mono truncate">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/sessoes/${id}/confirmar`
                  : `/sessoes/${id}/confirmar`}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={copyInviteLink}
                className="h-10 w-10 border-border flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Mande para os participantes confirmarem presença.
            </p>
          </div>

          {/* Contador */}
          <div className="rounded-xl card-border bg-card px-5 py-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Confirmados
              </div>
              <span className="font-mono-numbers font-bold text-foreground tabular-nums">
                {confirmedCount}<span className="text-muted-foreground font-normal">/10</span>
              </span>
            </div>
            <div className="w-full bg-secondary/50 rounded-full h-1.5 mb-4">
              <div
                className="bg-gold h-1.5 rounded-full transition-all"
                style={{ width: `${(confirmedCount / 10) * 100}%` }}
              />
            </div>

            {confirmedCount > 0 && (
              <div className="space-y-1.5">
                {session.session_players.map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-foreground">{sp.players?.name}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemovePlayer(sp.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações admin */}
          {isAdmin && (
            <div className="flex gap-2">
              {!isFull && (
                <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-border">
                      <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="card-border bg-card sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="font-display text-foreground">Adicionar Jogador</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPlayer} className="space-y-4 pt-1">
                      <div className="flex gap-2">
                        {['existing', 'new'].map((m) => (
                          <Button key={m} type="button" size="sm"
                            onClick={() => setAddMode(m as 'existing' | 'new')}
                            className={addMode === m ? 'bg-gold text-felt flex-1' : 'border-border flex-1'}
                            variant={addMode === m ? 'default' : 'outline'}
                          >
                            {m === 'existing' ? 'Existente' : 'Novo'}
                          </Button>
                        ))}
                      </div>
                      {addMode === 'existing' ? (
                        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                          <SelectTrigger className="bg-secondary border-border h-12">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {availablePlayers.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Nome" className="bg-secondary border-border h-12 text-base" autoFocus />
                      )}
                      <Button type="submit" disabled={addingPlayer || (addMode === 'existing' && !selectedPlayerId)}
                        className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold">
                        {addingPlayer ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                onClick={handleStart}
                disabled={starting || confirmedCount === 0}
                className="bg-gold text-felt hover:bg-gold/90 font-semibold flex-1 sm:flex-none"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {starting ? 'Iniciando...' : 'Iniciar Sessão'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* ─── FASE: ACTIVE / CLOSED ─── */}
      {(status === 'active' || status === 'closed') && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Jogadores', value: String(confirmedCount) },
              { label: 'Total compras', value: formatBRL(totalCompra) },
              { label: 'Caixa', value: formatBRL(totalCaixa) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg card-border bg-card px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className="font-mono-numbers font-semibold text-foreground text-sm mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* MVP da noite */}
          {status === 'closed' && mvp && (
            <div className="rounded-lg card-border bg-gold/5 border-gold/20 px-4 py-3 mb-4 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-gold flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">MVP da noite</p>
                <p className="text-sm font-medium text-foreground truncate">{mvp.name}</p>
              </div>
              <span className="font-mono-numbers font-semibold text-sm positive flex-shrink-0">
                +{formatBRL(mvp.saldo)}
              </span>
            </div>
          )}

          {/* Conferência de caixa */}
          {status === 'active' && confirmedCount > 0 && (
            <div className={cn(
              'rounded-lg card-border px-4 py-3 mb-4 transition-colors',
              isBalanced ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
            )}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Scale className={cn('h-3.5 w-3.5', isBalanced ? 'text-emerald-400' : 'text-amber-400')} />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Conferência do pote
                  </span>
                </div>
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Fechado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {diff > 0 ? `+${formatBRL(diff)}` : formatBRL(diff)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-xs text-muted-foreground">Pote (compras)</span>
                    <span className="font-mono-numbers text-xs text-foreground">{formatBRL(totalCompra)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-xs text-muted-foreground">Total ganho</span>
                    <span className="font-mono-numbers text-xs text-foreground">{formatBRL(totalGanho)}</span>
                  </div>
                </div>
              </div>
              {!isBalanced && (
                <p className="text-xs text-amber-400/80 mt-2.5 leading-relaxed">
                  {diff > 0
                    ? `Os jogadores ganharam ${formatBRL(diff)} a mais do que entrou no pote.`
                    : `Faltam ${formatBRL(Math.abs(diff))} para fechar o pote. Verifique os valores.`}
                </p>
              )}
            </div>
          )}

          {/* Admin: reabrir sessão encerrada */}
          {isAdmin && status === 'closed' && (
            <div className="flex gap-2 mb-5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopen}
                disabled={reopening}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {reopening ? 'Reabrindo...' : 'Reabrir sessão'}
              </Button>
            </div>
          )}

          {/* Admin actions (active only) */}
          {isAdmin && status === 'active' && (
            <div className="flex gap-2 mb-5">
              <Dialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border flex-1 sm:flex-none">
                    <UserPlus className="h-4 w-4 mr-2" /> Adicionar jogador
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-border bg-card sm:max-w-sm max-h-[90dvh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Adicionar Jogador</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPlayer} className="space-y-4 pt-1">
                    <div className="flex gap-2">
                      {['existing', 'new'].map((m) => (
                        <Button key={m} type="button" size="sm"
                          onClick={() => setAddMode(m as 'existing' | 'new')}
                          className={addMode === m ? 'bg-gold text-felt flex-1' : 'border-border flex-1'}
                          variant={addMode === m ? 'default' : 'outline'}
                        >
                          {m === 'existing' ? 'Existente' : 'Novo'}
                        </Button>
                      ))}
                    </div>
                    {addMode === 'existing' ? (
                      <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                        <SelectTrigger className="bg-secondary border-border h-12">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {availablePlayers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nome</Label>
                        <Input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Nome do jogador" className="bg-secondary border-border h-12 text-base" autoFocus />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3">
                      Buy-in: <span className="text-gold font-mono-numbers">R$ 25,00</span>{' '}(R$ 20 pote + R$ 5 caixa)
                    </div>
                    <Button type="submit"
                      disabled={addingPlayer || (addMode === 'existing' && !selectedPlayerId)}
                      className="w-full h-12 bg-gold text-felt hover:bg-gold/90 font-semibold text-base">
                      {addingPlayer ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closing || !isBalanced}
                title={!isBalanced ? 'Feche o pote antes de encerrar a sessão' : undefined}
                className={cn(
                  isBalanced
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                    : 'border-border/30 text-muted-foreground cursor-not-allowed opacity-50'
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {closing ? 'Encerrando...' : 'Encerrar'}
              </Button>
            </div>
          )}

          {/* Player cards */}
          {session.session_players.length === 0 ? (
            <div className="rounded-lg card-border bg-card p-10 text-center text-muted-foreground text-sm">
              Nenhum jogador nesta sessão.
            </div>
          ) : (
            <div className="rounded-lg card-border bg-card divide-y divide-border/50">
              {session.session_players.map((sp) => {
                const buyinsPagos = sp.buyins_pagos ?? sp.buyin_count
                const faltaPagar = calcFaltaPagar(sp.buyin_count, buyinsPagos, Number(sp.caixa_contribution))
                const acertoFinal = calcAcertoFinal(sp.buyin_count, Number(sp.soma_ganho), buyinsPagos, Number(sp.caixa_contribution))
                const isPaid = sp.is_paid ?? false
                return (
                  <div key={sp.id} className="px-4 py-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{sp.players?.name}</span>
                        <span className="font-mono-numbers text-xs bg-white/5 rounded px-1.5 py-0.5 text-muted-foreground">
                          {sp.buyin_count}×
                        </span>
                        {faltaPagar > 0 && (
                          <span className="text-xs text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> faltam {formatBRL(faltaPagar)}
                          </span>
                        )}
                        {status === 'closed' && acertoFinal !== 0 && isPaid && (
                          <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Acertado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>compra {formatBRL(Number(sp.soma_compra))}</span>
                        {sp.soma_ganho > 0 && <span>ganho {formatBRL(Number(sp.soma_ganho))}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn(
                        'font-mono-numbers font-semibold text-sm min-w-[60px] text-right',
                        acertoFinal > 0 ? 'positive' : acertoFinal < 0 ? 'negative' : 'text-muted-foreground'
                      )}>
                        {formatBRL(acertoFinal)}
                      </span>
                      {isAdmin && status === 'closed' && acertoFinal !== 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePaid(sp.id, isPaid)}
                          className={cn(
                            'h-8 px-2 text-xs font-medium transition-colors',
                            isPaid
                              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border/50'
                          )}
                        >
                          {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : (acertoFinal > 0 ? 'Pagar' : 'Cobrar')}
                        </Button>
                      )}
                      {acertoFinal < 0 && pixConfig.pix_key && (status === 'active' || status === 'closed') && (
                        <PixPayButton
                          amount={-acertoFinal}
                          playerName={sp.players?.name ?? ''}
                          pixKey={pixConfig.pix_key}
                          merchantName={pixConfig.pix_nome}
                          merchantCity={pixConfig.pix_cidade}
                        />
                      )}
                      {isAdmin && (status === 'active' || status === 'closed') && (
                        <>
                          <BuyinForm sessionPlayer={sp} onUpdate={fetchSession} />
                          {status === 'active' && (
                            <Button variant="ghost" size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemovePlayer(sp.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {status === 'closed' && totalGanho > 0 && (
                <div className="px-4 py-3 flex items-center justify-between bg-white/2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total ganho</span>
                  <span className="font-mono-numbers font-semibold text-sm text-foreground">{formatBRL(totalGanho)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
