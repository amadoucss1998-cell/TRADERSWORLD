import type { Trade } from '@/lib/trades'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  trades: Trade[]
}

export default function RecentTrades({ trades }: Props) {
  const recent = trades.slice(0, 5)

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">Recent Trades</p>
      <div className="space-y-2">
        {recent.map(t => (
          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[#2a2a2a] last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm w-12">{t.symbol}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                t.direction === 'LONG'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'bg-[#ef4444]/10 text-[#ef4444]'
              }`}>
                {t.direction}
              </span>
              <span className="text-[#71717a] text-xs hidden sm:block">{formatDate(t.date)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#a1a1aa] text-xs">${t.entryPrice} → ${t.exitPrice}</span>
              <span className={`text-sm font-semibold ${t.netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {formatCurrency(t.netPnL)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
