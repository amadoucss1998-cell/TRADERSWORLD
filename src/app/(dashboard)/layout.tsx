'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Search, Bookmark, FileText, FolderOpen, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; full_name: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SP'

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
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name ?? 'Loading…'}
              </p>
              <p className="text-xs text-[#71717a] truncate">{user?.email}</p>
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

        {/* Logout */}
        <div className="p-3 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[#a1a1aa] hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
