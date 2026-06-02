'use client'

import { useState, useMemo } from 'react'
import { useTrades } from '@/context/TradesContext'
import { calcMetrics } from '@/lib/metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Header from '@/components/layout/Header'
import TradeFilters from '@/components/journal/TradeFilters'
import TradeTable from '@/components/journal/TradeTable'
import AddTradeModal from '@/components/journal/AddTradeModal'

export default function JournalPage() {
  const { trades, loading } = useTrades()
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ search: '', direction: 'All', result: 'All', symbol: '' })

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filters.search && !t.symbol.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.symbol && t.symbol !== filters.symbol) return false
      if (filters.direction !== 'All' && t.direction !== filters.direction) return false
      if (filters.result === 'Win' && t.netPnL <= 0) return false
      if (filters.result === 'Loss' && t.netPnL >= 0) return false
      if (filters.result === 'BE' && t.netPnL !== 0) return false
      return true
    })
  }, [trades, filters])

  const metrics = calcMetrics(filtered)

  return (
    <div>
      <Header title="Journal" breadcrumb="Trading" />
      <div className="p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trades', value: metrics.totalTrades.toString() },
            { label: 'Net P&L', value: formatCurrency(metrics.netPnL), color: metrics.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]' },
            { label: 'Win Rate', value: formatPercent(metrics.winRate) },
            { label: 'Avg P&L', value: formatCurrency(metrics.netPnL / (metrics.totalTrades || 1)) },
          ].map(c => (
            <div key={c.label} className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-[#71717a] text-xs mb-1">{c.label}</p>
              <p className={`text-xl font-bold ${c.color || 'text-white'}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <TradeFilters filters={filters} onChange={setFilters} onAddTrade={() => setShowModal(true)} />

        {loading ? (
          <div className="text-center py-12 text-[#71717a]">Loading...</div>
        ) : (
          <TradeTable trades={filtered} />
        )}
      </div>

      <AddTradeModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
