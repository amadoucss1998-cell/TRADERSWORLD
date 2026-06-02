import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Perfect for getting started',
    features: ['100 trades/month', 'Basic analytics', '1 account', 'Trade journal', 'Mobile app'],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/mo',
    desc: 'For serious traders',
    features: ['Unlimited trades', 'All analytics (50+ metrics)', '3 accounts', 'Playbook', 'CSV import', 'Priority email support'],
    cta: 'Start Pro Trial',
    highlight: true,
  },
  {
    name: 'Elite',
    price: '$39.99',
    period: '/mo',
    desc: 'For professional traders',
    features: ['Everything in Pro', '10 accounts', 'AI insights', 'Priority support', 'Broker auto-import', 'Custom reports'],
    cta: 'Start Elite Trial',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7c3aed] text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-[36px] font-semibold text-white">Simple, Transparent Pricing</h2>
          <p className="text-[#a1a1aa] mt-4">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(p => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 relative ${
                p.highlight
                  ? 'border-[#7c3aed] bg-[#7c3aed]/5'
                  : 'border-[#2a2a2a] bg-[#181818]'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-[#a1a1aa] text-sm mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
                  <span className="text-[#a1a1aa]">{p.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#a1a1aa]">
                    <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className={`block text-center py-3 rounded-full font-semibold text-sm transition-colors ${
                  p.highlight
                    ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
                    : 'border border-[#2a2a2a] hover:border-[#3a3a3a] text-white'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
