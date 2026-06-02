'use client'

import { useState } from 'react'
import type { CalendarDay } from '@/lib/metrics'
import { formatCurrency } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  data: CalendarDay[]
}

export default function PnLCalendar({ data }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const map: Record<string, CalendarDay> = {}
  for (const d of data) map[d.date] = d

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const allValues = data.map(d => Math.abs(d.pnl))
  const maxAbs = Math.max(...allValues, 1)

  function getStyle(pnl: number) {
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1)
    if (pnl > 0) return { background: `rgba(34,197,94,${0.1 + intensity * 0.6})` }
    if (pnl < 0) return { background: `rgba(239,68,68,${0.1 + intensity * 0.6})` }
    return {}
  }

  const cells: (null | { day: number; date: string })[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push({ day: d, date: `${year}-${mm}-${dd}` })
  }

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em]">P&amp;L Calendar</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-1 rounded text-[#71717a] hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-sm font-medium w-32 text-center">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-1 rounded text-[#71717a] hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[#71717a] text-xs py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />
          const day = map[cell.date]
          return (
            <div
              key={cell.date}
              className="aspect-square rounded-lg p-1 flex flex-col items-center justify-center text-center border border-[#2a2a2a]/50"
              style={day ? getStyle(day.pnl) : {}}
            >
              <span className="text-[#a1a1aa] text-xs">{cell.day}</span>
              {day && (
                <span className={`text-[9px] font-semibold mt-0.5 ${day.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {day.pnl >= 0 ? '+' : ''}{Math.round(day.pnl)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
