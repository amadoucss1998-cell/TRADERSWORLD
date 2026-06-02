"use client";

import { useMemo, useState } from "react";
import { Search, Filter, X, Download } from "lucide-react";
import { useTrades } from "@/context/TradesContext";
import { Header } from "@/components/layout/Header";
import { TradeTable } from "@/components/trades/TradeTable";
import { Trade } from "@/lib/trades";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "WIN" | "LOSS" | "BREAKEVEN";
type SideFilter = "ALL" | "LONG" | "SHORT";

const SYMBOLS_COMMON = ["AAPL", "TSLA", "NVDA", "SPY", "QQQ", "AMZN", "MSFT", "GOOGL", "META", "AMD", "NFLX"];

export default function JournalPage() {
  const { trades } = useTrades();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return trades.filter((t: Trade) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.symbol.toLowerCase().includes(q) &&
          !t.notes.toLowerCase().includes(q) &&
          !t.setup.toLowerCase().includes(q) &&
          !t.tags.some((tag) => tag.toLowerCase().includes(q))
        ) return false;
      }
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (sideFilter !== "ALL" && t.side !== sideFilter) return false;
      if (symbolFilter && t.symbol !== symbolFilter) return false;
      if (dateFrom && t.exitDate.slice(0, 10) < dateFrom) return false;
      if (dateTo && t.exitDate.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [trades, search, statusFilter, sideFilter, symbolFilter, dateFrom, dateTo]);

  const hasFilters = statusFilter !== "ALL" || sideFilter !== "ALL" || symbolFilter || dateFrom || dateTo;

  function clearFilters() {
    setStatusFilter("ALL");
    setSideFilter("ALL");
    setSymbolFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function exportCsv() {
    const headers = ["Date", "Symbol", "Side", "Setup", "Entry", "Exit", "Qty", "P&L", "P&L%", "Status", "Tags", "Notes"];
    const rows = filtered.map((t) => [
      t.exitDate.slice(0, 10),
      t.symbol,
      t.side,
      t.setup,
      t.entryPrice,
      t.exitPrice,
      t.quantity,
      t.pnl.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.status,
      t.tags.join(";"),
      t.notes.replace(/,/g, " "),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    a.click();
  }

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const wins = filtered.filter((t) => t.status === "WIN").length;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Trade Journal"
        subtitle={`${filtered.length} trades${hasFilters ? " (filtered)" : ""}`}
      />

      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Search + Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <Search size={15} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by symbol, setup, tags, notes..."
              className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={13} className="text-gray-500 hover:text-gray-300" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              showFilters
                ? "text-white"
                : "text-gray-400 hover:text-white"
            )}
            style={
              showFilters
                ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)" }
                : { background: "#141420", border: "1px solid #1e1e30" }
            }
          >
            <Filter size={14} />
            Filters
            {hasFilters && (
              <span
                className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: "#6366f1" }}
              >
                !
              </span>
            )}
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div
            className="rounded-2xl p-4 space-y-4"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#6b7280" }}>
                  Result
                </label>
                <div className="flex gap-1 flex-wrap">
                  {(["ALL", "WIN", "LOSS", "BREAKEVEN"] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                        statusFilter === s ? "text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                      style={
                        statusFilter === s
                          ? {
                              background:
                                s === "WIN"
                                  ? "rgba(34,197,94,0.2)"
                                  : s === "LOSS"
                                  ? "rgba(239,68,68,0.2)"
                                  : "rgba(99,102,241,0.2)",
                              border: `1px solid ${s === "WIN" ? "rgba(34,197,94,0.4)" : s === "LOSS" ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.4)"}`,
                            }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a40" }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#6b7280" }}>
                  Direction
                </label>
                <div className="flex gap-1">
                  {(["ALL", "LONG", "SHORT"] as SideFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSideFilter(s)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                        sideFilter === s ? "text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                      style={
                        sideFilter === s
                          ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a40" }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#6b7280" }}>
                  Symbol
                </label>
                <select
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs text-white outline-none"
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
                >
                  <option value="">All Symbols</option>
                  {SYMBOLS_COMMON.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#6b7280" }}>
                  Date Range
                </label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl text-xs text-white outline-none"
                    style={{ background: "#0f0f1a", border: "1px solid #2a2a40", colorScheme: "dark" }}
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl text-xs text-white outline-none"
                    style={{ background: "#0f0f1a", border: "1px solid #2a2a40", colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Summary Row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <span style={{ color: "#6b7280" }}>Filtered P&L:</span>
            <span
              className="font-bold"
              style={{ color: totalPnl >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <span style={{ color: "#6b7280" }}>Win Rate:</span>
            <span className="font-bold text-white">
              {filtered.length > 0 ? ((wins / filtered.length) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: "#141420", border: "1px solid #1e1e30" }}
          >
            <span style={{ color: "#6b7280" }}>Trades:</span>
            <span className="font-bold text-white">{filtered.length}</span>
          </div>
        </div>

        <TradeTable trades={filtered} />
      </div>
    </div>
  );
}
