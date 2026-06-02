export default function StatsBar() {
  const stats = [
    { value: '50,000+', label: 'Traders' },
    { value: '2M+', label: 'Trades Logged' },
    { value: '4.9★', label: 'Rating' },
    { value: '$2B+', label: 'Tracked' },
  ]

  return (
    <div className="border-y border-[#2a2a2a] bg-[#111111]">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
            <p className="text-[#71717a] text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
