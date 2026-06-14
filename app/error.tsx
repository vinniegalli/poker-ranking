'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
      <p className="text-muted-foreground mb-6 text-sm">Ocorreu um erro inesperado.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="text-gold hover:underline text-sm"
        >
          Tentar novamente
        </button>
        <span className="text-muted-foreground">·</span>
        <Link href="/" className="text-gold hover:underline text-sm">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
