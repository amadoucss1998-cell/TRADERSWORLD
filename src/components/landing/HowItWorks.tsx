const steps = [
  {
    num: '01',
    title: 'Connect Broker / Import Trades',
    desc: 'Connect your broker or manually import your trades via CSV. We support 20+ brokers.',
  },
  {
    num: '02',
    title: 'Analyze Performance',
    desc: 'Instantly get 50+ analytics, equity curves, calendar heatmaps, and pattern breakdowns.',
  },
  {
    num: '03',
    title: 'Improve & Profit',
    desc: 'Use data-driven insights to eliminate bad habits and scale your winning strategies.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7c3aed] text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-[36px] font-semibold text-white">Get Started In Minutes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(s => (
            <div key={s.num} className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-[#7c3aed] font-bold text-lg">{s.num}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{s.title}</h3>
              <p className="text-[#a1a1aa] text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
