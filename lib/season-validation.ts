import { Season } from '@/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type SeasonInput = Pick<Season, 'name' | 'start_date' | 'end_date' | 'buyin_amount' | 'rebuy_amount' | 'caixa_fee'>

function money(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) / 100 : null
}

/** Valida e normaliza o corpo de criação/edição de temporada */
export function parseSeasonBody(body: Record<string, unknown>): { value: SeasonInput } | { error: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return { error: 'Nome é obrigatório' }

  const start = String(body.start_date ?? '')
  if (!DATE_RE.test(start)) return { error: 'Data de início inválida' }

  const endRaw = body.end_date
  const end = endRaw ? String(endRaw) : null
  if (end && !DATE_RE.test(end)) return { error: 'Data de fim inválida' }
  if (end && end < start) return { error: 'Fim não pode ser antes do início' }

  const buyin = money(body.buyin_amount)
  const rebuy = money(body.rebuy_amount)
  const fee = money(body.caixa_fee)
  if (buyin === null || buyin === 0) return { error: 'Buy-in inválido' }
  if (rebuy === null || rebuy === 0) return { error: 'Rebuy inválido' }
  if (fee === null) return { error: 'Taxa de caixa inválida' }

  return {
    value: { name, start_date: start, end_date: end, buyin_amount: buyin, rebuy_amount: rebuy, caixa_fee: fee },
  }
}

export function previousDay(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

type Period = Pick<Season, 'start_date' | 'end_date'>

export function overlaps(a: Period, b: Period): boolean {
  const aEnd = a.end_date ?? '9999-12-31'
  const bEnd = b.end_date ?? '9999-12-31'
  return a.start_date <= bEnd && b.start_date <= aEnd
}
