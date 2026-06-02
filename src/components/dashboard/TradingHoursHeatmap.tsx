'use client'

import type { Trade } from '@/lib/trades'

interface Props {
  trades: Trade[]
}

const hours = [9, 10, 11, 12, 13, 14, 15]
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function TradingHoursHeatmap({ trades }: Props) {
  const map: Record<string, number> = {}
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (const t of trades) {
    const d = new Date(t.date)
    const day = dayNames[d.getDay()]
    const hour = d.getHours()
    const key = `${day}-${hour}`
    map[key] = (map[key] || 0) + t.netPnL
  }

  const allVals = Object.values(map)
  const max = Math.max(...allVals.map(Math.abs), 1)

  function getColor(val: number) {
    const intensity = Math.abs(val) / max
    if (val > 0) return `rgba(34,197,94,${0.15 + intensity * 0.7})`
    if (val < 0) return `rgba(239,68,68,${0.15 + intensity * 0.7})`
    return 'transparent'
  }

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-4">Trading Hours Heatmap</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <td className="pr-3 text-[#71717a] pb-2">Hour</td>
              {hours.map(h => (
                <td key={h} className="text-center text-[#71717a] pb-2 px-1">{h}:00</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td className="pr-3 text-[#71717a] py-1 text-xs">{day}</td>
                {hours.map(h => {
                  const val = map[`${day}-${h}`] || 0
                  return (
                    <td key={h} className="px-1 py-1">
                      <div
                        className="w-full h-8 rounded text-center text-[10px] flex items-center justify-center"
                        style={{ background: getColor(val) }}
                        title={val ? `$${val.toFixed(0)}` : '—'}
                      >
                        {val ? <span className="text-white font-medium">{val > 0 ? '+' : ''}{val.toFixed(0)}</span> : ''}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
