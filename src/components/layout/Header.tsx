'use client'

import { useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import AddTradeModal from '@/components/journal/AddTradeModal'

interface HeaderProps {
  title: string
  breadcrumb?: string
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0d0d0d]/80 backdrop-blur border-b border-[#2a2a2a] h-16 flex items-center px-6 gap-4">
        <div className="flex-1">
          {breadcrumb && <p className="text-[#71717a] text-xs">{breadcrumb}</p>}
          <h1 className="text-white font-semibold text-lg">{title}</h1>
        </div>

        <button className="flex items-center gap-2 border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#a1a1aa] hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <CalendarDays className="w-4 h-4" />
          <span>Last 90 Days</span>
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Trade
        </button>
      </header>

      <AddTradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
