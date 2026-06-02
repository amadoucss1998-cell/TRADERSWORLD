'use client'

import { useState } from 'react'
import type { Trade } from '@/lib/trades'
import { calcMetrics, calcMonthlyPnL, calcCalendar, calcSymbolStats } from '@/lib/metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'
import MonthlyPnLChart from './MonthlyPnLChart'
import PnLCalendar from './PnLCalendar'
import SymbolChart from './SymbolChart'

interface Props {
  trades: Trade[]
}

const TABS = ['Overview', 'Symbols', 'Calendar', 'Distributions']

export default function AnalyticsTabs({ trades }: Props) {
  const [tab, setTab] = useState('Overview')

  const metrics = calcMetrics(trades)
  const monthly = calcMonthlyPnL(trades)
  const calendar = calcCalendar(trades)
  const symbols = calcSymbolStats(trades)

  const statsGrid = [
    { label: 'Net P&L', value: formatCurrency(metrics.netPnL), color: metrics.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
    { label: 'Win Rate', value: formatPercent(metrics.winRate) },
    { label: 'Profit Factor', value: metrics.profitFactor.toFixed(2) },
    { label: 'Total Trades', value: metrics.totalTrades.toString() },
    { label: 'Avg Win', value: formatCurrency(metrics.avgWin), color: 'text-[#22c55e]' },
    { label: 'Avg Loss', value: formatCurrency(metrics.avgLoss), color: 'text-[#ef4444]' },
    { label: 'Avg R:R', value: metrics.avgRR.toFixed(2) },
    { label: 'Max Drawdown', value: formatCurrency(metrics.maxDrawdown), color: 'text-[#ef4444]' },
    { label: 'Total Wins', value: metrics.totalWins.toString() },
    { label: 'Total Losses', value: metrics.totalLosses.toString() },
    { label: 'Gross Wins', value: formatCurrency(metrics.grossWins), color: 'text-[#22c55e]' },
    { label: 'Gross Losses', value: formatCurrency(metrics.grossLosses), color: 'text-[#ef4444]' },
  ]

  const longs = trades.filter(t => t.direction === 'LONG')
  const shorts = trades.filter(t => t.direction === 'SHORT')
  const longMetrics = calcMetrics(longs)
  const shortMetrics = calcMetrics(shorts)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#2a2a2a] mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'text-white border-[#7c3aed]'
                : 'text-[#71717a] border-transparent hover:text-[#a1a1aa]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statsGrid.map(s => (
              <div key={s.label} className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#71717a] text-xs mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Long vs Short */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Long', m: longMetrics, trades: longs, color: '#22c55e' },
              { label: 'Short', m: shortMetrics, trades: shorts, color: '#ef4444' },
            ].map(({ label, m, trades: ts, color }) => (
              <div key={label} className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <p className="text-white font-semibold">{label} Trades</p>
                  <span className="text-[#71717a] text-xs">({ts.length})</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-[#71717a] text-sm">P&L</span><span className={`text-sm font-semibold ${m.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{formatCurrency(m.netPnL)}</span></div>
                  <div className="flex justify-between"><span className="text-[#71717a] text-sm">Win Rate</span><span className="text-white text-sm">{formatPercent(m.winRate)}</span></div>
                  <div className="flex justify-between"><span className="text-[#71717a] text-sm">Profit Factor</span><span className="text-white text-sm">{m.profitFactor.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly */}
          <MonthlyPnLChart data={monthly} />
        </div>
      )}

      {tab === 'Symbols' && <SymbolChart data={symbols} />}

      {tab === 'Calendar' && <PnLCalendar data={calendar} />}

      {tab === 'Distributions' && (
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <p className="text-[#71717a]">Distributions charts coming soon</p>
        </div>
      )}
    </div>
  )
}
