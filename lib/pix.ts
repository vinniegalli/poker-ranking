// Gerador de payload Pix "copia e cola" (BR Code / EMV Merchant Presented QR do Banco Central).
// Puro e sem dependências — roda tanto no servidor quanto no cliente.

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

/** Remove acentos e caracteres fora do alfabeto aceito pelo padrão Pix, maiúsculas, corta no tamanho máximo */
function sanitizeText(str: string, maxLen: number): string {
  const noAccents = str.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const cleaned = noAccents.replace(/[^A-Za-z0-9 ]/g, '').trim().toUpperCase()
  return (cleaned || 'NA').slice(0, maxLen)
}

function sanitizeTxid(str: string, maxLen: number): string {
  const noAccents = str.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const cleaned = noAccents.replace(/[^A-Za-z0-9]/g, '')
  return (cleaned || '***').slice(0, maxLen)
}

export interface PixPayloadParams {
  key: string
  amount: number
  merchantName: string
  merchantCity: string
  txid?: string
}

export function generatePixPayload({ key, amount, merchantName, merchantCity, txid }: PixPayloadParams): string {
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', key)
  const additionalData = tlv('05', sanitizeTxid(txid ?? '***', 25))

  const body =
    tlv('00', '01') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', sanitizeText(merchantName, 25)) +
    tlv('60', sanitizeText(merchantCity, 15)) +
    tlv('62', additionalData) +
    '6304'

  return body + crc16(body)
}
