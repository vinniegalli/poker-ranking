'use client'


import { useEffect, useState } from 'react'
import { RankingTable } from '@/components/RankingTable'
import { CaixaWidget } from '@/components/CaixaWidget'
import { RankingRow } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spade } from 'lucide-react'
import Link from 'next/link'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [caixaTotal, setCaixaTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [selectedYear])

  async function fetchData() {
    setLoading(true)
    const yearParam = selectedYear !== 'all' ? `?year=${selectedYear}` : ''

    const [rankRes, caixaRes] = await Promise.all([
      fetch(`/api/ranking${yearParam}`),
      fetch(`/api/caixa${yearParam}`),
    ])

    const rankData = await rankRes.json()
    const caixaData = await caixaRes.json()

    setRanking(Array.isArray(rankData) ? rankData : [])
    setCaixaTotal(caixaData.total ?? 0)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold flex items-center gap-3">
              <Spade className="h-7 w-7" />
              Ranking Geral
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acumulado de todas as sessões
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-36 bg-card border-border">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedYear !== 'all' && (
              <Link
                href={`/ranking/${selectedYear}`}
                className="text-xs text-gold hover:underline"
              >
                Ver ranking premiação →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <CaixaWidget
          total={caixaTotal}
          label={selectedYear !== 'all' ? `Caixa ${selectedYear}` : 'Saldo em Caixa (Total)'}
        />

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
