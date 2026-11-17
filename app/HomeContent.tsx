'use client'

import { useEffect, useState } from 'react'
import { RankingTable } from '@/components/RankingTable'
import { PrevisaoSection } from '@/components/PrevisaoSection'
import { CaixaWidget } from '@/components/CaixaWidget'
import { StatsSection } from '@/components/StatsSection'
import { PremiacoesSection } from '@/components/PremiacoesSection'
import { DistribuirPremiacaoModal } from '@/components/DistribuirPremiacaoModal'
import { SessionRecapModal } from '@/components/SessionRecapModal'
import { Button } from '@/components/ui/button'
import { useAdmin } from '@/hooks/use-admin'
import { RankingRow } from '@/types'
import { useSeasons } from '@/hooks/use-seasons'
import { DateRange, findSeasonForDate, rangeQuery, seasonRange, todayISO } from '@/lib/periodo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PartyPopper } from 'lucide-react'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
const LAST_SEEN_RECAP_KEY = 'poker_last_seen_recap'

export default function HomePage() {
  const { isAdmin } = useAdmin()
  const { seasons, loaded: seasonsLoaded } = useSeasons()
  // 'all' | 'season:<id>' | 'year:<aaaa>' — null até as temporadas carregarem
  const [period, setPeriod] = useState<string | null>(null)
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [caixaTotal, setCaixaTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [premiacoesKey, setPremiacoesKey] = useState(0)
  const [latestClosedSessionId, setLatestClosedSessionId] = useState<string | null>(null)
  const [recapOpen, setRecapOpen] = useState(false)

  // Padrão: temporada em andamento (se houver), senão todos os tempos
  useEffect(() => {
    if (!seasonsLoaded || period !== null) return
    const current = findSeasonForDate(seasons, todayISO())
    setPeriod(current ? `season:${current.id}` : 'all')
  }, [seasonsLoaded, seasons, period])

  const selectedSeason = period?.startsWith('season:')
    ? seasons.find((s) => s.id === period.slice(7)) ?? null
    : null
  const selectedYear = period?.startsWith('year:') ? period.slice(5) : null
  const range: DateRange | null = selectedSeason
    ? seasonRange(selectedSeason)
    : selectedYear
      ? { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` }
      : null
  const periodLabel = selectedSeason?.name ?? selectedYear ?? null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (period !== null) fetchData() }, [period, seasons])

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((sessions) => {
        if (!Array.isArray(sessions)) return
        const latestClosed = sessions.find((s: { is_closed: boolean }) => s.is_closed)
        if (!latestClosed) return
        setLatestClosedSessionId(latestClosed.id)
        const lastSeen = localStorage.getItem(LAST_SEEN_RECAP_KEY)
        if (lastSeen !== latestClosed.id) setRecapOpen(true)
      })
  }, [])

  async function fetchData() {
    setLoading(true)
    const yearParam = rangeQuery(range)

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

  function closeRecap() {
    setRecapOpen(false)
    if (latestClosedSessionId) localStorage.setItem(LAST_SEEN_RECAP_KEY, latestClosedSessionId)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
            {periodLabel ? `Ranking · ${periodLabel}` : 'Ranking Geral'}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {selectedSeason
              ? selectedSeason.end_date
                ? 'Temporada encerrada'
                : 'Temporada em andamento · sessões encerradas'
              : 'Sessões encerradas'}
          </p>
        </div>

        {/* Mobile: período em linha inteira + ações lado a lado embaixo.
            Desktop: tudo numa linha só. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select value={period ?? undefined} onValueChange={setPeriod}>
            <SelectTrigger className="col-span-2 h-10 w-full sm:w-48 bg-card border-border text-sm sm:order-2">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {seasons.map((s) => (
                <SelectItem key={s.id} value={`season:${s.id}`}>
                  {s.name}{!s.end_date && ' (atual)'}
                </SelectItem>
              ))}
              <SelectItem value="all">Todos os tempos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={`year:${y}`}>Ano {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {latestClosedSessionId && (
            <Button
              variant="outline"
              onClick={() => setRecapOpen(true)}
              className={`h-10 border-border text-muted-foreground hover:text-foreground text-sm sm:order-1 ${isAdmin ? '' : 'col-span-2'}`}
            >
              <PartyPopper className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="sm:hidden">Última sessão</span>
              <span className="hidden sm:inline">Resumo da última sessão</span>
            </Button>
          )}

          {isAdmin && (
            <div className={`sm:order-3 [&>button]:w-full ${latestClosedSessionId ? '' : 'col-span-2'}`}>
              <DistribuirPremiacaoModal
                caixaTotal={caixaTotal}
                onDistribuido={handleDistribuido}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6">
        <CaixaWidget
          total={caixaTotal}
          label={periodLabel ? `Caixa · ${periodLabel}` : 'Saldo em Caixa'}
          onSaidaChange={handleSaidaChange}
          range={range}
        />

        {loading || period === null ? (
          <div className="rounded-lg card-border bg-card p-12 text-center text-muted-foreground text-sm">
            Carregando ranking...
          </div>
        ) : (
          <>
            <RankingTable data={ranking} />
            <PrevisaoSection
              ranking={ranking}
              caixaTotal={caixaTotal}
              range={range}
            />
          </>
        )}

        <PremiacoesSection refreshKey={premiacoesKey} onDeleted={fetchData} />
        <StatsSection range={range} periodLabel={periodLabel} />
      </div>

      <SessionRecapModal sessionId={latestClosedSessionId} open={recapOpen} onClose={closeRecap} />
    </div>
  )
}
