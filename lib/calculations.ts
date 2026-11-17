/** Valores padrão (os que valiam antes de existirem valores por sessão) */
export const BUYIN_AMOUNT = 20   // valor do 1º buy-in (vai pro pote)
export const REBUY_AMOUNT = 20   // valor de cada rebuy (vai pro pote)
export const CAIXA_FEE = 5       // taxa de caixa (fixo por jogador, não por buy-in)
export const MAX_PLAYERS = 10

/** Valores financeiros de uma sessão (gravados na sessão, herdados da temporada) */
export interface SessionValues {
  buyin_amount: number
  rebuy_amount: number
  caixa_fee: number
}

export const DEFAULT_VALUES: SessionValues = {
  buyin_amount: BUYIN_AMOUNT,
  rebuy_amount: REBUY_AMOUNT,
  caixa_fee: CAIXA_FEE,
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return v === null || v === undefined || !Number.isFinite(n) ? fallback : n
}

/** Extrai os valores de uma sessão/temporada, caindo nos padrões se faltar algo */
export function sessionValues(src?: Partial<Record<keyof SessionValues, unknown>> | null): SessionValues {
  return {
    buyin_amount: num(src?.buyin_amount, BUYIN_AMOUNT),
    rebuy_amount: num(src?.rebuy_amount, REBUY_AMOUNT),
    caixa_fee: num(src?.caixa_fee, CAIXA_FEE),
  }
}

/** Valor total que o jogador colocou no pote (sem caixa): 1º buy-in + rebuys */
export function calcSomaCompra(buyinCount: number, v: SessionValues = DEFAULT_VALUES): number {
  if (buyinCount <= 0) return 0
  return v.buyin_amount + (buyinCount - 1) * v.rebuy_amount
}

/** Taxa de caixa: fixa por jogador por sessão */
export function calcCaixaContribution(v: SessionValues = DEFAULT_VALUES): number {
  return v.caixa_fee
}

/** Total desembolsado pelo jogador (pote + caixa) — só pra exibição */
export function calcTotalPago(buyinCount: number, v: SessionValues = DEFAULT_VALUES, caixaFee: number = v.caixa_fee): number {
  return calcSomaCompra(buyinCount, v) + caixaFee
}

/** Valor da entrada (1 buy-in + caixa) — o que o jogador paga ao confirmar presença */
export function calcEntrada(v: SessionValues = DEFAULT_VALUES): number {
  return calcTotalPago(1, v)
}

/**
 * Valor já pago em dinheiro pelas fichas. A taxa de caixa é cobrada junto com
 * a primeira compra, então só conta como paga quando ao menos 1 buy-in foi pago
 * (0 buy-ins pagos = nada foi pago, nem o caixa).
 */
export function calcValorPago(buyinsPagos: number, caixaFee: number = CAIXA_FEE, v: SessionValues = DEFAULT_VALUES): number {
  if (buyinsPagos <= 0) return 0
  return calcSomaCompra(buyinsPagos, v) + caixaFee
}

/** Quanto ainda falta pagar (pote + caixa) considerando as fichas já pagas */
export function calcFaltaPagar(buyinCount: number, buyinsPagos: number, caixaFee: number = CAIXA_FEE, v: SessionValues = DEFAULT_VALUES): number {
  return calcTotalPago(buyinCount, v, caixaFee) - calcValorPago(buyinsPagos, caixaFee, v)
}

/**
 * Acerto final em dinheiro: quanto falta pagar pelas fichas ainda não pagas
 * (pote + caixa) é descontado do que o jogador tem a receber. Positivo = a
 * banca deve pagar ao jogador; negativo = o jogador ainda deve à banca.
 */
export function calcAcertoFinal(buyinCount: number, somaGanho: number, buyinsPagos: number, caixaFee: number = CAIXA_FEE, v: SessionValues = DEFAULT_VALUES): number {
  return somaGanho - calcFaltaPagar(buyinCount, buyinsPagos, caixaFee, v)
}

export interface SessionResult {
  date: string
  saldo: number
}

/** Sequência atual: sessões mais recentes consecutivas com saldo positivo */
export function calcCurrentStreak(sessions: SessionResult[]): number {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const s of sorted) {
    if (s.saldo > 0) streak++
    else break
  }
  return streak
}

/** Maior sequência de sessões seguidas com saldo positivo, em toda a história */
export function calcBestStreak(sessions: SessionResult[]): number {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let current = 0
  for (const s of sorted) {
    if (s.saldo > 0) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

/** Sequência atual: sessões mais recentes consecutivas com saldo negativo */
export function calcCurrentLosingStreak(sessions: SessionResult[]): number {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const s of sorted) {
    if (s.saldo < 0) streak++
    else break
  }
  return streak
}

/** Jogador com o maior saldo positivo entre os participantes de uma sessão (null se ninguém lucrou) */
export function calcMvp<T extends { name: string; saldo: number }>(players: T[]): { name: string; saldo: number } | null {
  return players.reduce<{ name: string; saldo: number } | null>((best, p) => {
    if (p.saldo <= 0) return best
    if (!best || p.saldo > best.saldo) return { name: p.name, saldo: p.saldo }
    return best
  }, null)
}

/** Valor em R$ que corresponde a uma porcentagem do caixa, arredondado a centavos */
export function calcPremioAmount(pct: number, caixaTotal: number): number {
  return Math.round((pct / 100) * caixaTotal * 100) / 100
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
