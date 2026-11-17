'use client'

// Cache local do estado de admin, só pra UI aparecer na hora. Quem manda de
// verdade é o cookie httpOnly validado no servidor (GET /api/auth), que dura
// 30 dias e vale para todas as abas — por isso o cache fica em localStorage
// (compartilhado entre abas) e é sempre conferido com o servidor.
const STORAGE_KEY = 'poker_admin_auth'
const ADMIN_EVENT = 'poker_admin_change'

export function getIsAdmin(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setAdmin(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (value) localStorage.setItem(STORAGE_KEY, 'true')
    else localStorage.removeItem(STORAGE_KEY)
    // limpa o formato antigo (sessionStorage)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage bloqueado: segue só com o estado em memória
  }
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: value }))
}

export function onAdminChange(cb: (isAdmin: boolean) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail)
  // Login/logout em outra aba dispara 'storage' aqui
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb(e.newValue === 'true')
  }
  window.addEventListener(ADMIN_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(ADMIN_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

let verifying: Promise<void> | null = null

/**
 * Confere com o servidor se o cookie de admin ainda é válido e atualiza o
 * cache. Roda uma vez por carregamento de página, mesmo com vários
 * componentes usando useAdmin.
 */
export function verifyAdmin(): Promise<void> {
  if (!verifying) {
    verifying = fetch('/api/auth', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.admin === 'boolean' && data.admin !== getIsAdmin()) setAdmin(data.admin)
      })
      .catch(() => {
        // offline (PWA): mantém o cache como está
      })
  }
  return verifying
}
