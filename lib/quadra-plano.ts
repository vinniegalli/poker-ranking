/**
 * Plano anual de quadras: quais cartas valem quadra em cada mês do ano.
 * Fica salvo na tabela config (chave `quadra_plano`) como JSON.
 */

/** Ordem do baralho, da menor pra maior (usada pela sugestão automática) */
export const RANKS_ASC = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export const CONFIG_KEY = 'quadra_plano'

export interface QuadraPlano {
  /** Primeiro mês em que o plano vale, 'AAAA-MM'. Meses anteriores não são tocados. */
  inicio: string
  /** Prêmio padrão de cada quadra criada pelo plano (R$) */
  premio: number
  /** Cartas de cada mês: chave '1'..'12' */
  meses: Record<string, string[]>
  /** Meses ('AAAA-MM') já preenchidos pelo plano — cada mês é preenchido uma vez só */
  aplicados: string[]
}

/**
 * Distância entre as cartas de um mês na sugestão. Com 3 por mês fica
 * exatamente o padrão: jan 2·7·10, fev 3·8·J, mar 4·9·Q...
 * Cada mês anda uma carta, então as 13 aparecem quase o mesmo número de vezes.
 */
const OFFSETS: Record<number, number[]> = {
  1: [0],
  2: [0, 6],
  3: [0, 5, 8],
  4: [0, 3, 6, 9],
}

export function suggestPlano(porMes: number): Record<string, string[]> {
  const offsets = OFFSETS[porMes] ?? OFFSETS[3]
  const meses: Record<string, string[]> = {}
  for (let m = 0; m < 12; m++) {
    meses[String(m + 1)] = sortRanks(offsets.map((o) => RANKS_ASC[(m + o) % 13]))
  }
  return meses
}

export function sortRanks(ranks: string[]): string[] {
  return [...new Set(ranks)]
    .filter((r) => RANKS_ASC.includes(r))
    .sort((a, b) => RANKS_ASC.indexOf(a) - RANKS_ASC.indexOf(b))
}

/** Lê o plano salvo na config; null se não houver ou estiver inválido */
export function parsePlano(raw: string | null | undefined): QuadraPlano | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p.inicio !== 'string' || !/^\d{4}-\d{2}$/.test(p.inicio)) return null
    const meses: Record<string, string[]> = {}
    for (let m = 1; m <= 12; m++) meses[String(m)] = sortRanks(Array.isArray(p.meses?.[m]) ? p.meses[m] : [])
    const premio = Number(p.premio)
    const aplicados = Array.isArray(p.aplicados) ? p.aplicados.filter((m: unknown) => typeof m === 'string') : []
    return { inicio: p.inicio, premio: Number.isFinite(premio) && premio >= 0 ? premio : 0, meses, aplicados }
  } catch {
    return null
  }
}

/** Cartas que o plano define para um mês 'AAAA-MM-01' (vazio se o plano ainda não vale) */
export function ranksDoPlano(plano: QuadraPlano | null, month: string): string[] {
  if (!plano) return []
  if (month.slice(0, 7) < plano.inicio) return []
  if (plano.aplicados.includes(month.slice(0, 7))) return []
  return plano.meses[String(Number(month.slice(5, 7)))] ?? []
}

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
