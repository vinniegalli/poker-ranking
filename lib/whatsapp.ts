/** Normaliza um telefone brasileiro para o formato do wa.me (só dígitos, com 55) */
export function normalizeWhatsapp(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  // 10/11 dígitos = DDD + número sem código do país
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

/** Link wa.me com mensagem pronta; '' se não houver número configurado */
export function whatsappLink(phone: string | null | undefined, text: string): string {
  const n = normalizeWhatsapp(phone)
  if (!n) return ''
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}
