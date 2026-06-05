'use client'

import React, { useState, useEffect } from 'react'
import { Bookmark, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, daysUntil, cn } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

// We use the same mock data as search page for demo
const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: '1',
    title: 'MasterCard Foundation Scholars Program',
    provider: 'MasterCard Foundation',
    country: 'Various Countries',
    amount: 'Full Funding',
    deadline: '2026-03-15',
    degree_levels: ['undergraduate', 'masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'African students with leadership potential and financial need',
    description: 'The Mastercard Foundation Scholars Program partners with leading universities globally.',
    url: 'https://mastercardfdn.org/scholars',
    source: 'Mock',
    match_score: 92,
    match_reason: 'Excellent match: open to West African students including Liberia.',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Chevening Scholarships',
    provider: 'UK Foreign Commonwealth Office',
    country: 'United Kingdom',
    amount: 'Full Funding',
    deadline: '2026-11-05',
    degree_levels: ['masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'Liberian citizens with leadership potential',
    description: 'Chevening is the UK government\'s international awards programme for future leaders.',
    url: 'https://chevening.org',
    source: 'Mock',
    match_score: 85,
    match_reason: 'Excellent match: specifically open to Liberian citizens.',
    created_at: new Date().toISOString(),
  },
]

export default function SavedScholarshipsPage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    const saved = localStorage.getItem('scholarpath_saved')
    if (saved) setSavedIds(new Set(JSON.parse(saved)))
    const savedNotes = localStorage.getItem('scholarpath_notes')
    if (savedNotes) setNotes(JSON.parse(savedNotes))
  }, [])

  const savedScholarships = MOCK_SCHOLARSHIPS.filter(s => savedIds.has(s.id))

  function updateNote(id: string, note: string) {
    const updated = { ...notes, [id]: note }
    setNotes(updated)
    localStorage.setItem('scholarpath_notes', JSON.stringify(updated))
  }

  function unsave(id: string) {
    setSavedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      localStorage.setItem('scholarpath_saved', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Scholarships</h1>
          <p className="text-[#a1a1aa] text-sm">{savedScholarships.length} saved scholarships</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/search'}>
          <Bookmark className="h-4 w-4" /> Find More
        </Button>
      </div>

      {savedScholarships.length === 0 ? (
        <div className="text-center py-20 text-[#71717a]">
          <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-white font-medium mb-2">No saved scholarships yet</p>
          <p className="text-sm mb-6">Search for scholarships and save the ones you want to apply for.</p>
          <Button onClick={() => window.location.href = '/search'}>Find Scholarships</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {savedScholarships.map(s => {
            const days = daysUntil(s.deadline)
            return (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight">{s.title}</h3>
                      <p className="text-xs text-[#71717a] mt-1">{s.provider} · {s.country}</p>
                    </div>
                    <Badge variant={s.match_score >= 70 ? 'success' : 'warning'}>{s.match_score}%</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#a1a1aa] mb-3">
                    <span className="text-green-400 font-medium">{s.amount}</span>
                    <span className={cn(days < 14 ? 'text-red-400' : days < 30 ? 'text-yellow-400' : '')}>
                      Due {formatDate(s.deadline)} ({days}d)
                    </span>
                  </div>

                  <div className="mb-3">
                    <textarea
                      value={notes[s.id] || ''}
                      onChange={e => updateNote(s.id, e.target.value)}
                      placeholder="Add notes..."
                      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded text-xs text-[#a1a1aa] p-2 resize-none h-16 focus:outline-none focus:border-green-600/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => unsave(s.id)}>
                      Remove
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => window.location.href = `/scholarships/${s.id}`}>
                      Start Application <ArrowRight className="h-3.5 w-3.5" />
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
