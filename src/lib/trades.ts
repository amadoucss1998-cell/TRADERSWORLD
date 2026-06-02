export type Direction = 'LONG' | 'SHORT'
export type Setup = 'Breakout' | 'Pullback' | 'Reversal' | 'Momentum' | 'Scalp' | 'Swing' | 'News'

export interface Trade {
  id: string
  symbol: string
  direction: Direction
  date: string
  entryPrice: number
  exitPrice: number
  quantity: number
  commission: number
  grossPnL: number
  netPnL: number
  setup: Setup
  tags: string[]
  notes: string
  holdTime: number // minutes
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randomInt(9, 15), randomInt(0, 59), 0, 0)
  return d.toISOString()
}

const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'AMD', 'MSFT', 'META']
const setups: Setup[] = ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Scalp', 'Swing', 'News']

const basePrices: Record<string, number> = {
  AAPL: 185,
  TSLA: 240,
  SPY: 475,
  QQQ: 410,
  NVDA: 620,
  AMD: 155,
  MSFT: 380,
  META: 490,
}

function generateTrade(id: number, daysBack: number): Trade {
  const symbol = symbols[id % symbols.length]
  const base = basePrices[symbol]
  const isWin = Math.random() < 0.62
  const direction: Direction = Math.random() < 0.65 ? 'LONG' : 'SHORT'
  const qty = randomInt(10, 200)
  const commission = parseFloat((randomBetween(1.5, 8)).toFixed(2))

  let entryPrice: number
  let exitPrice: number

  if (isWin) {
    entryPrice = parseFloat((base * randomBetween(0.97, 1.03)).toFixed(2))
    const move = randomBetween(0.003, 0.025)
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice * (1 + move)).toFixed(2))
      : parseFloat((entryPrice * (1 - move)).toFixed(2))
  } else {
    entryPrice = parseFloat((base * randomBetween(0.97, 1.03)).toFixed(2))
    const move = randomBetween(0.002, 0.018)
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice * (1 - move)).toFixed(2))
      : parseFloat((entryPrice * (1 + move)).toFixed(2))
  }

  const grossPnL = direction === 'LONG'
    ? parseFloat(((exitPrice - entryPrice) * qty).toFixed(2))
    : parseFloat(((entryPrice - exitPrice) * qty).toFixed(2))
  const netPnL = parseFloat((grossPnL - commission).toFixed(2))

  return {
    id: `trade-${id}`,
    symbol,
    direction,
    date: daysAgo(daysBack),
    entryPrice,
    exitPrice,
    quantity: qty,
    commission,
    grossPnL,
    netPnL,
    setup: setups[id % setups.length],
    tags: [],
    notes: '',
    holdTime: randomInt(5, 480),
  }
}

// Generate 75 trades spread over 90 days
let _mockTrades: Trade[] | null = null

export function getMockTrades(): Trade[] {
  if (_mockTrades) return _mockTrades
  const trades: Trade[] = []
  // Spread trades: ~75 trades over 90 days (roughly 1 per day with gaps)
  const usedDays = new Set<number>()
  let count = 0
  while (trades.length < 75) {
    const day = randomInt(1, 90)
    trades.push(generateTrade(count, day))
    count++
  }
  trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  _mockTrades = trades
  return trades
}

export function loadTrades(): Trade[] {
  if (typeof window === 'undefined') return getMockTrades()
  try {
    const raw = localStorage.getItem('tz_trades')
    if (raw) return JSON.parse(raw)
  } catch {}
  const trades = getMockTrades()
  saveTrades(trades)
  return trades
}

export function saveTrades(trades: Trade[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('tz_trades', JSON.stringify(trades))
}
