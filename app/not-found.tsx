export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Spade } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Spade className="h-16 w-16 text-gold/40 mb-4" />
      <h1 className="font-display text-4xl font-bold text-gold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Página não encontrada.</p>
      <Link href="/" className="text-gold hover:underline text-sm">
        Voltar ao ranking
      </Link>
    </div>
  )
}
