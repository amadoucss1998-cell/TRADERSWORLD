"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Trade, TradeInput, createTrade, updateTrade, loadTrades, saveTrades } from "@/lib/trades";

interface TradesContextType {
  trades: Trade[];
  addTrade: (input: TradeInput) => void;
  editTrade: (id: string, input: TradeInput) => void;
  deleteTrade: (id: string) => void;
  resetToMock: () => void;
}

const TradesContext = createContext<TradesContextType | null>(null);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    setTrades(loadTrades());
  }, []);

  function addTrade(input: TradeInput) {
    const next = [createTrade(input), ...trades];
    setTrades(next);
    saveTrades(next);
  }

  function editTrade(id: string, input: TradeInput) {
    const next = trades.map((t) => (t.id === id ? updateTrade(t, input) : t));
    setTrades(next);
    saveTrades(next);
  }

  function deleteTrade(id: string) {
    const next = trades.filter((t) => t.id !== id);
    setTrades(next);
    saveTrades(next);
  }

  function resetToMock() {
    const { MOCK_TRADES } = require("@/lib/trades");
    setTrades(MOCK_TRADES);
    saveTrades(MOCK_TRADES);
  }

  return (
    <TradesContext.Provider value={{ trades, addTrade, editTrade, deleteTrade, resetToMock }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error("useTrades must be used inside TradesProvider");
  return ctx;
}
