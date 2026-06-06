'use client'

import React, { useState, useEffect } from 'react'
import { Search, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard'
import { FilterBar } from '@/components/scholarships/FilterBar'
import { daysUntil } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'
import type { Profile } from '@/types/profile'

const DEFAULT_FILTERS = {
  degree_level: 'all',
  field_of_study: '',
  country: '',
  deadline_range: 'all',
}

export default function SearchPage() {
  const router = useRouter()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<Partial<Profile> | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()).then(d => d.profile || null),
      fetch('/api/saved-scholarships').then(r => r.json()).then(d => {
        const ids = (d.scholarships || []).map((s: Scholarship) => s.id)
        setSavedIds(new Set(ids))
      }).catch(() => {}),
    ]).then(([p]) => {
      setProfile(p)
    }).catch(() => {}).finally(() => setProfileLoading(false))
  }, [])

  const profileEmpty = !profile || (!profile.field_of_study && !profile.degree_level)

  async function handleSearch() {
    if (profileEmpty) return
    setLoading(true)
    setSearched(true)
    setError(null)
    try {
      const res = await fetch('/api/scholarships/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, filters }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Search failed. Please try again.')
        setScholarships([])
        return
      }
      const data = await res.json()
      setScholarships(data.scholarships || [])
    } catch {
      setError('Network error. Please check your connection and try again.')
      setScholarships([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(id: string) {
    const scholarship = scholarships.find(s => s.id === id)
    if (!scholarship) return
    const alreadySaved = savedIds.has(id)
    if (alreadySaved) {
      await fetch('/api/saved-scholarships', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarshipId: id }),
      })
      setSavedIds(prev => { const next = new Set(prev); next.delete(id); return next })
    } else {
      await fetch('/api/saved-scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarship }),
      })
      setSavedIds(prev => new Set([...prev, id]))
    }
  }

  function handleView(id: string) {
    router.push(`/scholarships/${id}`)
  }

  const filtered = scholarships.filter(s => {
    if (filters.degree_level !== 'all' && !s.degree_levels.includes(filters.degree_level)) return false
    if (filters.field_of_study && !s.fields_of_study.some(f => f.toLowerCase().includes(filters.field_of_study.toLowerCase()))) return false
    if (filters.country && !s.country.toLowerCase().includes(filters.country.toLowerCase())) return false
    if (filters.deadline_range !== 'all') {
      const days = daysUntil(s.deadline)
      if (days > parseInt(filters.deadline_range)) return false
    }
    return true
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Find Scholarships</h1>
        <p className="text-[#a1a1aa] text-sm">AI searches and ranks scholarships matched to your profile</p>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-6 rounded-xl bg-[#111111] border border-[#1f1f1f]">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Find Scholarships For Me</h2>
          <p className="text-sm text-[#a1a1aa]">
            Claude + Tavily will search hundreds of scholarships and rank them by your match score.
          </p>
        </div>

        {!profileLoading && profileEmpty ? (
          <div className="text-center py-4">
            <p className="text-yellow-400 text-sm mb-3">Complete your profile to get personalized scholarship matches.</p>
            <Link href="/profile">
              <Button variant="outline">Complete Your Profile</Button>
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button size="lg" onClick={handleSearch} disabled={loading || profileLoading} className="gap-2 px-10">
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Searching...</>
              ) : (
                <><Sparkles className="h-5 w-5" /> Find My Scholarships</>
              )}
            </Button>
          </div>
        )}

        {searched && (
          <p className="text-center text-xs text-[#71717a] mt-3">
            Powered by Claude AI + Tavily Search
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-[#111111] border border-[#1f1f1f] animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#a1a1aa]">
              {filtered.length} scholarship{filtered.length !== 1 ? 's' : ''} found
            </p>
            {profile?.field_of_study && (
              <p className="text-xs text-[#71717a]">Matched for: {profile.field_of_study} · {profile.degree_level}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(scholarship => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                onSave={handleSave}
                onView={handleView}
                saved={savedIds.has(scholarship.id)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#71717a]">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-white font-medium mb-2">No scholarships found</p>
              <p className="text-sm">Try clearing some filters or searching again.</p>
            </div>
          )}
        </>
      )}

      {!loading && !searched && (
        <div className="text-center py-20 text-[#71717a]">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-white font-medium mb-2">Ready to find scholarships</p>
          <p className="text-sm">Click &ldquo;Find My Scholarships&rdquo; to search with your profile.</p>
        </div>
      )}
    </div>
  )
}
