'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Metrics } from '@/lib/metrics'

interface Props {
  metrics: Metrics
}

export default function WinLossDonut({ metrics }: Props) {
  const data = [
    { name: 'Win', value: metrics.totalWins, color: '#22c55e' },
    { name: 'Loss', value: metrics.totalLosses, color: '#ef4444' },
    { name: 'BE', value: metrics.breakEven, color: '#a1a1aa' },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">Win / Loss</p>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[#a1a1aa] text-sm">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-white text-sm font-semibold">{d.value}</span>
                <span className="text-[#71717a] text-xs ml-1">
                  ({metrics.totalTrades > 0 ? ((d.value / metrics.totalTrades) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
