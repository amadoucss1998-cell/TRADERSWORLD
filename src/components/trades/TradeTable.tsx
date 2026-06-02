"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Trade } from "@/lib/trades";
import { useTrades } from "@/context/TradesContext";
import { AddTradeModal } from "./AddTradeModal";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

type SortField = "exitDate" | "symbol" | "pnl" | "pnlPercent" | "side" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

interface Props {
  trades: Trade[];
}

export function TradeTable({ trades }: Props) {
  const { deleteTrade } = useTrades();
  const [sortField, setSortField] = useState<SortField>("exitDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  const sorted = [...trades].sort((a, b) => {
    let av: number | string = 0, bv: number | string = 0;
    if (sortField === "exitDate") { av = a.exitDate; bv = b.exitDate; }
    else if (sortField === "symbol") { av = a.symbol; bv = b.symbol; }
    else if (sortField === "pnl") { av = a.pnl; bv = b.pnl; }
    else if (sortField === "pnlPercent") { av = a.pnlPercent; bv = b.pnlPercent; }
    else if (sortField === "side") { av = a.side; bv = b.side; }
    else if (sortField === "status") { av = a.status; bv = b.status; }

    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ field }: { field: SortField }) {
    if (field !== sortField) return <ChevronUp size={12} className="opacity-20" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-400" /> : <ChevronDown size={12} className="text-indigo-400" />;
  }

  function SortableHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    return (
      <th
        className={cn("px-4 py-3 text-left cursor-pointer select-none", className)}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</span>
          <SortIcon field={field} />
        </div>
      </th>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#141420", border: "1px solid #1e1e30" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e30" }}>
                <SortableHeader field="exitDate" label="Date" />
                <SortableHeader field="symbol" label="Symbol" />
                <SortableHeader field="side" label="Side" />
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Setup</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Entry</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Exit</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Qty</span>
                </th>
                <SortableHeader field="pnl" label="P&L" className="text-right" />
                <SortableHeader field="pnlPercent" label="%" className="text-right" />
                <SortableHeader field="status" label="Result" />
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((trade, idx) => {
                const isWin = trade.status === "WIN";
                const isLoss = trade.status === "LOSS";
                const isDeleting = confirmDelete === trade.id;

                return (
                  <tr
                    key={trade.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: idx < paged.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{trade.exitDate.slice(0, 10)}</div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>
                        {new Date(trade.exitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white text-sm">{trade.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={
                          trade.side === "LONG"
                            ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                            : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                        }
                      >
                        {trade.side === "LONG" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {trade.side}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{trade.setup || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-white">${trade.entryPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-white">${trade.exitPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-white">{trade.quantity.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-sm font-bold"
                        style={{ color: isWin ? "#22c55e" : isLoss ? "#ef4444" : "#9ca3af" }}
                      >
                        {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-xs font-medium"
                        style={{ color: isWin ? "#22c55e" : isLoss ? "#ef4444" : "#9ca3af" }}
                      >
                        {formatPercent(trade.pnlPercent)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={
                          isWin
                            ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                            : isLoss
                            ? { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                            : { background: "rgba(107,114,128,0.15)", color: "#9ca3af" }
                        }
                      >
                        {isWin ? "WIN" : isLoss ? "LOSS" : "BE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isDeleting ? (
                          <>
                            <button
                              onClick={() => { deleteTrade(trade.id); setConfirmDelete(null); }}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-80"
                              style={{ background: "#ef4444" }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-gray-400 transition-colors hover:text-white"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #2a2a40" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditTrade(trade)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                            >
                              <Pencil size={13} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(trade.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 size={13} className="text-gray-500 hover:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-600">
                    No trades found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid #1e1e30" }}
          >
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} trades
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft size={14} className="text-gray-400" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                    style={
                      pageNum === page
                        ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                        : { color: "#6b7280" }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddTradeModal
        open={!!editTrade}
        onClose={() => setEditTrade(null)}
        editTrade={editTrade ?? undefined}
      />
    </>
  );
}
