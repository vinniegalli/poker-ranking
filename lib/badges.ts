import { calcCurrentLosingStreak, calcCurrentStreak } from './calculations'

export type BadgeTheme = 'sequencia' | 'estilo' | 'recorde' | 'participacao' | 'premio'
export type BadgeTier = 'bronze' | 'prata' | 'ouro'

export interface Badge {
  id: string
  icon: string
  label: string
  description: string
  theme: BadgeTheme
  tier?: BadgeTier
}

export interface PlayerSessionRow {
  player_id: string
  name: string
  date: string
  buyin_count: number
  soma_compra: number
  soma_ganho: number
}

export interface Level {
  min: number
  tier: BadgeTier
}

export const STREAK_THRESHOLD = 3
export const MIN_SESSIONS_FOR_STYLE = 5
export const SEMPRE_POR_PERTO_THRESHOLD = 0.8
export const ISCA_MIN_BUYINS = 4
export const VIRADA_MIN_BUYINS = 3
export const CIRURGIAO_TOLERANCIA = 1 // R$

// Todos em ordem do maior pro menor, pra reportar o nível mais alto atingido
export const VETERANO_LEVELS: Level[] = [{ min: 50, tier: 'ouro' }, { min: 25, tier: 'prata' }, { min: 10, tier: 'bronze' }]
export const GANHO_LEVELS: Level[] = [
  { min: 100, tier: 'ouro' }, { min: 70, tier: 'prata' }, { min: 50, tier: 'prata' },
  { min: 20, tier: 'bronze' }, { min: 10, tier: 'bronze' },
]
// Ordem de checagem continua do maior pro menor threshold (pra achar o pior resultado batido),
// mas o tier é invertido — perder mais não é "melhor", então ouro é pra quem perdeu menos.
export const PERDA_LEVELS: Level[] = [
  { min: 100, tier: 'bronze' }, { min: 70, tier: 'bronze' }, { min: 50, tier: 'prata' },
  { min: 20, tier: 'prata' }, { min: 10, tier: 'ouro' },
]
export const SALDO_TOTAL_LEVELS: Level[] = [{ min: 1000, tier: 'ouro' }, { min: 500, tier: 'prata' }, { min: 100, tier: 'bronze' }]
export const FIEL_LEVELS: Level[] = [{ min: 4, tier: 'ouro' }, { min: 3, tier: 'prata' }, { min: 2, tier: 'bronze' }]
const ESTILO_RANK_TIERS: BadgeTier[] = ['ouro', 'prata', 'bronze'] // posição 1, 2, 3 no grupo
export const PODIO_META: Record<1 | 2 | 3, { label: string; icon: string; tier: BadgeTier }> = {
  1: { label: 'Rei do ranking', icon: '👑', tier: 'ouro' },
  2: { label: 'Vice-campeão', icon: '🥈', tier: 'prata' },
  3: { label: '3º lugar no ranking', icon: '🥉', tier: 'bronze' },
}

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

  // Pódio do ranking por ano: top 3 por soma de saldo
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

  const podiumByPlayer = new Map<string, { position: 1 | 2 | 3; years: string[] }>()
  for (const [year, totals] of yearTotals) {
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    sorted.forEach(([pid], idx) => {
      const position = (idx + 1) as 1 | 2 | 3
      const existing = podiumByPlayer.get(pid)
      if (!existing || position < existing.position) {
        podiumByPlayer.set(pid, { position, years: [year] })
      } else if (position === existing.position) {
        existing.years.push(year)
      }
    })
  }

  // Títulos de estilo (comparativos, top 3 do grupo, exigem amostra mínima)
  const eligible = [...byPlayer.entries()].filter(([, d]) => d.sessions.length >= MIN_SESSIONS_FOR_STYLE)
  const styleStats = eligible.map(([pid, d]) => {
    const saldos = d.sessions.map((s) => s.saldo)
    const winRate = d.sessions.filter((s) => s.saldo > 0).length / d.sessions.length
    return { pid, stddev: stddev(saldos), winRate }
  })

  const rochaTier = new Map(
    [...styleStats].sort((a, b) => a.stddev - b.stddev).slice(0, 3).map((s, i) => [s.pid, ESTILO_RANK_TIERS[i]])
  )
  const montanhaRussaTier = new Map(
    [...styleStats].sort((a, b) => b.stddev - a.stddev).slice(0, 3).map((s, i) => [s.pid, ESTILO_RANK_TIERS[i]])
  )
  const sharkTier = new Map(
    [...styleStats].filter((s) => s.winRate > 0).sort((a, b) => b.winRate - a.winRate).slice(0, 3)
      .map((s, i) => [s.pid, ESTILO_RANK_TIERS[i]])
  )

  const result = new Map<string, Badge[]>()

  for (const [pid, data] of byPlayer) {
    const badges: Badge[] = []
    const sessions = data.sessions
    const participacoes = sessions.length

    if (calcCurrentStreak(sessions) >= STREAK_THRESHOLD) {
      badges.push({ id: 'em_chamas', icon: '🔥', label: 'Em chamas', description: `${STREAK_THRESHOLD}+ vitórias seguidas`, theme: 'sequencia' })
    }
    if (calcCurrentLosingStreak(sessions) >= STREAK_THRESHOLD) {
      badges.push({ id: 'fase_ruim', icon: '🧊', label: 'Fase ruim', description: `${STREAK_THRESHOLD}+ derrotas seguidas`, theme: 'sequencia' })
    }

    if (rochaTier.has(pid)) {
      badges.push({ id: 'rocha', icon: '🪨', label: 'Rocha', description: 'Top 3 mais consistentes do grupo', theme: 'estilo', tier: rochaTier.get(pid) })
    }
    if (montanhaRussaTier.has(pid)) {
      badges.push({ id: 'montanha_russa', icon: '🎢', label: 'Montanha-russa', description: 'Top 3 mais instáveis do grupo', theme: 'estilo', tier: montanhaRussaTier.get(pid) })
    }
    if (sharkTier.has(pid)) {
      badges.push({ id: 'shark', icon: '🦈', label: 'Shark', description: 'Top 3 em taxa de vitória do grupo', theme: 'estilo', tier: sharkTier.get(pid) })
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
    if (sessions.some((s) => s.buyin_count >= VIRADA_MIN_BUYINS && s.saldo > 0)) {
      badges.push({
        id: 'virada',
        icon: '🔄',
        label: 'Virada',
        description: `Comprou ${VIRADA_MIN_BUYINS}+ fichas numa noite e mesmo assim terminou no azul`,
        theme: 'estilo',
      })
    }
    if (sessions.some((s) => Math.abs(s.saldo) <= CIRURGIAO_TOLERANCIA)) {
      badges.push({
        id: 'cirurgiao',
        icon: '🔬',
        label: 'Cirurgião',
        description: `Terminou uma sessão a menos de R$${CIRURGIAO_TOLERANCIA} do zero a zero`,
        theme: 'estilo',
      })
    }

    const melhorSaldo = Math.max(...sessions.map((s) => s.saldo))
    const ganhoLevel = GANHO_LEVELS.find((lvl) => melhorSaldo >= lvl.min)
    if (ganhoLevel) {
      badges.push({
        id: 'grande_vitoria',
        icon: '💰',
        label: `Ganhou R$${ganhoLevel.min}+`,
        description: `Melhor sessão pessoal: +R$${melhorSaldo.toFixed(2)} numa única noite`,
        theme: 'recorde',
        tier: ganhoLevel.tier,
      })
    }

    const piorSaldo = Math.min(...sessions.map((s) => s.saldo))
    const perdaLevel = PERDA_LEVELS.find((lvl) => piorSaldo <= -lvl.min)
    if (perdaLevel) {
      badges.push({
        id: 'grande_perda',
        icon: '💀',
        label: `Perdeu R$${perdaLevel.min}+`,
        description: `Pior sessão pessoal: -R$${Math.abs(piorSaldo).toFixed(2)} numa única noite`,
        theme: 'recorde',
        tier: perdaLevel.tier,
      })
    }

    const somaSaldoTotal = sessions.reduce((s, x) => s + x.saldo, 0)
    const marcoLevel = SALDO_TOTAL_LEVELS.find((lvl) => somaSaldoTotal >= lvl.min)
    if (marcoLevel) {
      badges.push({
        id: 'marco_saldo',
        icon: '💎',
        label: `R$${marcoLevel.min}+ acumulados`,
        description: `Saldo total na carreira: R$${somaSaldoTotal.toFixed(2)}`,
        theme: 'recorde',
        tier: marcoLevel.tier,
      })
    }

    const podium = podiumByPlayer.get(pid)
    if (podium) {
      const meta = PODIO_META[podium.position]
      badges.push({
        id: 'podio_do_ano',
        icon: meta.icon,
        label: meta.label,
        description: `${podium.position}º lugar no ranking de ${[...podium.years].sort().join(', ')}`,
        theme: 'recorde',
        tier: meta.tier,
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

    const veteranoLevel = VETERANO_LEVELS.find((lvl) => participacoes >= lvl.min)
    if (veteranoLevel) {
      badges.push({
        id: 'veterano',
        icon: '🎖️',
        label: 'Veterano',
        description: `${veteranoLevel.min}+ sessões jogadas`,
        theme: 'participacao',
        tier: veteranoLevel.tier,
      })
    }

    const yearsPlayed = new Set(sessions.map((s) => s.date.slice(0, 4)))
    const fielLevel = FIEL_LEVELS.find((lvl) => yearsPlayed.size >= lvl.min)
    if (fielLevel) {
      badges.push({
        id: 'fiel',
        icon: '📅',
        label: 'Fiel',
        description: `Jogou em ${yearsPlayed.size} anos diferentes`,
        theme: 'participacao',
        tier: fielLevel.tier,
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
