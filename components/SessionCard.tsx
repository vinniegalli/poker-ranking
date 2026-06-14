import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { Session } from '@/types'

interface SessionCardProps {
  session: Session & { player_count: number }
}

export function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.date + 'T12:00:00')

  return (
    <Link href={`/sessoes/${session.id}`}>
      <div className="rounded-lg gold-border bg-card p-4 flex items-center justify-between group hover:bg-card/80 hover:border-gold/50 transition-all cursor-pointer gold-glow">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground capitalize">
              {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            {session.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{session.notes}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {session.player_count} jogadores
              </span>
              {session.is_closed ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Encerrada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Clock className="h-3 w-3" />
                  Em andamento
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
      </div>
    </Link>
  )
}
