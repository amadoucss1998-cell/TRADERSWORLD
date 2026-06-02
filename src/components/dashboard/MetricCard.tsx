import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  color?: 'green' | 'red' | 'default'
  sub?: string
}

export default function MetricCard({ label, value, color = 'default', sub }: MetricCardProps) {
  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-4">
      <p className="text-[#a1a1aa] text-xs font-medium uppercase tracking-[0.05em] mb-2">{label}</p>
      <p className={cn(
        'text-[28px] font-bold leading-none',
        color === 'green' && 'text-[#22c55e]',
        color === 'red' && 'text-[#ef4444]',
        color === 'default' && 'text-white',
      )}>
        {value}
      </p>
      {sub && <p className="text-[#71717a] text-xs mt-1">{sub}</p>}
    </div>
  )
}
