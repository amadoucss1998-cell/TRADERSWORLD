'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/tracker/KanbanBoard'
import type { Application } from '@/types/application'

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(data => setApplications(data.applications || []))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id: string, status: Application['status']) {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  function handleCardClick(id: string) {
    router.push(`/applications/${id}`)
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Application Tracker</h1>
          <p className="text-[#a1a1aa] text-sm">Manage all your scholarship applications. Drag cards to update status.</p>
        </div>
        <Button onClick={() => router.push('/search')}>
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <KanbanBoard
          applications={applications}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  )
}
