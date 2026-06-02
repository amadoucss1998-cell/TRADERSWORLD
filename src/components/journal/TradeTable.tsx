'use client'

import { useState } from 'react'
import type { Trade } from '@/lib/trades'
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  trades: Trade[]
}

const PAGE_SIZE = 20

export default function TradeTable({ trades }: Props) {
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: keyof Trade; dir: 1 | -1 }>({ key: 'date', dir: -1 })

  const sorted = [...trades].sort((a, b) => {
    const av = a[sort.key]
    const bv = b[sort.key]
    if (av === undefined || bv === undefined) return 0
    if (av < bv) return -sort.dir
    if (av > bv) return sort.dir
    return 0
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: keyof Trade) {
    setSort(s => s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 })
    setPage(0)
  }

  const cols: { label: string; key?: keyof Trade }[] = [
    { label: 'Date/Time', key: 'date' },
    { label: 'Symbol', key: 'symbol' },
    { label: 'Side' },
    { label: 'Qty', key: 'quantity' },
    { label: 'Entry', key: 'entryPrice' },
    { label: 'Exit', key: 'exitPrice' },
    { label: 'P&L ($)', key: 'netPnL' },
    { label: 'P&L (%)' },
    { label: 'Hold Time', key: 'holdTime' },
    { label: 'Setup' },
  ]

  return (
    <div>
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {cols.map(c => (
                  <th
                    key={c.label}
                    className="text-left text-[#71717a] text-xs font-medium px-4 py-3 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    onClick={() => c.key && toggleSort(c.key)}
                  >
                    {c.label}
                    {c.key === sort.key && (sort.dir === 1 ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => {
                const pnlPct = ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100 * (t.direction === 'SHORT' ? -1 : 1)
                return (
                  <tr key={t.id} className={`border-b border-[#2a2a2a] last:border-0 ${i % 2 === 1 ? 'bg-[#0d0d0d]/30' : ''}`}>
                    <td className="px-4 py-3 text-[#a1a1aa] whitespace-nowrap">{formatDateTime(t.date)}</td>
                    <td className="px-4 py-3 text-white font-semibold">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        t.direction === 'LONG' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'
                      }`}>{t.direction}</span>
                    </td>
                    <td className="px-4 py-3 text-[#a1a1aa]">{t.quantity}</td>
                    <td className="px-4 py-3 text-[#a1a1aa]">${t.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#a1a1aa]">${t.exitPrice.toFixed(2)}</td>
                    <td className={`px-4 py-3 font-semibold ${t.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {formatCurrency(t.netPnL)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${pnlPct >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {formatPercent(pnlPct)}
                    </td>
                    <td className="px-4 py-3 text-[#a1a1aa]">{t.holdTime}m</td>
                    <td className="px-4 py-3 text-[#a1a1aa]">{t.setup}</td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[#71717a]">No trades found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[#71717a] text-sm">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-[#2a2a2a] text-[#a1a1aa] hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[#a1a1aa] text-sm">{page + 1} / {totalPages}</span>
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-[#2a2a2a] text-[#a1a1aa] hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
