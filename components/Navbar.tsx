'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { Spade } from 'lucide-react'
import { cn } from '@/lib/utils'

const AdminModal = dynamic(() => import('@/components/AdminModal').then(m => ({ default: m.AdminModal })), {
  ssr: false,
  loading: () => <div className="h-8 w-8" />,
})

const links = [
  { href: '/', label: 'Ranking' },
  { href: '/sessoes', label: 'Sessões' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-felt/95 backdrop-blur supports-[backdrop-filter]:bg-felt/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Spade className="h-5 w-5 text-gold group-hover:scale-110 transition-transform" />
          <span className="font-display text-lg font-semibold text-gold">
            Poker Ranking
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                pathname === href || (href !== '/' && (pathname?.startsWith(href) ?? false))
                  ? 'text-gold bg-gold/10'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="ml-2 pl-2 border-l border-border/50">
            <AdminModal />
          </div>
        </nav>
      </div>
    </header>
  )
}
