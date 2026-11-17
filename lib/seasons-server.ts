import { supabase } from '@/lib/supabase'
import { Season } from '@/types'

/**
 * Lista as temporadas. Se a tabela ainda não existir (migração 01 não rodada)
 * ou o acesso falhar, devolve [] — o app segue funcionando com valores padrão.
 */
export async function listSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) {
    console.warn('[seasons] não foi possível ler temporadas:', error.message)
    return []
  }
  return (data ?? []).map((s) => ({
    ...s,
    buyin_amount: Number(s.buyin_amount),
    rebuy_amount: Number(s.rebuy_amount),
    caixa_fee: Number(s.caixa_fee),
  })) as Season[]
}
