'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import type { DailyPnL } from '@/lib/metrics'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: DailyPnL[]
}

export default function DailyPnLChart({ data }: Props) {
  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">P&amp;L by Day of Week</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8 }}
            formatter={(v: unknown) => [formatCurrency(Number(v)), 'P&L']}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
