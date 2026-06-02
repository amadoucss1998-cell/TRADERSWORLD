"use client";

import { useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  BarChart2,
  Zap,
  Award,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useTrades } from "@/context/TradesContext";
import { computeMetrics, buildEquityCurve, buildCalendarData, buildSymbolStats } from "@/lib/metrics";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { PnLCalendar } from "@/components/dashboard/PnLCalendar";
import { WinLossDonut, DailyPnLChart } from "@/components/charts/WinLossChart";

export default function DashboardPage() {
  const { trades } = useTrades();

  const metrics = useMemo(() => computeMetrics(trades), [trades]);
  const equityCurve = useMemo(() => buildEquityCurve(trades), [trades]);
  const calendarData = useMemo(() => buildCalendarData(trades), [trades]);

  const recentTrades = useMemo(
    () =>
      [...trades]
        .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
        .slice(0, 5),
    [trades]
  );

  const todayPnl = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trades
      .filter((t) => t.exitDate.slice(0, 10) === today)
      .reduce((s, t) => s + t.pnl, 0);
  }, [trades]);

  const isPositive = metrics.totalPnl >= 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Dashboard"
        subtitle={`${metrics.totalTrades} trades tracked • ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
      />

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Streak Banner */}
        {metrics.currentStreak >= 3 && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background:
                metrics.streakType === "WIN"
                  ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.06))"
                  : "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))",
              border: `1px solid ${metrics.streakType === "WIN" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: metrics.streakType === "WIN" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              }}
            >
              <Zap size={20} style={{ color: metrics.streakType === "WIN" ? "#22c55e" : "#ef4444" }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                {metrics.currentStreak}-Trade {metrics.streakType === "WIN" ? "Win" : "Loss"} Streak!
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                {metrics.streakType === "WIN"
                  ? "You're on fire. Keep following your plan."
                  : "Stay disciplined. Reduce size and focus on quality setups."}
              </p>
            </div>
          </div>
        )}

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total P&L"
            value={formatCurrency(metrics.totalPnl)}
            subtitle={isPositive ? "All time profit" : "All time loss"}
            icon={DollarSign}
            trend={isPositive ? "up" : "down"}
            accent={isPositive ? "green" : "red"}
            large
          />
          <MetricCard
            title="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            subtitle={`${metrics.winCount}W / ${metrics.lossCount}L`}
            icon={Target}
            accent="purple"
            trend={metrics.winRate >= 50 ? "up" : "down"}
          />
          <MetricCard
            title="Profit Factor"
            value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
            subtitle={metrics.profitFactor >= 1.5 ? "Excellent" : metrics.profitFactor >= 1 ? "Positive" : "Negative"}
            icon={BarChart2}
            accent={metrics.profitFactor >= 1.5 ? "green" : metrics.profitFactor >= 1 ? "yellow" : "red"}
            trend={metrics.profitFactor >= 1 ? "up" : "down"}
          />
          <MetricCard
            title="Sharpe Ratio"
            value={metrics.sharpeRatio.toFixed(2)}
            subtitle={metrics.sharpeRatio >= 2 ? "Excellent" : metrics.sharpeRatio >= 1 ? "Good" : "Below avg"}
            icon={Activity}
            accent={metrics.sharpeRatio >= 1 ? "blue" : "yellow"}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Avg Win"
            value={formatCurrency(metrics.avgWin)}
            subtitle="Per winning trade"
            icon={TrendingUp}
            accent="green"
          />
          <MetricCard
            title="Avg Loss"
            value={formatCurrency(metrics.avgLoss)}
            subtitle="Per losing trade"
            icon={AlertTriangle}
            accent="red"
          />
          <MetricCard
            title="Max Drawdown"
            value={formatCurrency(metrics.maxDrawdown)}
            subtitle="Peak-to-trough"
            icon={AlertTriangle}
            accent="red"
          />
          <MetricCard
            title="Avg R:R"
            value={`${metrics.avgRR.toFixed(2)}:1`}
            subtitle={`Best: ${formatCurrency(metrics.bestTrade)}`}
            icon={Award}
            accent="purple"
          />
        </div>

        {/* Equity Chart + Win/Loss */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EquityChart data={equityCurve} />
          </div>
          <div>
            <WinLossDonut
              winCount={metrics.winCount}
              lossCount={metrics.lossCount}
              breakevenCount={metrics.totalTrades - metrics.winCount - metrics.lossCount}
            />
          </div>
        </div>

        {/* Calendar + Daily PnL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PnLCalendar data={calendarData} />
          <DailyPnLChart trades={trades} />
        </div>

        {/* Recent Trades */}
        <div className="rounded-2xl" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e1e30" }}>
            <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Last 5 closed trades</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recentTrades.map((trade) => {
              const isWin = trade.status === "WIN";
              return (
                <div key={trade.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.015] transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={
                      isWin
                        ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                        : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                    }
                  >
                    {trade.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{trade.symbol}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={
                          trade.side === "LONG"
                            ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                            : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                        }
                      >
                        {trade.side}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                      {trade.exitDate.slice(0, 10)} · {trade.setup || "No setup"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold text-sm"
                      style={{ color: isWin ? "#22c55e" : "#ef4444" }}
                    >
                      {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl)}
                    </p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {formatPercent(trade.pnlPercent)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
