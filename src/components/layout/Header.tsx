"use client";

import { Bell, Search, Plus } from "lucide-react";
import { useState } from "react";
import { AddTradeModal } from "@/components/trades/AddTradeModal";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(15,15,15,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6b7280",
            }}
          >
            <Search size={14} />
            <span className="hidden md:block">Quick search...</span>
          </div>

          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl relative"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Bell size={16} className="text-gray-400" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#6366f1" }}
            />
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Plus size={16} />
            <span>Add Trade</span>
          </button>
        </div>
      </header>

      <AddTradeModal open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}
