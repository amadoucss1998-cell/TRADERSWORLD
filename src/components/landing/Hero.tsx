'use client'

import Link from 'next/link'
import { Play, ArrowRight, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#8b5cf6] text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span>🏆</span>
          <span>#1 Rated Trading Journal</span>
        </div>

        {/* H1 */}
        <h1 className="text-[56px] font-bold text-white leading-tight mb-6">
          The Trading Journal That Makes You A Better Trader
        </h1>

        {/* Subtext */}
        <p className="text-[#a1a1aa] text-lg mb-10 max-w-2xl mx-auto">
          Track, analyze, and improve your trading performance with powerful analytics and insights.
          Join 50,000+ traders already using TradeZella.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
          >
            Start For Free <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="flex items-center gap-2 border border-[#2a2a2a] hover:border-[#3a3a3a] text-white font-semibold px-8 py-3.5 rounded-full transition-colors bg-transparent">
            <div className="w-6 h-6 rounded-full bg-[#7c3aed]/20 flex items-center justify-center">
              <Play className="w-3 h-3 text-[#8b5cf6] fill-[#8b5cf6]" />
            </div>
            Watch Demo
          </button>
        </div>

        <p className="text-[#71717a] text-sm">
          No credit card required • Free plan available • Cancel anytime
        </p>

        {/* Dashboard mockup */}
        <div className="mt-16 rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 text-left shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <div className="w-3 h-3 rounded-full bg-[#eab308]" />
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <div className="flex-1 mx-4 h-6 rounded bg-[#181818] flex items-center px-3">
              <span className="text-[#71717a] text-xs">app.tradezella.com/dashboard</span>
            </div>
          </div>

          {/* Mini dashboard UI */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Net P&L', value: '$8,420', color: 'text-[#22c55e]' },
              { label: 'Win Rate', value: '62.3%', color: 'text-white' },
              { label: 'Profit Factor', value: '2.14', color: 'text-white' },
              { label: 'Total Trades', value: '75', color: 'text-white' },
            ].map(m => (
              <div key={m.label} className="bg-[#181818] rounded-lg p-3 border border-[#2a2a2a]">
                <p className="text-[#71717a] text-xs mb-1">{m.label}</p>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Fake chart */}
          <div className="bg-[#181818] rounded-lg border border-[#2a2a2a] p-4 h-40 flex items-end gap-1">
            {[30, 45, 35, 55, 50, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[#7c3aed] to-[#7c3aed]/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
