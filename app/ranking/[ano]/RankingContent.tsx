'use client'


import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { RankingTable } from '@/components/RankingTable'
import { CaixaWidget } from '@/components/CaixaWidget'
import { RankingRow } from '@/types'
import { Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RankingAnoPage() {
  const params = useParams<{ ano: string }>()
  const ano = params?.ano ?? ''
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [caixaTotal, setCaixaTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [rankRes, caixaRes] = await Promise.all([
        fetch(`/api/ranking?year=${ano}`),
        fetch(`/api/caixa?year=${ano}`),
      ])
      const rankData = await rankRes.json()
      const caixaData = await caixaRes.json()
      setRanking(Array.isArray(rankData) ? rankData : [])
      setCaixaTotal(caixaData.total ?? 0)
      setLoading(false)
    }
    fetchData()
  }, [ano])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar ao ranking geral
        </Link>
        <h1 className="font-display text-3xl font-bold text-gold flex items-center gap-3">
          <Trophy className="h-7 w-7" />
          Ranking de Premiação {ano}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Este ranking determina os vencedores do caixa acumulado em {ano}
        </p>
      </div>

      <div className="grid gap-6">
        <CaixaWidget total={caixaTotal} label={`Premiação ${ano}`} />

        {loading ? (
          <div className="rounded-lg gold-border bg-card p-12 text-center text-muted-foreground">
            Carregando ranking...
          </div>
        ) : (
          <RankingTable data={ranking} />
        )}
      </div>
    </div>
  )
}
