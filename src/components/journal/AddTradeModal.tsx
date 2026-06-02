'use client'

import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { useTrades } from '@/context/TradesContext'
import type { Direction, Setup } from '@/lib/trades'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

const setups: Setup[] = ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Scalp', 'Swing', 'News']

export default function AddTradeModal({ open, onClose }: Props) {
  const { addTrade } = useTrades()
  const [form, setForm] = useState({
    symbol: '',
    direction: 'LONG' as Direction,
    date: new Date().toISOString().slice(0, 10),
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    commission: '2.00',
    setup: 'Breakout' as Setup,
    notes: '',
    tags: '',
  })

  const entry = parseFloat(form.entryPrice) || 0
  const exit = parseFloat(form.exitPrice) || 0
  const qty = parseFloat(form.quantity) || 0
  const comm = parseFloat(form.commission) || 0

  const grossPnL = form.direction === 'LONG'
    ? (exit - entry) * qty
    : (entry - exit) * qty
  const netPnL = grossPnL - comm

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.symbol || !entry || !exit || !qty) return
    addTrade({
      id: `trade-${Date.now()}`,
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      date: new Date(form.date).toISOString(),
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      commission: comm,
      grossPnL: parseFloat(grossPnL.toFixed(2)),
      netPnL: parseFloat(netPnL.toFixed(2)),
      setup: form.setup,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      notes: form.notes,
      holdTime: 30,
    })
    onClose()
    setForm(f => ({ ...f, symbol: '', entryPrice: '', exitPrice: '', quantity: '', notes: '', tags: '' }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#181818] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#181818] z-10">
          <h2 className="text-white font-semibold text-lg">Add Trade</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Symbol */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Symbol</label>
              <input
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed] uppercase"
                placeholder="AAPL"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Date</label>
              <input
                type="date"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>

            {/* Direction */}
            <div className="col-span-2">
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Direction</label>
              <div className="flex gap-2">
                {(['LONG', 'SHORT'] as Direction[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('direction', d)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      form.direction === d
                        ? d === 'LONG'
                          ? 'bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e]'
                          : 'bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444]'
                        : 'bg-[#0d0d0d] border border-[#2a2a2a] text-[#71717a]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Entry Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={e => set('entryPrice', e.target.value)}
                required
              />
            </div>

            {/* Exit */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Exit Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                placeholder="0.00"
                value={form.exitPrice}
                onChange={e => set('exitPrice', e.target.value)}
                required
              />
            </div>

            {/* Qty */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Quantity</label>
              <input
                type="number"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                placeholder="100"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                required
              />
            </div>

            {/* Commission */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Commission</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                value={form.commission}
                onChange={e => set('commission', e.target.value)}
              />
            </div>

            {/* Calculated P&L */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Gross P&amp;L</label>
              <div className={`w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm font-semibold ${grossPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {entry && exit && qty ? formatCurrency(grossPnL) : '—'}
              </div>
            </div>

            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Net P&amp;L</label>
              <div className={`w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm font-semibold ${netPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {entry && exit && qty ? formatCurrency(netPnL) : '—'}
              </div>
            </div>

            {/* Setup */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Setup</label>
              <select
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                value={form.setup}
                onChange={e => set('setup', e.target.value as Setup)}
              >
                {setups.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Tags (comma separated)</label>
              <input
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                placeholder="gap up, earnings..."
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Notes</label>
              <textarea
                rows={3}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7c3aed] resize-none"
                placeholder="Trade notes..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>

            {/* Screenshot */}
            <div className="col-span-2">
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2">Screenshot</label>
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-6 text-center hover:border-[#7c3aed]/40 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-[#71717a] mx-auto mb-2" />
                <p className="text-[#71717a] text-sm">Drop image or click to upload</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#a1a1aa] hover:text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
