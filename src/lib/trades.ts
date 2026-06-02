export type TradeSide = "LONG" | "SHORT";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN";

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string; // ISO string
  exitDate: string;  // ISO string
  pnl: number;
  pnlPercent: number;
  status: TradeStatus;
  notes: string;
  tags: string[];
  setup: string;
  commission: number;
}

export interface TradeInput {
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  notes: string;
  tags: string[];
  setup: string;
  commission: number;
}

function computePnl(trade: TradeInput): { pnl: number; pnlPercent: number; status: TradeStatus } {
  let rawPnl: number;
  if (trade.side === "LONG") {
    rawPnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
  } else {
    rawPnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
  }
  const pnl = rawPnl - trade.commission;
  const pnlPercent = (rawPnl / (trade.entryPrice * trade.quantity)) * 100;
  const status: TradeStatus = pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN";
  return { pnl, pnlPercent, status };
}

export function createTrade(input: TradeInput): Trade {
  const { pnl, pnlPercent, status } = computePnl(input);
  return {
    id: crypto.randomUUID(),
    ...input,
    pnl,
    pnlPercent,
    status,
  };
}

export function updateTrade(existing: Trade, input: TradeInput): Trade {
  const { pnl, pnlPercent, status } = computePnl(input);
  return { ...existing, ...input, pnl, pnlPercent, status };
}

// --- Mock Data ---
const SETUPS = ["Breakout", "Pullback", "Reversal", "Momentum", "Gap Fill", "VWAP Reclaim", "Support Bounce", "Trend Follow"];
const TAGS_POOL = ["A+", "B", "FOMO", "Plan", "Patience", "Early", "Late", "Oversize", "Managed", "Runner"];
const SYMBOLS = ["AAPL", "TSLA", "NVDA", "SPY", "QQQ", "AMZN", "MSFT", "GOOGL", "META", "AMD", "NFLX", "COIN", "PLTR", "SOFI", "NIO"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTags(): string[] {
  const n = Math.floor(Math.random() * 3);
  const result = new Set<string>();
  for (let i = 0; i < n; i++) result.add(randomItem(TAGS_POOL));
  return Array.from(result);
}

function dateStr(d: Date): string {
  return d.toISOString();
}

function generateMockTrades(): Trade[] {
  const trades: Trade[] = [];
  const startDate = new Date("2025-01-02");

  // Seed for reproducibility using a fixed sequence
  const seedData: Array<{ sym: string; side: TradeSide; winBias: number; entryBase: number; range: number; qty: number }> = [
    { sym: "NVDA", side: "LONG", winBias: 0.7, entryBase: 480, range: 40, qty: 100 },
    { sym: "TSLA", side: "LONG", winBias: 0.55, entryBase: 200, range: 20, qty: 150 },
    { sym: "AAPL", side: "LONG", winBias: 0.65, entryBase: 175, range: 10, qty: 200 },
    { sym: "SPY",  side: "LONG", winBias: 0.6,  entryBase: 450, range: 15, qty: 50  },
    { sym: "QQQ",  side: "LONG", winBias: 0.6,  entryBase: 370, range: 15, qty: 75  },
    { sym: "AMD",  side: "LONG", winBias: 0.5,  entryBase: 140, range: 20, qty: 200 },
    { sym: "META", side: "LONG", winBias: 0.65, entryBase: 490, range: 30, qty: 50  },
    { sym: "AMZN", side: "LONG", winBias: 0.6,  entryBase: 180, range: 12, qty: 100 },
    { sym: "COIN", side: "LONG", winBias: 0.45, entryBase: 200, range: 30, qty: 100 },
    { sym: "PLTR", side: "LONG", winBias: 0.55, entryBase: 22,  range: 4,  qty: 500 },
    { sym: "TSLA", side: "SHORT",winBias: 0.5,  entryBase: 210, range: 20, qty: 100 },
    { sym: "NVDA", side: "SHORT",winBias: 0.45, entryBase: 500, range: 40, qty: 50  },
    { sym: "NFLX", side: "LONG", winBias: 0.6,  entryBase: 600, range: 40, qty: 30  },
    { sym: "SOFI", side: "LONG", winBias: 0.5,  entryBase: 9,   range: 2,  qty: 1000},
    { sym: "NIO",  side: "LONG", winBias: 0.4,  entryBase: 6,   range: 1,  qty: 1500},
    { sym: "MSFT", side: "LONG", winBias: 0.7,  entryBase: 390, range: 20, qty: 75  },
    { sym: "GOOGL",side: "LONG", winBias: 0.65, entryBase: 170, range: 12, qty: 100 },
  ];

  let dayOffset = 0;
  for (let i = 0; i < 60; i++) {
    // Skip weekends
    while (true) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dayOffset);
      const day = d.getDay();
      if (day !== 0 && day !== 6) break;
      dayOffset++;
    }

    const entryDate = new Date(startDate);
    entryDate.setDate(entryDate.getDate() + dayOffset);
    entryDate.setHours(9 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));

    const exitDate = new Date(entryDate);
    exitDate.setMinutes(exitDate.getMinutes() + Math.floor(randomBetween(5, 240)));

    const config = seedData[i % seedData.length];
    const entry = config.entryBase + randomBetween(-config.range / 2, config.range / 2);
    const isWin = Math.random() < config.winBias;
    const moveRange = entry * randomBetween(0.005, 0.04);
    let exit: number;
    if (config.side === "LONG") {
      exit = isWin ? entry + moveRange : entry - moveRange * 0.7;
    } else {
      exit = isWin ? entry - moveRange : entry + moveRange * 0.7;
    }

    const commission = randomBetween(1, 5);
    const input: TradeInput = {
      symbol: config.sym,
      side: config.side,
      entryPrice: parseFloat(entry.toFixed(2)),
      exitPrice: parseFloat(exit.toFixed(2)),
      quantity: config.qty,
      entryDate: dateStr(entryDate),
      exitDate: dateStr(exitDate),
      notes: isWin ? "Good execution, followed the plan." : "Stopped out, need to review setup.",
      tags: randomTags(),
      setup: randomItem(SETUPS),
      commission: parseFloat(commission.toFixed(2)),
    };

    const { pnl, pnlPercent, status } = (() => {
      let rawPnl: number;
      if (input.side === "LONG") rawPnl = (input.exitPrice - input.entryPrice) * input.quantity;
      else rawPnl = (input.entryPrice - input.exitPrice) * input.quantity;
      const p = rawPnl - input.commission;
      const pp = (rawPnl / (input.entryPrice * input.quantity)) * 100;
      const s: TradeStatus = p > 0 ? "WIN" : p < 0 ? "LOSS" : "BREAKEVEN";
      return { pnl: parseFloat(p.toFixed(2)), pnlPercent: parseFloat(pp.toFixed(2)), status: s };
    })();

    trades.push({
      id: `mock-${i}`,
      ...input,
      pnl,
      pnlPercent,
      status,
    });

    dayOffset += Math.floor(Math.random() * 2);
  }

  return trades;
}

export const MOCK_TRADES: Trade[] = generateMockTrades();

// LocalStorage persistence
const STORAGE_KEY = "tradersworld_trades";

export function loadTrades(): Trade[] {
  if (typeof window === "undefined") return MOCK_TRADES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTrades(MOCK_TRADES);
      return MOCK_TRADES;
    }
    return JSON.parse(raw) as Trade[];
  } catch {
    return MOCK_TRADES;
  }
}

export function saveTrades(trades: Trade[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
