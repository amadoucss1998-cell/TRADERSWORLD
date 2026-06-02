'use client'

import { Search, Download, Plus, X } from 'lucide-react'

interface Filters {
  search: string
  direction: string
  result: string
  symbol: string
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  onAddTrade: () => void
}

export default function TradeFilters({ filters, onChange, onAddTrade }: Props) {
  function set(key: keyof Filters, val: string) {
    onChange({ ...filters, [key]: val })
  }

  function reset() {
    onChange({ search: '', direction: 'All', result: 'All', symbol: '' })
  }

  const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'AMD', 'MSFT', 'META']

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
        <input
          className="bg-[#181818] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] w-48"
          placeholder="Search trades..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
        />
      </div>

      <select
        className="bg-[#181818] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
        value={filters.symbol}
        onChange={e => set('symbol', e.target.value)}
      >
        <option value="">All Symbols</option>
        {symbols.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        className="bg-[#181818] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
        value={filters.direction}
        onChange={e => set('direction', e.target.value)}
      >
        {['All', 'LONG', 'SHORT'].map(d => <option key={d}>{d}</option>)}
      </select>

      <select
        className="bg-[#181818] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
        value={filters.result}
        onChange={e => set('result', e.target.value)}
      >
        {['All', 'Win', 'Loss', 'BE'].map(r => <option key={r}>{r}</option>)}
      </select>

      <button
        onClick={reset}
        className="flex items-center gap-1 text-[#71717a] hover:text-white text-sm transition-colors"
      >
        <X className="w-3.5 h-3.5" /> Reset
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button className="flex items-center gap-2 border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#a1a1aa] hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button
          onClick={onAddTrade}
          className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Trade
        </button>
      </div>
    </div>
  )
}
