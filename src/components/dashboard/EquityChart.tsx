'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { EquityPoint } from '@/lib/metrics'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: EquityPoint[]
}

export default function EquityChart({ data }: Props) {
  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">Equity Curve</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(v: unknown) => [formatCurrency(Number(v)), 'Equity']}
          />
          <Area type="monotone" dataKey="equity" stroke="#7c3aed" strokeWidth={2} fill="url(#equityGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
