'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, LayoutDashboard, Calendar, BookOpen, BookMarked, BarChart2, Settings, Upload, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Calendar', href: '/analytics', icon: Calendar },
    ],
  },
  {
    section: 'TRADING',
    items: [
      { label: 'Journal', href: '/journal', icon: BookOpen },
      { label: 'Playbook', href: '#', icon: BookMarked },
      { label: 'Analytics', href: '/analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '#', icon: Settings },
      { label: 'Import Trades', href: '#', icon: Upload },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#111111] border-r border-[#2a2a2a] flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[#2a2a2a]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-white font-bold text-lg">TradeZella</span>
        </Link>
      </div>

      {/* Account selector */}
      <div className="px-3 py-3 border-b border-[#2a2a2a]">
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-white text-sm font-medium">Main Account</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] text-xs font-semibold">+$8,420</span>
            <ChevronDown className="w-3 h-3 text-[#71717a]" />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map(section => (
          <div key={section.section} className="mb-6">
            <p className="text-[#71717a] text-xs font-semibold uppercase tracking-widest px-3 mb-2">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        active
                          ? 'bg-[#7c3aed]/10 text-[#8b5cf6] font-medium'
                          : 'text-[#a1a1aa] hover:text-white hover:bg-[#181818]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm font-bold">
            J
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">John Trader</p>
            <p className="text-[#71717a] text-xs truncate">Pro Plan</p>
          </div>
          <span className="text-xs bg-[#7c3aed]/10 text-[#8b5cf6] border border-[#7c3aed]/30 px-2 py-0.5 rounded-full">
            PRO
          </span>
        </div>
      </div>
    </aside>
  )
}
