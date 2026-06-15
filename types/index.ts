export interface Player {
  id: string
  name: string
  created_at: string
}

export interface Session {
  id: string
  date: string
  notes: string | null
  is_closed: boolean
  status: 'pending' | 'active' | 'closed'
  created_at: string
}

export interface SessionPlayer {
  id: string
  session_id: string
  player_id: string
  buyin_count: number
  soma_compra: number
  soma_ganho: number
  caixa_contribution: number
  created_at: string
  players?: Player
  sessions?: Session
}

export interface Caixa {
  id: string
  session_id: string
  amount: number
  description: string | null
  created_at: string
}

export interface CaixaSaida {
  id: string
  description: string
  amount: number
  date: string
  created_at: string
}

export interface RankingRow {
  player_id: string
  name: string
  participacoes: number
  soma_compra: number
  soma_ganho: number
  soma_saldo: number
  media_compra: number
  media_ganho: number
}

export interface EvolucaoData {
  data: Record<string, number | string>[]
  players: string[]
}

export interface QuadraMes {
  id: string
  month: string   // ISO date, first day of month
  rank: string    // 'A', 'K', 'Q', 'J', '10', '9' ... '2'
  prize_amount: number
  description: string | null
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  players?: Player
}

export interface SessionWithPlayers extends Session {
  session_players: (SessionPlayer & { players: Player })[]
}
