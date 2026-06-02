import type { SymbolStat } from '@/lib/metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Props {
  data: SymbolStat[]
}

export default function SymbolStats({ data }: Props) {
  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">Symbol Performance</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {['Symbol', 'Trades', 'Win Rate', 'Avg P&L', 'Total P&L', 'Avg Hold'].map(h => (
                <th key={h} className="text-left text-[#71717a] text-xs font-medium pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.symbol} className={i % 2 === 0 ? '' : 'bg-[#181818]'}>
                <td className="py-2.5 pr-4 text-white font-semibold">{row.symbol}</td>
                <td className="py-2.5 pr-4 text-[#a1a1aa]">{row.trades}</td>
                <td className="py-2.5 pr-4 text-[#a1a1aa]">{formatPercent(row.winRate)}</td>
                <td className={`py-2.5 pr-4 font-medium ${row.avgPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(row.avgPnL)}
                </td>
                <td className={`py-2.5 pr-4 font-medium ${row.totalPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(row.totalPnL)}
                </td>
                <td className="py-2.5 text-[#a1a1aa]">{Math.round(row.avgHoldTime)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
