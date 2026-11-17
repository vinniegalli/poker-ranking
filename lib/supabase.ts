import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Cliente Supabase usado SÓ no servidor (rotas /api). Usa a service_role key,
 * que ignora RLS — por isso o banco pode ficar fechado para a anon key e a
 * autorização de admin continua sendo feita nas rotas (requireAdmin).
 *
 * A key NUNCA pode ir para o browser: a env var não tem prefixo NEXT_PUBLIC_.
 * Enquanto SUPABASE_SERVICE_ROLE_KEY não estiver configurada, cai para a anon
 * key (comportamento antigo) para não derrubar produção durante a migração.
 */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('lib/supabase só pode ser usado no servidor')
  }
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    if (!serviceKey) {
      console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY ausente — usando anon key (inseguro)')
    }
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
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
