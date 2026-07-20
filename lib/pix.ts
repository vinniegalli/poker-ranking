// Injeta um valor num código Pix "copia e cola" estático (BR Code / EMV do Banco Central)
// já validado pelo banco do usuário, em vez de gerar um payload do zero — assim aproveitamos
// a chave/nome/cidade exatamente como o banco já formatou e valida.

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, sem reflect, sem XOR final) — padrão exigido pelo Pix.
function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

interface PixField {
  id: string
  value: string
}

function parseFields(code: string): PixField[] {
  const fields: PixField[] = []
  let i = 0
  while (i < code.length) {
    const id = code.slice(i, i + 2)
    if (id === '63') break // campo do CRC — para aqui, ele é sempre recalculado
    const len = parseInt(code.slice(i + 2, i + 4), 10)
    const value = code.slice(i + 4, i + 4 + len)
    fields.push({ id, value })
    i += 4 + len
  }
  return fields
}

/**
 * Recebe o código Pix estático do banco (sem valor fixo) e devolve uma cópia
 * com o campo de valor (54) inserido/atualizado e o CRC recalculado. Todos os
 * outros campos (chave, nome, cidade, etc.) são preservados como vieram do banco.
 */
export function injectPixAmount(staticCode: string, amount: number): string {
  const fields = parseFields(staticCode).filter((f) => f.id !== '54')

  const currencyIndex = fields.findIndex((f) => f.id === '53')
  const insertAt = currencyIndex === -1 ? fields.length : currencyIndex + 1
  fields.splice(insertAt, 0, { id: '54', value: amount.toFixed(2) })

  const body = fields.map((f) => tlv(f.id, f.value)).join('') + '6304'
  return body + crc16(body)
}
