const features = [
  {
    icon: '📊',
    title: 'Trade Journal',
    desc: 'Log every trade with detailed notes, screenshots, and tags',
  },
  {
    icon: '📈',
    title: 'Performance Analytics',
    desc: 'Deep dive into your stats with 50+ performance metrics',
  },
  {
    icon: '📅',
    title: 'Trade Calendar',
    desc: 'Visualize your P&L on a calendar to spot patterns',
  },
  {
    icon: '📋',
    title: 'Playbook',
    desc: 'Document your trading strategies and track their performance',
  },
  {
    icon: '📉',
    title: 'Risk Management',
    desc: 'Monitor your risk metrics and protect your capital',
  },
  {
    icon: '🔗',
    title: 'Broker Import',
    desc: 'Import trades automatically from 20+ brokers',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7c3aed] text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-[36px] font-semibold text-white">Everything You Need To Trade Better</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div
              key={f.title}
              className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#7c3aed]/40 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#a1a1aa] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
