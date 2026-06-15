'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, CalendarDays, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/',        label: 'Ranking',  Icon: Trophy },
  { href: '/sessoes', label: 'Sessões',  Icon: CalendarDays },
  { href: '/info',    label: 'Info',     Icon: Info },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-felt/95 backdrop-blur border-t border-border">
      <div className="flex items-stretch">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === '/'
            ? pathname === '/'
            : pathname?.startsWith(href) ?? false

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-5 transition-colors',
                active ? 'text-gold' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium tracking-wide', active && 'font-semibold')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
