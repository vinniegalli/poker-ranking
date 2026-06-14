'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdmin } from '@/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'

export function AdminModal() {
  const { isAdmin, login, logout } = useAdmin()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const ok = await login(password)
    setLoading(false)
    if (ok) {
      setOpen(false)
      setPassword('')
      toast({ title: 'Modo admin ativado', description: 'Você tem acesso total.' })
    } else {
      toast({ title: 'Senha incorreta', variant: 'destructive' })
    }
  }

  if (isAdmin) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        className="text-gold hover:text-gold/80 hover:bg-white/5"
        title="Sair do modo admin"
      >
        <Unlock className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-gold hover:bg-white/5"
        title="Entrar como admin"
      >
        <Lock className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm gold-border gold-glow bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-gold text-xl">
              Acesso Admin
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha..."
                className="bg-secondary border-border"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-felt hover:bg-gold/90 font-semibold"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
