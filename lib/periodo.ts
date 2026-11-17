import { Season } from '@/types'

/** Intervalo de datas (YYYY-MM-DD, inclusivo) usado para filtrar ranking/caixa/stats */
export interface DateRange {
  start: string
  end: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const OPEN_END = '9999-12-31'

/**
 * Lê o período dos query params: `start`+`end` (temporada) ou `year` (legado).
 * Sem nenhum dos dois = todos os tempos (null).
 */
export function parseRange(searchParams: URLSearchParams): DateRange | null {
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (start && end && DATE_RE.test(start) && DATE_RE.test(end)) return { start, end }

  const year = searchParams.get('year')
  if (year && /^\d{4}$/.test(year)) return { start: `${year}-01-01`, end: `${year}-12-31` }

  return null
}

export function inRange(date: string | null | undefined, range: DateRange | null): boolean {
  if (!range) return true
  if (!date) return false
  const d = date.slice(0, 10)
  return d >= range.start && d <= range.end
}

export function seasonRange(season: Pick<Season, 'start_date' | 'end_date'>): DateRange {
  return { start: season.start_date, end: season.end_date ?? OPEN_END }
}

export function rangeQuery(range: DateRange | null): string {
  return range ? `?start=${range.start}&end=${range.end}` : ''
}

/** Temporada que contém a data (YYYY-MM-DD), se houver */
export function findSeasonForDate<T extends Pick<Season, 'start_date' | 'end_date'>>(seasons: T[], date: string): T | undefined {
  return seasons.find((s) => inRange(date, seasonRange(s)))
}

export function todayISO(): string {
  // Data local do Brasil, não UTC (à noite UTC já virou o dia seguinte)
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}
