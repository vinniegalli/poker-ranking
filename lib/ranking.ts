export interface RankingSessionRow {
  player_id: string
  name: string
  date: string
  soma_compra: number
  soma_ganho: number
}

export interface AggregatedPlayer {
  player_id: string
  name: string
  participacoes: number
  soma_compra: number
  soma_ganho: number
  soma_saldo: number
  sessions: { date: string; saldo: number }[]
}

/** Agrupa linhas de session_players (uma por participação) em totais por jogador */
export function aggregateByPlayer(rows: RankingSessionRow[]): AggregatedPlayer[] {
  const map = new Map<string, AggregatedPlayer>()
  for (const row of rows) {
    if (!map.has(row.player_id)) {
      map.set(row.player_id, {
        player_id: row.player_id,
        name: row.name,
        participacoes: 0,
        soma_compra: 0,
        soma_ganho: 0,
        soma_saldo: 0,
        sessions: [],
      })
    }
    const e = map.get(row.player_id)!
    e.participacoes += 1
    e.soma_compra += row.soma_compra
    e.soma_ganho += row.soma_ganho
    e.soma_saldo = e.soma_ganho - e.soma_compra
    e.sessions.push({ date: row.date, saldo: row.soma_ganho - row.soma_compra })
  }
  return Array.from(map.values())
}

/** Ordena por saldo total, do maior pro menor — a ordem que define a posição no ranking */
export function sortBySaldo(players: AggregatedPlayer[]): AggregatedPlayer[] {
  return [...players].sort((a, b) => b.soma_saldo - a.soma_saldo)
}
