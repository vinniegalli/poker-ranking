'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const AdminModal = dynamic(() => import('@/components/AdminModal').then(m => ({ default: m.AdminModal })), {
  ssr: false,
  loading: () => <div className="h-8 w-8" />,
})

const links = [
  { href: '/', label: 'Ranking' },
  { href: '/sessoes', label: 'Sessões' },
  { href: '/info', label: 'Info' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-felt/95 backdrop-blur supports-[backdrop-filter]:bg-felt/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-display font-bold tracking-[0.18em] text-sm uppercase select-none">
          <span className="text-foreground">STACK</span><span className="text-gold">S</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                pathname === href || (href !== '/' && (pathname?.startsWith(href) ?? false))
                  ? 'text-foreground bg-white/6'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/4'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="ml-2 pl-2 border-l border-border">
            <AdminModal />
          </div>
        </nav>
      </div>
    </header>
  )
}
