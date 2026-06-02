'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import type { SymbolStat } from '@/lib/metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Props {
  data: SymbolStat[]
}

export default function SymbolChart({ data }: Props) {
  const top = data.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
        <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">P&amp;L by Symbol</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="symbol" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8 }}
              formatter={(v: unknown) => [formatCurrency(Number(v)), 'Total P&L']}
            />
            <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.totalPnL >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {['Symbol', 'Trades', 'Win Rate', 'Avg P&L', 'Total P&L'].map(h => (
                <th key={h} className="text-left text-[#71717a] text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr key={row.symbol} className={`border-b border-[#2a2a2a] last:border-0 ${i % 2 === 1 ? 'bg-[#0d0d0d]/30' : ''}`}>
                <td className="px-4 py-3 text-white font-semibold">{row.symbol}</td>
                <td className="px-4 py-3 text-[#a1a1aa]">{row.trades}</td>
                <td className="px-4 py-3 text-[#a1a1aa]">{formatPercent(row.winRate)}</td>
                <td className={`px-4 py-3 font-medium ${row.avgPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(row.avgPnL)}
                </td>
                <td className={`px-4 py-3 font-medium ${row.totalPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(row.totalPnL)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
