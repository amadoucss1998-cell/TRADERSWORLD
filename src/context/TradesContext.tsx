'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Trade, loadTrades, saveTrades } from '@/lib/trades'

interface TradesContextValue {
  trades: Trade[]
  addTrade: (trade: Trade) => void
  removeTrade: (id: string) => void
  loading: boolean
}

const TradesContext = createContext<TradesContextValue | null>(null)

export function TradesProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTrades(loadTrades())
    setLoading(false)
  }, [])

  const addTrade = useCallback((trade: Trade) => {
    setTrades(prev => {
      const next = [trade, ...prev]
      saveTrades(next)
      return next
    })
  }, [])

  const removeTrade = useCallback((id: string) => {
    setTrades(prev => {
      const next = prev.filter(t => t.id !== id)
      saveTrades(next)
      return next
    })
  }, [])

  return (
    <TradesContext.Provider value={{ trades, addTrade, removeTrade, loading }}>
      {children}
    </TradesContext.Provider>
  )
}

export function useTrades() {
  const ctx = useContext(TradesContext)
  if (!ctx) throw new Error('useTrades must be used within TradesProvider')
  return ctx
}
