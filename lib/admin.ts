'use client'

const STORAGE_KEY = 'poker_admin_auth'
const ADMIN_EVENT = 'poker_admin_change'

export function getIsAdmin(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

export function setAdmin(value: boolean): void {
  if (typeof window === 'undefined') return
  if (value) {
    sessionStorage.setItem(STORAGE_KEY, 'true')
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: value }))
}

export function onAdminChange(cb: (isAdmin: boolean) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail)
  window.addEventListener(ADMIN_EVENT, handler)
  return () => window.removeEventListener(ADMIN_EVENT, handler)
}
