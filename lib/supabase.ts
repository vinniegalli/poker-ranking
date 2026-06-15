import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _client = createClient(url, key, {
      // Next.js patches global fetch and caches GET requests in its Data Cache.
      // The Supabase client issues queries via fetch, so SELECTs were being
      // served stale even after writes. Force every Supabase request to bypass
      // the Next Data Cache so reads always reflect the current DB state.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    })
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  },
})
