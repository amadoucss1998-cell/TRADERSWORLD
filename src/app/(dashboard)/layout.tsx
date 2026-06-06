'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Bookmark, FileText, FolderOpen, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/search', icon: LayoutDashboard },
  { label: 'Find Scholarships', href: '/search', icon: Search },
  { label: 'My Scholarships', href: '/scholarships', icon: Bookmark },
  { label: 'Applications', href: '/applications', icon: FileText },
  { label: 'Documents', href: '/documents', icon: FolderOpen },
  { label: 'Settings', href: '/profile', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [plan] = useState('free')

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-[#111111] border-r border-[#1f1f1f] flex flex-col z-40">
        {/* Logo */}
        <div className="p-4 border-b border-[#1f1f1f]">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-white">ScholarPath</span>
          </Link>
        </div>

        {/* User */}
        <div className="p-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Student</p>
              <Badge variant="success" className="text-xs mt-0.5">Free</Badge>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                pathname === item.href
                  ? 'bg-green-600/10 text-green-400 border border-green-600/20'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f1f]'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
