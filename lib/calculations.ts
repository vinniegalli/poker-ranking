export const BUYIN_AMOUNT = 20   // valor por buy-in (vai pro pote)
export const CAIXA_FEE = 5       // taxa de caixa (fixo por jogador, não por buy-in)

/** Valor total que o jogador colocou no pote (sem caixa) */
export function calcSomaCompra(buyinCount: number): number {
  if (buyinCount <= 0) return 0
  return buyinCount * BUYIN_AMOUNT
}

/** Taxa de caixa: fixo R$5 por jogador por sessão */
export function calcCaixaContribution(): number {
  return CAIXA_FEE
}

/** Total desembolsado pelo jogador (pote + caixa) — só pra exibição */
export function calcTotalPago(buyinCount: number): number {
  return calcSomaCompra(buyinCount) + CAIXA_FEE
}

/**
 * Valor já pago em dinheiro pelas fichas. A taxa de caixa é cobrada junto com
 * a primeira compra, então só conta como paga quando ao menos 1 buy-in foi pago
 * (0 buy-ins pagos = nada foi pago, nem o caixa).
 */
export function calcValorPago(buyinsPagos: number, caixaFee: number = CAIXA_FEE): number {
  if (buyinsPagos <= 0) return 0
  return calcSomaCompra(buyinsPagos) + caixaFee
}

/** Quanto ainda falta pagar (pote + caixa) considerando as fichas já pagas */
export function calcFaltaPagar(buyinCount: number, buyinsPagos: number, caixaFee: number = CAIXA_FEE): number {
  return calcTotalPago(buyinCount) - calcValorPago(buyinsPagos, caixaFee)
}

/**
 * Acerto final em dinheiro: quanto falta pagar pelas fichas ainda não pagas
 * (pote + caixa) é descontado do que o jogador tem a receber. Positivo = a
 * banca deve pagar ao jogador; negativo = o jogador ainda deve à banca.
 */
export function calcAcertoFinal(buyinCount: number, somaGanho: number, buyinsPagos: number, caixaFee: number = CAIXA_FEE): number {
  return somaGanho - calcFaltaPagar(buyinCount, buyinsPagos, caixaFee)
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
