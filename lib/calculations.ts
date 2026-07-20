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
 * Acerto final em dinheiro: quanto falta pagar pelas fichas ainda não pagas
 * é descontado do que o jogador tem a receber. Positivo = a banca deve pagar
 * ao jogador; negativo = o jogador ainda deve à banca.
 */
export function calcAcertoFinal(somaCompra: number, somaGanho: number, buyinsPagos: number): number {
  const saldo = somaGanho - somaCompra
  return saldo + calcSomaCompra(buyinsPagos)
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
