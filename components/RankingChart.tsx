'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { EvolucaoData } from '@/types'
import { formatBRL } from '@/lib/calculations'

const PLAYER_COLORS = [
  '#C9A84C', // gold
  '#60A5FA', // blue
  '#F472B6', // pink
  '#34D399', // green
  '#A78BFA', // purple
  '#FB923C', // orange
  '#22D3EE', // cyan
  '#FBBF24', // amber
]

interface RankingChartProps {
  year?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="text-muted-foreground text-xs mb-2 font-medium">{label}</p>
      {[...payload]
        .sort((a, b) => b.value - a.value)
        .map((p: { name: string; value: number; color: string }) => (
          <div key={p.name} className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-foreground/80">{p.name}</span>
            </div>
            <span
              className={`font-mono-numbers ml-4 ${p.value > 0 ? 'positive' : p.value < 0 ? 'negative' : 'text-muted-foreground'}`}
            >
              {formatBRL(p.value)}
            </span>
          </div>
        ))}
    </div>
  )
}

export function RankingChart({ year }: RankingChartProps) {
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvolucao() {
      setLoading(true)
      const url = year ? `/api/ranking/evolucao?year=${year}` : '/api/ranking/evolucao'
      const res = await fetch(url)
      const data = await res.json()
      setEvolucao(data)
      setLoading(false)
    }
    fetchEvolucao()
  }, [year])

  if (loading) {
    return (
      <div className="rounded-lg card-border bg-card p-6 h-64 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Carregando gráfico...</span>
      </div>
    )
  }

  if (!evolucao || evolucao.data.length < 2) {
    return (
      <div className="rounded-lg card-border bg-card p-6 h-40 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Dados insuficientes para o gráfico.</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg card-border bg-card p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-5">
        Evolução por sessão
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={evolucao.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(240 6% 17%)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(252 8% 45%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `R$${v}`}
            tick={{ fill: 'hsl(252 8% 45%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(240 6% 25%)" strokeDasharray="4 4" />
          {evolucao.players.map((player, i) => (
            <Line
              key={player}
              type="monotone"
              dataKey={player}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
        {evolucao.players.map((player, i) => (
          <div key={player} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full inline-block"
              style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground">{player}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
