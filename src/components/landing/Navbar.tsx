'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a2a2a] backdrop-blur-md bg-[#0d0d0d]/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-white font-bold text-lg">TradeZella</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">Features</Link>
          <Link href="#pricing" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">Pricing</Link>
          <Link href="#" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">Blog</Link>
          <Link href="#testimonials" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">Reviews</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">Login</Link>
          <Link
            href="/dashboard"
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  )
}
