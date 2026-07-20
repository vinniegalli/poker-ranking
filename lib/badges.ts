import { calcCurrentLosingStreak, calcCurrentStreak } from './calculations'

export type BadgeTheme = 'sequencia' | 'estilo' | 'recorde' | 'participacao' | 'premio'

export interface Badge {
  id: string
  icon: string
  label: string
  description: string
  theme: BadgeTheme
}

export interface PlayerSessionRow {
  player_id: string
  name: string
  date: string
  buyin_count: number
  soma_compra: number
  soma_ganho: number
}

const MIN_SESSIONS_FOR_STYLE = 5
const NOITE_HISTORICA_THRESHOLD = 100
const SEMPRE_POR_PERTO_THRESHOLD = 0.8
const ISCA_MIN_BUYINS = 4
const VETERANO_LEVELS = [50, 25, 10] // do maior pro menor, pra reportar o nível mais alto atingido

function stddev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function computeBadges(
  rows: PlayerSessionRow[],
  playersWithPrize: Set<string>
): Map<string, Badge[]> {
  const byPlayer = new Map<string, { name: string; sessions: { date: string; saldo: number; buyin_count: number }[] }>()
  for (const row of rows) {
    if (!byPlayer.has(row.player_id)) {
      byPlayer.set(row.player_id, { name: row.name, sessions: [] })
    }
    const saldo = row.soma_ganho - row.soma_compra
    byPlayer.get(row.player_id)!.sessions.push({ date: row.date, saldo, buyin_count: row.buyin_count })
  }

  // Rei do ranking: maior soma de saldo por ano
  const yearTotals = new Map<string, Map<string, number>>()
  const yearParticipation = new Map<string, Map<string, number>>()
  const yearSessionDates = new Map<string, Set<string>>()

  for (const [pid, data] of byPlayer) {
    for (const s of data.sessions) {
      const year = s.date.slice(0, 4)
      if (!yearTotals.has(year)) yearTotals.set(year, new Map())
      if (!yearParticipation.has(year)) yearParticipation.set(year, new Map())
      if (!yearSessionDates.has(year)) yearSessionDates.set(year, new Set())

      const totals = yearTotals.get(year)!
      totals.set(pid, (totals.get(pid) ?? 0) + s.saldo)

      const parts = yearParticipation.get(year)!
      parts.set(pid, (parts.get(pid) ?? 0) + 1)

      yearSessionDates.get(year)!.add(s.date)
    }
  }

  const kingYearsByPlayer = new Map<string, string[]>()
  for (const [year, totals] of yearTotals) {
    let bestPid: string | null = null
    let bestValue = -Infinity
    for (const [pid, total] of totals) {
      if (total > bestValue) { bestValue = total; bestPid = pid }
    }
    if (bestPid) {
      if (!kingYearsByPlayer.has(bestPid)) kingYearsByPlayer.set(bestPid, [])
      kingYearsByPlayer.get(bestPid)!.push(year)
    }
  }

  // Títulos de estilo (comparativos, exigem amostra mínima)
  const eligible = [...byPlayer.entries()].filter(([, d]) => d.sessions.length >= MIN_SESSIONS_FOR_STYLE)
  const styleStats = eligible.map(([pid, d]) => {
    const saldos = d.sessions.map((s) => s.saldo)
    const winRate = d.sessions.filter((s) => s.saldo > 0).length / d.sessions.length
    return { pid, stddev: stddev(saldos), winRate }
  })

  const minStddev = styleStats.length ? Math.min(...styleStats.map((s) => s.stddev)) : null
  const maxStddev = styleStats.length ? Math.max(...styleStats.map((s) => s.stddev)) : null
  const maxWinRate = styleStats.length ? Math.max(...styleStats.map((s) => s.winRate)) : null

  const rochaHolders = new Set(styleStats.filter((s) => s.stddev === minStddev).map((s) => s.pid))
  const montanhaRussaHolders = new Set(styleStats.filter((s) => s.stddev === maxStddev).map((s) => s.pid))
  const sharkHolders = new Set(
    styleStats.filter((s) => maxWinRate !== null && maxWinRate > 0 && s.winRate === maxWinRate).map((s) => s.pid)
  )

  const result = new Map<string, Badge[]>()

  for (const [pid, data] of byPlayer) {
    const badges: Badge[] = []
    const sessions = data.sessions
    const participacoes = sessions.length

    if (calcCurrentStreak(sessions) >= 3) {
      badges.push({ id: 'em_chamas', icon: '🔥', label: 'Em chamas', description: '3+ vitórias seguidas', theme: 'sequencia' })
    }
    if (calcCurrentLosingStreak(sessions) >= 3) {
      badges.push({ id: 'fase_ruim', icon: '🧊', label: 'Fase ruim', description: '3+ derrotas seguidas', theme: 'sequencia' })
    }

    if (rochaHolders.has(pid)) {
      badges.push({ id: 'rocha', icon: '🪨', label: 'Rocha', description: 'O jogador mais consistente do grupo', theme: 'estilo' })
    }
    if (montanhaRussaHolders.has(pid)) {
      badges.push({ id: 'montanha_russa', icon: '🎢', label: 'Montanha-russa', description: 'O jogador mais instável do grupo', theme: 'estilo' })
    }
    if (sharkHolders.has(pid)) {
      badges.push({ id: 'shark', icon: '🦈', label: 'Shark', description: 'Maior taxa de vitória do grupo', theme: 'estilo' })
    }
    if (sessions.some((s) => s.buyin_count >= ISCA_MIN_BUYINS && s.saldo < 0)) {
      badges.push({
        id: 'isca',
        icon: '🎣',
        label: 'Isca',
        description: `Comprou ${ISCA_MIN_BUYINS}+ fichas numa noite e saiu no vermelho`,
        theme: 'estilo',
      })
    }

    const melhorSaldo = Math.max(...sessions.map((s) => s.saldo))
    if (melhorSaldo >= NOITE_HISTORICA_THRESHOLD) {
      badges.push({
        id: 'noite_historica',
        icon: '💰',
        label: 'Noite histórica',
        description: `Melhor sessão pessoal acima de R$${NOITE_HISTORICA_THRESHOLD}`,
        theme: 'recorde',
      })
    }

    const kingYears = kingYearsByPlayer.get(pid)
    if (kingYears?.length) {
      badges.push({
        id: 'rei_do_ranking',
        icon: '👑',
        label: 'Rei do ranking',
        description: `1º lugar no ranking de ${[...kingYears].sort().join(', ')}`,
        theme: 'recorde',
      })
    }

    for (const [year, parts] of yearParticipation) {
      const count = parts.get(pid) ?? 0
      const totalYear = yearSessionDates.get(year)?.size ?? 0
      if (totalYear > 0 && count / totalYear >= SEMPRE_POR_PERTO_THRESHOLD) {
        badges.push({
          id: 'sempre_por_perto',
          icon: '🎯',
          label: 'Sempre por perto',
          description: `80%+ de presença em ${year}`,
          theme: 'participacao',
        })
        break
      }
    }

    const veteranoLevel = VETERANO_LEVELS.find((lvl) => participacoes >= lvl)
    if (veteranoLevel) {
      badges.push({
        id: 'veterano',
        icon: '🎖️',
        label: 'Veterano',
        description: `${veteranoLevel}+ sessões jogadas`,
        theme: 'participacao',
      })
    }
    if (participacoes >= 1) {
      badges.push({ id: 'estreante', icon: '🐣', label: 'Estreante', description: 'Primeira sessão registrada', theme: 'participacao' })
    }

    if (playersWithPrize.has(pid)) {
      badges.push({ id: 'sortudo', icon: '🎁', label: 'Sortudo', description: 'Já ganhou uma premiação', theme: 'premio' })
    }

    result.set(pid, badges)
  }

  return result
}
