"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EquityPoint } from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: EquityPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: EquityPoint }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{ background: "#1a1a2e", border: "1px solid #2a2a4e" }}
    >
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold">{formatCurrency(point.equity)}</p>
      <p style={{ color: point.pnl >= 0 ? "#22c55e" : "#ef4444" }} className="font-medium">
        {point.pnl >= 0 ? "+" : ""}{formatCurrency(point.pnl)} trade P&L
      </p>
    </div>
  );
}

export function EquityChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-64 text-gray-600">No data</div>
  );

  const isPositive = data[data.length - 1]?.cumPnl >= 0;
  const gradientId = "equityGradient";

  return (
    <div className="rounded-2xl p-5" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Account performance over time</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "#6b7280" }}>Net P&L</p>
          <p
            className="text-lg font-bold"
            style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
          >
            {isPositive ? "+" : ""}{formatCurrency(data[data.length - 1]?.cumPnl || 0)}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.2} />
              <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: isPositive ? "#22c55e" : "#ef4444", stroke: "#141420", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
