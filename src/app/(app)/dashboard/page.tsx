'use client'

import { useTrades } from '@/context/TradesContext'
import { calcMetrics, calcEquityCurve, calcDailyPnL, calcSymbolStats } from '@/lib/metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Header from '@/components/layout/Header'
import MetricCard from '@/components/dashboard/MetricCard'
import EquityChart from '@/components/dashboard/EquityChart'
import WinLossDonut from '@/components/dashboard/WinLossDonut'
import DailyPnLChart from '@/components/dashboard/DailyPnLChart'
import TradingHoursHeatmap from '@/components/dashboard/TradingHoursHeatmap'
import SymbolStats from '@/components/dashboard/SymbolStats'
import RecentTrades from '@/components/dashboard/RecentTrades'

export default function DashboardPage() {
  const { trades, loading } = useTrades()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#71717a]">Loading...</div>
      </div>
    )
  }

  const metrics = calcMetrics(trades)
  const equity = calcEquityCurve(trades)
  const daily = calcDailyPnL(trades)
  const symbols = calcSymbolStats(trades)

  const cards = [
    {
      label: 'Net P&L',
      value: formatCurrency(metrics.netPnL),
      color: metrics.netPnL >= 0 ? 'green' as const : 'red' as const,
    },
    { label: 'Win Rate', value: formatPercent(metrics.winRate) },
    { label: 'Profit Factor', value: metrics.profitFactor.toFixed(2) },
    { label: 'Total Trades', value: metrics.totalTrades.toString() },
    { label: 'Avg Win', value: formatCurrency(metrics.avgWin), color: 'green' as const },
    { label: 'Avg Loss', value: formatCurrency(metrics.avgLoss), color: 'red' as const },
    { label: 'Avg R:R', value: metrics.avgRR.toFixed(2) },
    { label: 'Max Drawdown', value: formatCurrency(metrics.maxDrawdown), color: 'red' as const },
  ]

  return (
    <div>
      <Header title="Dashboard" breadcrumb="Overview" />
      <div className="p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {cards.map(c => (
            <div key={c.label} className="col-span-1">
              <MetricCard label={c.label} value={c.value} color={c.color} />
            </div>
          ))}
        </div>

        {/* Equity + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <EquityChart data={equity} />
          </div>
          <div className="lg:col-span-2">
            <WinLossDonut metrics={metrics} />
          </div>
        </div>

        {/* Daily P&L + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyPnLChart data={daily} />
          <TradingHoursHeatmap trades={trades} />
        </div>

        {/* Symbol stats */}
        <SymbolStats data={symbols} />

        {/* Recent trades */}
        <RecentTrades trades={trades} />
      </div>
    </div>
  )
}
