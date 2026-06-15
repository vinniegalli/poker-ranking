import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, ChevronRight, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { Session } from '@/types'

interface SessionCardProps {
  session: Session & { player_count: number }
  onDelete?: (id: string) => void
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const date = new Date(session.date + 'T12:00:00')

  return (
    <div className="rounded-lg card-border card-hover bg-card px-5 py-4 flex items-center justify-between">
      <Link href={`/sessoes/${session.id}`} className="flex-1 min-w-0">
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground capitalize text-sm">
            {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {session.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{session.notes}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {session.player_count} jogadores
            </span>
            {session.status === 'pending' ? (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <Clock className="h-3 w-3" />
                Aguardando confirmações
              </span>
            ) : session.is_closed ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Encerrada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gold">
                <Clock className="h-3 w-3" />
                Em andamento
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(session.id) }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Excluir sessão"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <Link href={`/sessoes/${session.id}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
