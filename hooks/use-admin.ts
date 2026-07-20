'use client'

import { useState, useEffect } from 'react'
import { getIsAdmin, setAdmin, onAdminChange } from '@/lib/admin'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(getIsAdmin())
    const unsub = onAdminChange((v) => setIsAdmin(v))
    return unsub
  }, [])

  async function login(password: string): Promise<boolean> {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAdmin(true)
      return true
    }
    return false
  }

  function logout() {
    setAdmin(false)
    fetch('/api/auth', { method: 'DELETE' })
  }

  return { isAdmin, login, logout }
}
