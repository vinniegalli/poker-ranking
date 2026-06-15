'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const AdminModal = dynamic(() => import('@/components/AdminModal').then(m => ({ default: m.AdminModal })), {
  ssr: false,
  loading: () => <div className="h-10 w-10" />,
})

const desktopLinks = [
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

        {/* Desktop nav links — hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {desktopLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href || (href !== '/' && (pathname?.startsWith(href) ?? false))
                  ? 'text-foreground bg-white/6'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/4'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="ml-1 pl-2 border-l border-border flex items-center">
            <AdminModal />
          </div>
        </nav>

        {/* Mobile: just admin button */}
        <div className="sm:hidden">
          <AdminModal />
        </div>
      </div>
    </header>
  )
}
