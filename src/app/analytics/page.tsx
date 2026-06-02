"use client";

import { useMemo, useState } from "react";
import { useTrades } from "@/context/TradesContext";
import {
  computeMetrics,
  buildEquityCurve,
  buildSymbolStats,
  buildCalendarData,
} from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { PnLCalendar } from "@/components/dashboard/PnLCalendar";
import { WinLossDonut, SymbolPnLChart, DailyPnLChart } from "@/components/charts/WinLossChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

type Tab = "overview" | "symbols" | "calendar" | "distributions";

export default function AnalyticsPage() {
  const { trades } = useTrades();
  const [tab, setTab] = useState<Tab>("overview");

  const metrics = useMemo(() => computeMetrics(trades), [trades]);
  const equityCurve = useMemo(() => buildEquityCurve(trades), [trades]);
  const symbolStats = useMemo(() => buildSymbolStats(trades), [trades]);
  const calendarData = useMemo(() => buildCalendarData(trades), [trades]);

  // Setup performance
  const setupStats = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number }> = {};
    for (const t of trades) {
      const setup = t.setup || "Unknown";
      if (!map[setup]) map[setup] = { pnl: 0, count: 0, wins: 0 };
      map[setup].pnl += t.pnl;
      map[setup].count += 1;
      if (t.status === "WIN") map[setup].wins += 1;
    }
    return Object.entries(map)
      .map(([setup, d]) => ({
        setup,
        pnl: d.pnl,
        count: d.count,
        winRate: Math.round((d.wins / d.count) * 100),
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // Hour distribution
  const hourStats = useMemo(() => {
    const map: Record<number, { pnl: number; count: number }> = {};
    for (let h = 9; h <= 16; h++) map[h] = { pnl: 0, count: 0 };
    for (const t of trades) {
      const h = new Date(t.entryDate).getHours();
      if (!map[h]) map[h] = { pnl: 0, count: 0 };
      map[h].pnl += t.pnl;
      map[h].count += 1;
    }
    return Object.entries(map)
      .filter(([, v]) => v.count > 0)
      .map(([hour, v]) => ({
        hour: `${hour}:00`,
        pnl: v.pnl,
        count: v.count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [trades]);

  // Scatter data (entry price vs pnl)
  const scatterData = useMemo(
    () =>
      trades.slice(-50).map((t) => ({
        x: t.quantity,
        y: t.pnl,
        symbol: t.symbol,
      })),
    [trades]
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "symbols", label: "Symbols" },
    { id: "calendar", label: "Calendar" },
    { id: "distributions", label: "Distributions" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Analytics" subtitle="Deep dive into your trading performance" />

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Tab Nav */}
        <div
          className="flex gap-1 p-1 rounded-2xl w-fit"
          style={{ background: "#141420", border: "1px solid #1e1e30" }}
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                tab === id
                  ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                  : { color: "#6b7280" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Trades", value: metrics.totalTrades },
                { label: "Win Rate", value: `${metrics.winRate.toFixed(1)}%` },
                { label: "Avg Win", value: formatCurrency(metrics.avgWin) },
                { label: "Avg Loss", value: `-${formatCurrency(metrics.avgLoss)}` },
                { label: "Best Trade", value: formatCurrency(metrics.bestTrade), green: true },
                { label: "Worst Trade", value: formatCurrency(metrics.worstTrade), red: true },
                { label: "Avg Hold (min)", value: Math.round(metrics.avgHoldTime) + "m" },
                { label: "Total Commission", value: formatCurrency(metrics.totalCommissions), red: true },
              ].map(({ label, value, green, red }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{ background: "#141420", border: "1px solid #1e1e30" }}
                >
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>{label}</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: green ? "#22c55e" : red ? "#ef4444" : "#fff" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <EquityChart data={equityCurve} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DailyPnLChart trades={trades} />
              <WinLossDonut
                winCount={metrics.winCount}
                lossCount={metrics.lossCount}
                breakevenCount={metrics.totalTrades - metrics.winCount - metrics.lossCount}
              />
            </div>

            {/* Long vs Short */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Long vs Short</h3>
                <div className="space-y-3">
                  {[
                    { label: "Long Trades", count: metrics.longsCount, winRate: metrics.longWinRate, color: "#22c55e" },
                    { label: "Short Trades", count: metrics.shortsCount, winRate: metrics.shortWinRate, color: "#ef4444" },
                  ].map(({ label, count, winRate, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">{label}</span>
                        <span className="text-sm font-bold" style={{ color }}>
                          {winRate.toFixed(1)}% win rate · {count} trades
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${winRate}%`, background: color, opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hour performance */}
              <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
                <h3 className="text-sm font-semibold text-white mb-1">Best Trading Hours</h3>
                <p className="text-xs mb-4" style={{ color: "#6b7280" }}>P&L by entry hour</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={hourStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
                      formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
                      labelStyle={{ color: "#9ca3af" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {hourStats.map((entry, index) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Symbols Tab */}
        {tab === "symbols" && (
          <div className="space-y-6">
            <SymbolPnLChart data={symbolStats} />
            <div className="rounded-2xl overflow-hidden" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e1e30" }}>
                <h3 className="text-sm font-semibold text-white">Symbol Breakdown</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e30" }}>
                    {["Symbol", "Trades", "Win Rate", "Total P&L", "Avg P&L"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {symbolStats.map((s) => (
                    <tr
                      key={s.symbol}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <td className="px-5 py-3">
                        <span className="font-bold text-white">{s.symbol}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-300">{s.tradeCount}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${s.winRate}%`,
                                background: s.winRate >= 60 ? "#22c55e" : s.winRate >= 50 ? "#eab308" : "#ef4444",
                              }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: s.winRate >= 60 ? "#22c55e" : s.winRate >= 50 ? "#eab308" : "#ef4444" }}
                          >
                            {s.winRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-sm font-bold"
                          style={{ color: s.totalPnl >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                          {s.totalPnl >= 0 ? "+" : ""}{formatCurrency(s.totalPnl)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-sm"
                          style={{ color: s.totalPnl / s.tradeCount >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                          {(s.totalPnl / s.tradeCount) >= 0 ? "+" : ""}{formatCurrency(s.totalPnl / s.tradeCount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {tab === "calendar" && (
          <div className="space-y-6">
            <PnLCalendar data={calendarData} />
            <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Monthly Summary</h3>
              <div className="space-y-2">
                {(() => {
                  const monthMap: Record<string, number> = {};
                  for (const d of calendarData) {
                    const month = d.date.slice(0, 7);
                    monthMap[month] = (monthMap[month] || 0) + d.pnl;
                  }
                  return Object.entries(monthMap)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([month, pnl]) => (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-20 flex-shrink-0">{month}</span>
                        <div className="flex-1 h-6 rounded-lg relative overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg"
                            style={{
                              width: `${Math.min(100, (Math.abs(pnl) / Math.max(...Object.values(monthMap).map(Math.abs), 1)) * 100)}%`,
                              background: pnl >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                            }}
                          />
                          <span
                            className="absolute inset-0 flex items-center px-2 text-xs font-bold"
                            style={{ color: pnl >= 0 ? "#22c55e" : "#ef4444" }}
                          >
                            {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                          </span>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Distributions Tab */}
        {tab === "distributions" && (
          <div className="space-y-6">
            {/* Setup Stats */}
            <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
              <h3 className="text-sm font-semibold text-white mb-1">Performance by Setup</h3>
              <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Which setups make you the most money</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={setupStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="setup" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} width={55} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
                    formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
                    labelStyle={{ color: "#9ca3af" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {setupStats.map((entry, index) => (
                      <Cell key={index} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* P&L Distribution */}
            <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
              <h3 className="text-sm font-semibold text-white mb-1">P&L Distribution (Scatter)</h3>
              <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Trade size vs P&L (last 50 trades)</p>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="x" name="Qty" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Quantity", fill: "#6b7280", fontSize: 11 }} />
                  <YAxis dataKey="y" name="P&L" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
                    labelStyle={{ color: "#9ca3af" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Scatter data={scatterData} fill="#6366f1">
                    {scatterData.map((entry, index) => (
                      <Cell key={index} fill={entry.y >= 0 ? "#22c55e" : "#ef4444"} opacity={0.7} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Setup table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e1e30" }}>
                <h3 className="text-sm font-semibold text-white">Setup Performance</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e30" }}>
                    {["Setup", "Trades", "Win Rate", "Total P&L"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {setupStats.map((s) => (
                    <tr key={s.setup} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td className="px-5 py-3 text-sm text-white">{s.setup}</td>
                      <td className="px-5 py-3 text-sm text-gray-300">{s.count}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-sm font-medium"
                          style={{ color: s.winRate >= 60 ? "#22c55e" : s.winRate >= 50 ? "#eab308" : "#ef4444" }}
                        >
                          {s.winRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-sm font-bold"
                          style={{ color: s.pnl >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                          {s.pnl >= 0 ? "+" : ""}{formatCurrency(s.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
