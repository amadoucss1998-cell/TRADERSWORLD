"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Trade } from "@/lib/trades";
import { SymbolStat } from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";

interface WinLossProps {
  winCount: number;
  lossCount: number;
  breakevenCount: number;
}

export function WinLossDonut({ winCount, lossCount, breakevenCount }: WinLossProps) {
  const data = [
    { name: "Wins", value: winCount, color: "#22c55e" },
    { name: "Losses", value: lossCount, color: "#ef4444" },
    ...(breakevenCount > 0 ? [{ name: "Breakeven", value: breakevenCount, color: "#6b7280" }] : []),
  ].filter((d) => d.value > 0);

  const total = winCount + lossCount + breakevenCount;
  const winRate = total > 0 ? Math.round((winCount / total) * 100) : 0;

  return (
    <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
      <h3 className="text-sm font-semibold text-white mb-1">Win/Loss Distribution</h3>
      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Trade outcome breakdown</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{winRate}%</p>
            <p className="text-xs" style={{ color: "#6b7280" }}>Win Rate</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-xs text-gray-400">{d.name} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SymbolChartProps {
  data: SymbolStat[];
}

export function SymbolPnLChart({ data }: SymbolChartProps) {
  const top = data.slice(0, 10);

  return (
    <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
      <h3 className="text-sm font-semibold text-white mb-1">P&L by Symbol</h3>
      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Best and worst performing symbols</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={top} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="symbol"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 0 ? "" : "-"}${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(1) + "k" : Math.abs(v)}`}
            width={55}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
            formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
            {top.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.totalPnl >= 0 ? "#22c55e" : "#ef4444"}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DailyPnLProps {
  trades: Trade[];
}

export function DailyPnLChart({ trades }: DailyPnLProps) {
  const dailyMap: Record<string, number> = {};
  for (const t of trades) {
    const day = t.exitDate.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + t.pnl;
  }
  const data = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, pnl]) => ({ date: date.slice(5), pnl }));

  return (
    <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
      <h3 className="text-sm font-semibold text-white mb-1">Daily P&L</h3>
      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Last 30 trading days</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 0 ? "" : "-"}${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(1) + "k" : Math.abs(v)}`}
            width={55}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
            formatter={(value) => [formatCurrency(Number(value)), "P&L"]}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"}
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
