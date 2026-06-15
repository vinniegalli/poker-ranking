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

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
