'use client'

import { useEffect, useState } from 'react'
import { RankingTable } from '@/components/RankingTable'
import { PrevisaoSection } from '@/components/PrevisaoSection'
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
            Ranking Geral
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Sessões encerradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-10 flex-1 sm:flex-none sm:w-36 bg-card border-border text-sm">
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

      <div className="grid gap-4 sm:gap-6">
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
            <PrevisaoSection
              ranking={ranking}
              caixaTotal={caixaTotal}
              year={selectedYear !== 'all' ? selectedYear : undefined}
            />
          </>
        )}

        <PremiacoesSection refreshKey={premiacoesKey} onDeleted={fetchData} />
        <StatsSection />
      </div>
    </div>
  )
}
