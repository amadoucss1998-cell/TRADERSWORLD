import { Trade } from "./trades";

export interface TradeMetrics {
  totalPnl: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
  avgRR: number;
  totalCommissions: number;
  longsCount: number;
  shortsCount: number;
  longWinRate: number;
  shortWinRate: number;
  avgHoldTime: number; // minutes
  currentStreak: number;
  streakType: "WIN" | "LOSS" | "NONE";
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  cumPnl: number;
}

export interface CalendarDay {
  date: string;
  pnl: number;
  tradeCount: number;
}

export interface SymbolStat {
  symbol: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
}

export function computeMetrics(trades: Trade[]): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalPnl: 0, totalTrades: 0, winCount: 0, lossCount: 0,
      winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
      maxDrawdown: 0, sharpeRatio: 0, bestTrade: 0, worstTrade: 0,
      avgRR: 0, totalCommissions: 0, longsCount: 0, shortsCount: 0,
      longWinRate: 0, shortWinRate: 0, avgHoldTime: 0,
      currentStreak: 0, streakType: "NONE",
    };
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );

  const wins = sorted.filter((t) => t.status === "WIN");
  const losses = sorted.filter((t) => t.status === "LOSS");

  const totalPnl = sorted.reduce((s, t) => s + t.pnl, 0);
  const winCount = wins.length;
  const lossCount = losses.length;
  const winRate = sorted.length > 0 ? (winCount / sorted.length) * 100 : 0;

  const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const avgWin = winCount > 0 ? totalWins / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Max Drawdown
  let peak = 0;
  let cumPnl = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumPnl += t.pnl;
    if (cumPnl > peak) peak = cumPnl;
    const drawdown = peak - cumPnl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Sharpe (simplified: mean/std of daily P&L, annualized)
  const dailyMap: Record<string, number> = {};
  for (const t of sorted) {
    const day = t.exitDate.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + t.pnl;
  }
  const dailyPnls = Object.values(dailyMap);
  const meanDaily = dailyPnls.reduce((s, v) => s + v, 0) / (dailyPnls.length || 1);
  const stdDaily = Math.sqrt(
    dailyPnls.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) / (dailyPnls.length || 1)
  );
  const sharpeRatio = stdDaily > 0 ? (meanDaily / stdDaily) * Math.sqrt(252) : 0;

  const bestTrade = Math.max(...sorted.map((t) => t.pnl));
  const worstTrade = Math.min(...sorted.map((t) => t.pnl));

  const longs = sorted.filter((t) => t.side === "LONG");
  const shorts = sorted.filter((t) => t.side === "SHORT");
  const longWins = longs.filter((t) => t.status === "WIN").length;
  const shortWins = shorts.filter((t) => t.status === "WIN").length;

  const avgHoldTime =
    sorted.reduce((s, t) => {
      const diff = new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime();
      return s + diff / 60000;
    }, 0) / (sorted.length || 1);

  // Current streak
  let currentStreak = 0;
  let streakType: "WIN" | "LOSS" | "NONE" = "NONE";
  const reversedTrades = [...sorted].reverse();
  if (reversedTrades.length > 0 && reversedTrades[0].status !== "BREAKEVEN") {
    streakType = reversedTrades[0].status as "WIN" | "LOSS";
    for (const t of reversedTrades) {
      if (t.status === streakType) currentStreak++;
      else break;
    }
  }

  return {
    totalPnl,
    totalTrades: sorted.length,
    winCount,
    lossCount,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdown,
    sharpeRatio,
    bestTrade,
    worstTrade,
    avgRR: avgLoss > 0 ? avgWin / avgLoss : 0,
    totalCommissions: sorted.reduce((s, t) => s + t.commission, 0),
    longsCount: longs.length,
    shortsCount: shorts.length,
    longWinRate: longs.length > 0 ? (longWins / longs.length) * 100 : 0,
    shortWinRate: shorts.length > 0 ? (shortWins / shorts.length) * 100 : 0,
    avgHoldTime,
    currentStreak,
    streakType,
  };
}

export function buildEquityCurve(trades: Trade[]): EquityPoint[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );

  let cumPnl = 0;
  return sorted.map((t) => {
    cumPnl += t.pnl;
    return {
      date: t.exitDate.slice(0, 10),
      equity: 10000 + cumPnl,
      pnl: t.pnl,
      cumPnl,
    };
  });
}

export function buildCalendarData(trades: Trade[]): CalendarDay[] {
  const map: Record<string, CalendarDay> = {};
  for (const t of trades) {
    const day = t.exitDate.slice(0, 10);
    if (!map[day]) {
      map[day] = { date: day, pnl: 0, tradeCount: 0 };
    }
    map[day].pnl += t.pnl;
    map[day].tradeCount += 1;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSymbolStats(trades: Trade[]): SymbolStat[] {
  const map: Record<string, { pnl: number; total: number; wins: number }> = {};
  for (const t of trades) {
    if (!map[t.symbol]) map[t.symbol] = { pnl: 0, total: 0, wins: 0 };
    map[t.symbol].pnl += t.pnl;
    map[t.symbol].total += 1;
    if (t.status === "WIN") map[t.symbol].wins += 1;
  }
  return Object.entries(map)
    .map(([symbol, d]) => ({
      symbol,
      totalPnl: d.pnl,
      tradeCount: d.total,
      winRate: (d.wins / d.total) * 100,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}
