const testimonials = [
  {
    name: 'Marcus Chen',
    type: 'Day Trader',
    rating: 5,
    quote: 'TradeZella completely transformed how I approach my trading. The analytics helped me identify that I was overtrading on Mondays — just fixing that improved my P&L by 40%.',
    initials: 'MC',
  },
  {
    name: 'Sarah Williams',
    type: 'Swing Trader',
    rating: 5,
    quote: "The playbook feature is incredible. I can track exactly which setups are working and which aren't. It's like having a trading coach built into my journal.",
    initials: 'SW',
  },
  {
    name: 'James Rodriguez',
    type: 'Options Trader',
    rating: 5,
    quote: "I've tried every trading journal out there. TradeZella is the only one that actually makes me want to review my trades. The UI is beautiful and the insights are actionable.",
    initials: 'JR',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7c3aed] text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-[36px] font-semibold text-white">Loved By Traders Worldwide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-[#eab308]">★</span>
                ))}
              </div>
              <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm font-bold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-[#71717a] text-xs">{t.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
