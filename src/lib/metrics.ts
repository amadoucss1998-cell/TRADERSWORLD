import type { Trade } from './trades'

export interface Metrics {
  netPnL: number
  winRate: number
  profitFactor: number
  totalTrades: number
  avgWin: number
  avgLoss: number
  avgRR: number
  maxDrawdown: number
  totalWins: number
  totalLosses: number
  breakEven: number
  grossWins: number
  grossLosses: number
}

export function calcMetrics(trades: Trade[]): Metrics {
  if (!trades.length) {
    return {
      netPnL: 0, winRate: 0, profitFactor: 0, totalTrades: 0,
      avgWin: 0, avgLoss: 0, avgRR: 0, maxDrawdown: 0,
      totalWins: 0, totalLosses: 0, breakEven: 0,
      grossWins: 0, grossLosses: 0,
    }
  }

  const wins = trades.filter(t => t.netPnL > 0)
  const losses = trades.filter(t => t.netPnL < 0)
  const be = trades.filter(t => t.netPnL === 0)

  const netPnL = trades.reduce((s, t) => s + t.netPnL, 0)
  const grossWins = wins.reduce((s, t) => s + t.netPnL, 0)
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.netPnL, 0))

  const winRate = (wins.length / trades.length) * 100
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0
  const avgWin = wins.length ? grossWins / wins.length : 0
  const avgLoss = losses.length ? -(grossLosses / losses.length) : 0
  const avgRR = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0

  // Max drawdown: running equity
  let peak = 0
  let equity = 0
  let maxDD = 0
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  for (const t of sorted) {
    equity += t.netPnL
    if (equity > peak) peak = equity
    const dd = peak - equity
    if (dd > maxDD) maxDD = dd
  }

  return {
    netPnL,
    winRate,
    profitFactor,
    totalTrades: trades.length,
    avgWin,
    avgLoss,
    avgRR,
    maxDrawdown: maxDD,
    totalWins: wins.length,
    totalLosses: losses.length,
    breakEven: be.length,
    grossWins,
    grossLosses,
  }
}

export interface EquityPoint {
  date: string
  equity: number
}

export function calcEquityCurve(trades: Trade[]): EquityPoint[] {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let running = 0
  return sorted.map(t => {
    running += t.netPnL
    return { date: t.date.slice(0, 10), equity: parseFloat(running.toFixed(2)) }
  })
}

export interface DailyPnL {
  day: string
  pnl: number
}

export function calcDailyPnL(trades: Trade[]): DailyPnL[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const map: Record<string, number> = {}
  for (const t of trades) {
    const dow = days[new Date(t.date).getDay()]
    map[dow] = (map[dow] || 0) + t.netPnL
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => ({ day: d, pnl: parseFloat((map[d] || 0).toFixed(2)) }))
}

export interface SymbolStat {
  symbol: string
  trades: number
  winRate: number
  avgPnL: number
  totalPnL: number
  avgHoldTime: number
}

export function calcSymbolStats(trades: Trade[]): SymbolStat[] {
  const map: Record<string, Trade[]> = {}
  for (const t of trades) {
    if (!map[t.symbol]) map[t.symbol] = []
    map[t.symbol].push(t)
  }
  return Object.entries(map).map(([symbol, ts]) => {
    const wins = ts.filter(t => t.netPnL > 0).length
    return {
      symbol,
      trades: ts.length,
      winRate: (wins / ts.length) * 100,
      avgPnL: ts.reduce((s, t) => s + t.netPnL, 0) / ts.length,
      totalPnL: ts.reduce((s, t) => s + t.netPnL, 0),
      avgHoldTime: ts.reduce((s, t) => s + t.holdTime, 0) / ts.length,
    }
  }).sort((a, b) => b.totalPnL - a.totalPnL)
}

export interface MonthlyPnL {
  month: string
  pnl: number
}

export function calcMonthlyPnL(trades: Trade[]): MonthlyPnL[] {
  const map: Record<string, number> = {}
  for (const t of trades) {
    const key = t.date.slice(0, 7)
    map[key] = (map[key] || 0) + t.netPnL
  }
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, pnl]) => {
      const d = new Date(key + '-01')
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        pnl: parseFloat(pnl.toFixed(2)),
      }
    })
}

export interface CalendarDay {
  date: string
  pnl: number
  trades: number
}

export function calcCalendar(trades: Trade[]): CalendarDay[] {
  const map: Record<string, { pnl: number; trades: number }> = {}
  for (const t of trades) {
    const key = t.date.slice(0, 10)
    if (!map[key]) map[key] = { pnl: 0, trades: 0 }
    map[key].pnl += t.netPnL
    map[key].trades++
  }
  return Object.entries(map).map(([date, v]) => ({ date, pnl: parseFloat(v.pnl.toFixed(2)), trades: v.trades }))
}
