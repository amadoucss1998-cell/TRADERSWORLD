"use client";

import { useMemo } from "react";
import { CalendarDay } from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: CalendarDay[];
}

function getWeeksOfMonth(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(firstDay.getDay()).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function PnLCalendar({ data }: Props) {
  const dataMap = useMemo(() => {
    const m: Record<string, CalendarDay> = {};
    data.forEach((d) => (m[d.date] = d));
    return m;
  }, [data]);

  // Get last 3 months
  const today = new Date();
  const months = [
    { year: today.getFullYear(), month: today.getMonth() - 2 < 0 ? today.getMonth() - 2 + 12 : today.getMonth() - 2, yearAdj: today.getMonth() - 2 < 0 ? -1 : 0 },
    { year: today.getFullYear(), month: today.getMonth() - 1 < 0 ? today.getMonth() - 1 + 12 : today.getMonth() - 1, yearAdj: today.getMonth() - 1 < 0 ? -1 : 0 },
    { year: today.getFullYear(), month: today.getMonth(), yearAdj: 0 },
  ].map((m) => ({ year: m.year + m.yearAdj, month: m.month }));

  // Find max abs pnl for color scaling
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);

  function getDayColor(day: CalendarDay | undefined): string {
    if (!day) return "transparent";
    const intensity = Math.min(Math.abs(day.pnl) / maxAbs, 1);
    if (day.pnl > 0) {
      const alpha = 0.15 + intensity * 0.7;
      return `rgba(34,197,94,${alpha})`;
    } else if (day.pnl < 0) {
      const alpha = 0.15 + intensity * 0.7;
      return `rgba(239,68,68,${alpha})`;
    }
    return "rgba(255,255,255,0.05)";
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
      <h3 className="text-sm font-semibold text-white mb-1">P&L Calendar</h3>
      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Daily profit/loss heatmap</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map(({ year, month }) => {
          const weeks = getWeeksOfMonth(year, month);
          const monthPnl = data
            .filter((d) => {
              const [y, m] = d.date.split("-").map(Number);
              return y === year && m === month + 1;
            })
            .reduce((s, d) => s + d.pnl, 0);

          return (
            <div key={`${year}-${month}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300">
                  {MONTH_NAMES[month]} {year}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: monthPnl >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {monthPnl >= 0 ? "+" : ""}{formatCurrency(monthPnl, 0)}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-gray-600 text-[10px] font-medium py-0.5">
                    {d}
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-0.5">
                    {week.map((date, di) => {
                      if (!date) return <div key={di} className="aspect-square" />;
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      const dayData = dataMap[dateStr];
                      return (
                        <div
                          key={di}
                          className="aspect-square rounded-sm flex items-center justify-center cursor-default relative group"
                          style={{
                            background: getDayColor(dayData),
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                          title={dayData ? `${dateStr}: ${formatCurrency(dayData.pnl)} (${dayData.tradeCount} trades)` : dateStr}
                        >
                          <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[10px]" style={{ color: "#6b7280" }}>Loss</span>
        {[0.8, 0.5, 0.2].map((a) => (
          <div key={a} className="w-3 h-3 rounded-sm" style={{ background: `rgba(239,68,68,${a})` }} />
        ))}
        <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
        {[0.2, 0.5, 0.8].map((a) => (
          <div key={a} className="w-3 h-3 rounded-sm" style={{ background: `rgba(34,197,94,${a})` }} />
        ))}
        <span className="text-[10px]" style={{ color: "#6b7280" }}>Win</span>
      </div>
    </div>
  );
}
