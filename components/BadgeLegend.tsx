'use client'

import { BADGE_CATALOG } from '@/lib/badge-catalog'
import { badgeChipClass } from '@/lib/badge-styles'
import { BadgeTheme } from '@/lib/badges'
import { cn } from '@/lib/utils'

const THEME_LABELS: Record<BadgeTheme, string> = {
  sequencia: 'Sequência',
  estilo: 'Estilo de jogo',
  recorde: 'Recordes',
  participacao: 'Participação',
  premio: 'Prêmios',
}

const THEME_ORDER: BadgeTheme[] = ['sequencia', 'estilo', 'recorde', 'participacao', 'premio']

export function BadgeLegend() {
  return (
    <div className="rounded-xl card-border bg-card p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
        Conquistas
      </p>
      <p className="text-xs text-muted-foreground/70 mb-4">
        O que fazer pra desbloquear cada uma. Badges com níveis mostram bronze, prata e ouro.
      </p>

      <div className="space-y-5">
        {THEME_ORDER.map((theme) => {
          const entries = BADGE_CATALOG.filter((b) => b.theme === theme)
          if (entries.length === 0) return null
          return (
            <div key={theme}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                {THEME_LABELS[theme]}
              </p>
              <div className="space-y-3">
                {entries.map((b) => (
                  <div key={b.id} className="flex gap-3">
                    <span
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                        badgeChipClass({ theme: b.theme })
                      )}
                    >
                      {b.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.howTo}</p>
                      {b.levels && (
                        <ul className="mt-1.5 space-y-0.5">
                          {b.levels.map((lvl) => (
                            <li key={lvl.tier} className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full flex-shrink-0',
                                  badgeChipClass({ theme: b.theme, tier: lvl.tier })
                                )}
                              />
                              <span className="capitalize">{lvl.tier}:</span> {lvl.requirement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
