"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { useTrades } from "@/context/TradesContext";
import { Trade, TradeInput } from "@/lib/trades";
import { cn } from "@/lib/utils";

const SETUPS = [
  "Breakout", "Pullback", "Reversal", "Momentum",
  "Gap Fill", "VWAP Reclaim", "Support Bounce", "Trend Follow",
  "Earnings Play", "News Catalyst",
];

const COMMON_TAGS = ["A+", "B Setup", "FOMO", "Plan", "Patience", "Early", "Late", "Oversize", "Managed", "Runner"];

interface Props {
  open: boolean;
  onClose: () => void;
  editTrade?: Trade;
}

function toLocalInputValue(isoString: string) {
  if (!isoString) return "";
  // Convert ISO to datetime-local format
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTradeModal({ open, onClose, editTrade }: Props) {
  const { addTrade, editTrade: editTradeCtx } = useTrades();

  const blank: Omit<TradeInput, ""> = {
    symbol: "",
    side: "LONG",
    entryPrice: 0,
    exitPrice: 0,
    quantity: 0,
    entryDate: new Date().toISOString(),
    exitDate: new Date().toISOString(),
    notes: "",
    tags: [],
    setup: "",
    commission: 0,
  };

  const [form, setForm] = useState<TradeInput>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTrade) {
      setForm({ ...editTrade });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [editTrade, open]);

  function set(field: keyof TradeInput, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.symbol.trim()) e.symbol = "Symbol is required";
    if (!form.entryPrice || form.entryPrice <= 0) e.entryPrice = "Entry price must be positive";
    if (!form.exitPrice || form.exitPrice <= 0) e.exitPrice = "Exit price must be positive";
    if (!form.quantity || form.quantity <= 0) e.quantity = "Quantity must be positive";
    if (!form.entryDate) e.entryDate = "Entry date required";
    if (!form.exitDate) e.exitDate = "Exit date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (editTrade) {
      editTradeCtx(editTrade.id, form);
    } else {
      addTrade(form);
    }
    onClose();
  }

  if (!open) return null;

  // Estimated P&L preview
  let estPnl: number | null = null;
  if (form.entryPrice > 0 && form.exitPrice > 0 && form.quantity > 0) {
    const rawPnl =
      form.side === "LONG"
        ? (form.exitPrice - form.entryPrice) * form.quantity
        : (form.entryPrice - form.exitPrice) * form.quantity;
    estPnl = rawPnl - (form.commission || 0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "#141420",
          border: "1px solid #2a2a40",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1e1e30" }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">
              {editTrade ? "Edit Trade" : "Log New Trade"}
            </h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {editTrade ? "Update trade details" : "Add a trade to your journal"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Symbol + Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Symbol *
                </label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => set("symbol", e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL"
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors",
                    errors.symbol ? "ring-1 ring-red-500" : "focus:ring-1 focus:ring-indigo-500"
                  )}
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
                />
                {errors.symbol && <p className="text-red-400 text-xs mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Direction *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => set("side", "LONG")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      form.side === "LONG"
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                    style={
                      form.side === "LONG"
                        ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }
                        : { background: "#0f0f1a", border: "1px solid #2a2a40" }
                    }
                  >
                    <TrendingUp size={14} className={form.side === "LONG" ? "text-green-400" : ""} />
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => set("side", "SHORT")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      form.side === "SHORT"
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                    style={
                      form.side === "SHORT"
                        ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }
                        : { background: "#0f0f1a", border: "1px solid #2a2a40" }
                    }
                  >
                    <TrendingDown size={14} className={form.side === "SHORT" ? "text-red-400" : ""} />
                    Short
                  </button>
                </div>
              </div>
            </div>

            {/* Prices + Quantity */}
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  { field: "entryPrice", label: "Entry Price *", placeholder: "0.00" },
                  { field: "exitPrice", label: "Exit Price *", placeholder: "0.00" },
                  { field: "quantity", label: "Shares/Contracts *", placeholder: "100" },
                ] as const
              ).map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                    {label}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form[field] || ""}
                    onChange={(e) => set(field, parseFloat(e.target.value) || 0)}
                    placeholder={placeholder}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors",
                      errors[field] ? "ring-1 ring-red-500" : "focus:ring-1 focus:ring-indigo-500"
                    )}
                    style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
                  />
                  {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Entry Date/Time *
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(form.entryDate)}
                  onChange={(e) => set("entryDate", new Date(e.target.value).toISOString())}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40", colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Exit Date/Time *
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(form.exitDate)}
                  onChange={(e) => set("exitDate", new Date(e.target.value).toISOString())}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40", colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Setup + Commission */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Setup
                </label>
                <select
                  value={form.setup}
                  onChange={(e) => set("setup", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
                >
                  <option value="">Select setup...</option>
                  {SETUPS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                  Commission ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.commission || ""}
                  onChange={(e) => set("commission", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#9ca3af" }}>
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      form.tags.includes(tag)
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    )}
                    style={
                      form.tags.includes(tag)
                        ? { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a40" }
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#9ca3af" }}>
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Trade rationale, what went well, what to improve..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                style={{ background: "#0f0f1a", border: "1px solid #2a2a40" }}
              />
            </div>

            {/* P&L Preview */}
            {estPnl !== null && (
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: estPnl >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${estPnl >= 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: "#9ca3af" }}>Estimated P&L</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: estPnl >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {estPnl >= 0 ? "+" : ""}${estPnl.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex gap-3 flex-shrink-0"
            style={{ borderTop: "1px solid #1e1e30" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 transition-colors hover:text-white hover:bg-white/5"
              style={{ border: "1px solid #2a2a40" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {editTrade ? "Save Changes" : "Log Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
