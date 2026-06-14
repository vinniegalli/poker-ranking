export const FIRST_BUYIN = 25
export const ADDON_BUYIN = 20
export const CAIXA_FEE = 5

export function calcSomaCompra(buyinCount: number): number {
  if (buyinCount <= 0) return 0
  return FIRST_BUYIN + (buyinCount - 1) * ADDON_BUYIN
}

export function calcCaixaContribution(): number {
  return CAIXA_FEE
}

export function calcSomaSaldo(somaGanho: number, somaCompra: number): number {
  return somaGanho - somaCompra
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
