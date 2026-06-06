'use client'

import React, { useState, useEffect } from 'react'
import { Bookmark, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, daysUntil, cn } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

export default function SavedScholarshipsPage() {
  const router = useRouter()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/saved-scholarships')
      .then(r => r.json())
      .then(data => setScholarships(data.scholarships || []))
      .catch(() => setError('Failed to load saved scholarships.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(id: string) {
    await fetch('/api/saved-scholarships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarshipId: id }),
    })
    setScholarships(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Scholarships</h1>
          <p className="text-[#a1a1aa] text-sm">{loading ? 'Loading...' : `${scholarships.length} saved scholarships`}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/search')}>
          <Bookmark className="h-4 w-4" /> Find More
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

      {!loading && !error && scholarships.length === 0 && (
        <div className="text-center py-20 text-[#71717a]">
          <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-white font-medium mb-2">No saved scholarships yet</p>
          <p className="text-sm mb-6">Search for scholarships to save them.</p>
          <Button onClick={() => router.push('/search')}>Find Scholarships</Button>
        </div>
      )}

      {!loading && scholarships.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scholarships.map(s => {
            const days = daysUntil(s.deadline)
            return (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight">{s.title}</h3>
                      <p className="text-xs text-[#71717a] mt-1">{s.provider} · {s.country}</p>
                    </div>
                    {s.match_score != null && (
                      <Badge variant={s.match_score >= 70 ? 'success' : 'warning'}>{s.match_score}%</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#a1a1aa] mb-4">
                    <span className="text-green-400 font-medium">{s.amount}</span>
                    <span className={cn(days < 14 ? 'text-red-400' : days < 30 ? 'text-yellow-400' : '')}>
                      Due {formatDate(s.deadline)} ({days}d)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRemove(s.id)}>
                      Remove
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => router.push(`/scholarships/${s.id}`)}>
                      Apply Now <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
