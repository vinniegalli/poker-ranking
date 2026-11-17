'use client'

import { useEffect, useState } from 'react'
import { Season } from '@/types'

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loaded, setLoaded] = useState(false)

  async function reload() {
    try {
      const res = await fetch('/api/seasons', { cache: 'no-store' })
      const data = await res.json()
      setSeasons(Array.isArray(data) ? data : [])
    } catch {
      setSeasons([])
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => { reload() }, [])

  return { seasons, loaded, reload }
}
