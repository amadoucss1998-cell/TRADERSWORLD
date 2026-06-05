'use client'

import React, { useState, useEffect } from 'react'
import { Search, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard'
import { FilterBar } from '@/components/scholarships/FilterBar'
import type { Scholarship } from '@/types/scholarship'
import type { Profile } from '@/types/profile'

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
    description: 'The Mastercard Foundation Scholars Program partners with leading universities globally to provide scholarships to young Africans.',
    url: 'https://mastercardfdn.org/scholars',
    source: 'Mock',
    match_score: 92,
    match_reason: 'Excellent match: open to West African students including Liberia, aligns with your field and financial need criteria.',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Commonwealth Scholarship Commission',
    provider: 'UK Government',
    country: 'United Kingdom',
    amount: '$25,000/year',
    deadline: '2026-04-10',
    degree_levels: ['masters', 'phd'],
    fields_of_study: ['All Fields'],
    eligibility: 'Citizens of Commonwealth nations including Liberia',
    description: 'Commonwealth Scholarships are for candidates from low and middle income Commonwealth countries.',
    url: 'https://cscuk.fcdo.gov.uk',
    source: 'Mock',
    match_score: 87,
    match_reason: 'Strong match: Liberia is a Commonwealth nation. Fully funded with stipend.',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'DAAD Scholarship for Developing Countries',
    provider: 'German Academic Exchange Service',
    country: 'Germany',
    amount: '€934/month',
    deadline: '2026-02-28',
    degree_levels: ['masters', 'phd'],
    fields_of_study: ['Engineering', 'Science', 'Social Sciences'],
    eligibility: 'Students from developing countries with strong academic record',
    description: 'DAAD offers a wide variety of scholarship programs for international students to study in Germany.',
    url: 'https://daad.de',
    source: 'Mock',
    match_score: 78,
    match_reason: 'Good match: open to West African students, monthly stipend plus travel allowance.',
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
    eligibility: 'Liberian citizens with leadership potential, 2+ years work experience',
    description: 'Chevening is the UK government\'s international awards programme for future leaders.',
    url: 'https://chevening.org',
    source: 'Mock',
    match_score: 85,
    match_reason: 'Excellent match: specifically open to Liberian citizens. Covers full tuition, living costs, flights.',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Fulbright Foreign Student Program',
    provider: 'US Government',
    country: 'United States',
    amount: '$35,000/year',
    deadline: '2026-05-20',
    degree_levels: ['masters', 'phd'],
    fields_of_study: ['All Fields'],
    eligibility: 'Liberian and West African citizens with academic excellence',
    description: 'The Fulbright Program is the flagship international educational exchange program sponsored by the U.S. government.',
    url: 'https://fulbrightprogram.org',
    source: 'Mock',
    match_score: 80,
    match_reason: 'Strong match: Liberia has active Fulbright program. Full funding including living stipend.',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'African Development Bank Scholarship',
    provider: 'African Development Bank',
    country: 'Various Countries',
    amount: '$20,000/year',
    deadline: '2026-03-31',
    degree_levels: ['masters'],
    fields_of_study: ['Economics', 'Finance', 'Development Studies', 'Agriculture'],
    eligibility: 'African nationals under 35 years, working in development sector',
    description: 'AfDB scholarship program for young professionals working in African development.',
    url: 'https://afdb.org/scholarships',
    source: 'Mock',
    match_score: 65,
    match_reason: 'Moderate match: open to Liberian nationals, focused on development-related fields.',
    created_at: new Date().toISOString(),
  },
]

const DEFAULT_FILTERS = {
  degree_level: 'all',
  field_of_study: '',
  country: '',
  deadline_range: 'all',
}

export default function SearchPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(MOCK_SCHOLARSHIPS)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<Partial<Profile> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('scholarpath_profile')
    if (saved) setProfile(JSON.parse(saved))
    const savedScholarships = localStorage.getItem('scholarpath_saved')
    if (savedScholarships) setSavedIds(new Set(JSON.parse(savedScholarships)))
  }, [])

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch('/api/scholarships/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profile || { field_of_study: 'General', degree_level: 'undergraduate', nationality: 'Liberian', gpa: 3.0 },
          filters,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.scholarships?.length > 0) {
          setScholarships(data.scholarships)
        } else {
          // Keep mock data if API returns empty
          setScholarships(MOCK_SCHOLARSHIPS)
        }
      }
    } catch {
      // Keep mock data on error
      setScholarships(MOCK_SCHOLARSHIPS)
    } finally {
      setLoading(false)
    }
  }

  function handleSave(id: string) {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('scholarpath_saved', JSON.stringify([...next]))
      return next
    })
  }

  function handleView(id: string) {
    window.location.href = `/scholarships/${id}`
  }

  const filtered = scholarships.filter(s => {
    if (filters.degree_level !== 'all' && !s.degree_levels.includes(filters.degree_level)) return false
    if (filters.field_of_study && !s.fields_of_study.some(f => f.toLowerCase().includes(filters.field_of_study.toLowerCase()))) return false
    if (filters.country && !s.country.toLowerCase().includes(filters.country.toLowerCase())) return false
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
          <h2 className="text-lg font-semibold text-white mb-2">🔍 Find Scholarships For Me</h2>
          <p className="text-sm text-[#a1a1aa]">
            Claude + Tavily will search hundreds of scholarships and rank them by your match score.
            {!profile && ' Complete your profile first for better matches.'}
          </p>
        </div>
        <div className="flex justify-center">
          <Button size="lg" onClick={handleSearch} disabled={loading} className="gap-2 px-10">
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Searching...</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Find My Scholarships</>
            )}
          </Button>
        </div>
        {searched && (
          <p className="text-center text-xs text-[#71717a] mt-3">
            Powered by Claude AI + Tavily Search
          </p>
        )}
      </div>

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
      {!loading && (
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
              <p>No scholarships match your filters. Try clearing some filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
