'use client'

import { useEffect, useState } from 'react'
import { RankingTable } from '@/components/RankingTable'
import { RankingChart } from '@/components/RankingChart'
import { CaixaWidget } from '@/components/CaixaWidget'
import { StatsSection } from '@/components/StatsSection'
import { PremiacoesSection } from '@/components/PremiacoesSection'
import { DistribuirPremiacaoModal } from '@/components/DistribuirPremiacaoModal'
import { useAdmin } from '@/hooks/use-admin'
import { RankingRow } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function HomePage() {
  const { isAdmin } = useAdmin()
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [caixaTotal, setCaixaTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [premiacoesKey, setPremiacoesKey] = useState(0)

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

  function handleDistribuido() {
    fetchData()
    setPremiacoesKey(k => k + 1)
  }

  function handleSaidaChange() {
    fetchData()
    setPremiacoesKey(k => k + 1)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Ranking Geral
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acumulado de sessões encerradas
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-36 bg-card border-border">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <DistribuirPremiacaoModal
                caixaTotal={caixaTotal}
                onDistribuido={handleDistribuido}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <CaixaWidget
          total={caixaTotal}
          label={selectedYear !== 'all' ? `Caixa ${selectedYear}` : 'Saldo em Caixa'}
          onSaidaChange={handleSaidaChange}
        />

        {loading ? (
          <div className="rounded-lg card-border bg-card p-12 text-center text-muted-foreground text-sm">
            Carregando ranking...
          </div>
        ) : (
          <>
            <RankingTable data={ranking} />
            <RankingChart year={selectedYear !== 'all' ? selectedYear : undefined} />
          </>
        )}

        <PremiacoesSection refreshKey={premiacoesKey} onDeleted={fetchData} />
        <StatsSection />
      </div>
    </div>
  )
}
