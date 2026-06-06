'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Bookmark, ChevronRight, Sparkles, User, Search, PenLine, Calendar, MapPin, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignUpModal } from './SignUpModal'
import { cn, formatDate, daysUntil } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

const SAMPLE_PROFILE = {
  full_name: 'Amara Kamara',
  degree_level: 'masters',
  field_of_study: 'Public Health',
  gpa: '3.8',
  nationality: 'Liberian',
}

const DEGREE_LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
]

type ModalReason = 'save' | 'second-essay' | 'full-results'

export function DemoSection() {
  // Step state: 1 = profile, 2 = results, 3 = essay
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [profile, setProfile] = useState({ full_name: '', degree_level: 'masters', field_of_study: '', gpa: '', nationality: 'Liberian' })
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null)
  const [essay, setEssay] = useState('')
  const [loading, setLoading] = useState(false)
  const [essayLoading, setEssayLoading] = useState(false)
  const [error, setError] = useState('')
  const [essayGenerated, setEssayGenerated] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; reason: ModalReason }>({ open: false, reason: 'save' })

  function prefill() {
    setProfile(SAMPLE_PROFILE)
  }

  async function handleSearch() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/demo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Search failed. Please try again.'); return }
      setScholarships(data.scholarships)
      setSelectedScholarship(data.scholarships[0] ?? null)
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateEssay(scholarship: Scholarship) {
    if (essayGenerated) { setModal({ open: true, reason: 'second-essay' }); return }
    setSelectedScholarship(scholarship)
    setEssay('')
    setEssayLoading(true)
    setStep(3)
    try {
      const res = await fetch('/api/demo/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scholarship }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Essay generation failed.')
        setStep(2)
        return
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setEssay(prev => prev + decoder.decode(value, { stream: true }))
      }
      setEssayGenerated(true)
    } finally {
      setEssayLoading(false)
    }
  }

  const scoreColor = (score: number) =>
    score >= 85 ? 'text-green-400' : score >= 70 ? 'text-yellow-400' : 'text-orange-400'

  const scoreRing = (score: number) =>
    score >= 85 ? 'border-green-500/40 bg-green-500/10' : score >= 70 ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-orange-500/40 bg-orange-500/10'

  const urgencyColor = (deadline: string) => {
    const d = daysUntil(deadline)
    if (d < 30) return 'danger'
    if (d < 60) return 'warning'
    return 'secondary'
  }

  return (
    <section id="demo" className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-600/30 bg-green-600/10 text-green-400 text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Try It Free — No Sign Up Required
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            See ScholarPath in Action
          </h2>
          <p className="text-[#a1a1aa] max-w-xl mx-auto">
            Enter your profile, get matched scholarships ranked by AI, then watch Claude write your essay in real time.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { n: 1, icon: User, label: 'Your Profile' },
            { n: 2, icon: Search, label: 'Matches Found' },
            { n: 3, icon: PenLine, label: 'Essay Written' },
          ].map(({ n, icon: Icon, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                step === n ? 'bg-green-600 text-white' : step > n ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-[#1a1a1a] text-[#71717a] border border-[#2a2a2a]'
              )}>
                <Icon className="h-3 w-3" />
                {label}
              </div>
              {i < 2 && <ChevronRight className="h-4 w-4 text-[#3a3a3a] flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Profile Form ── */}
        {step === 1 && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Quick Profile</h3>
              <button
                onClick={prefill}
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 border border-green-600/30 rounded-full px-3 py-1 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Use sample profile
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="e.g. Amara Kamara"
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#3a3a3a] text-sm focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Nationality</label>
                <input
                  type="text"
                  value={profile.nationality}
                  onChange={e => setProfile(p => ({ ...p, nationality: e.target.value }))}
                  placeholder="e.g. Liberian"
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#3a3a3a] text-sm focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Degree Level</label>
                <select
                  value={profile.degree_level}
                  onChange={e => setProfile(p => ({ ...p, degree_level: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-green-600 transition-colors appearance-none"
                >
                  {DEGREE_LEVELS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Field of Study</label>
                <input
                  type="text"
                  value={profile.field_of_study}
                  onChange={e => setProfile(p => ({ ...p, field_of_study: e.target.value }))}
                  placeholder="e.g. Public Health, Engineering"
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#3a3a3a] text-sm focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">GPA (out of 4.0)</label>
                <input
                  type="text"
                  value={profile.gpa}
                  onChange={e => setProfile(p => ({ ...p, gpa: e.target.value }))}
                  placeholder="e.g. 3.7"
                  className="w-full sm:w-48 h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#3a3a3a] text-sm focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={handleSearch}
                disabled={loading || !profile.field_of_study || !profile.gpa}
                className="gap-2 px-8"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching scholarships…</> : <><Search className="h-4 w-4" /> Find My Scholarships</>}
              </Button>
              <p className="text-xs text-[#71717a]">Powered by Claude AI + Tavily</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Results ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  4 scholarships matched for <span className="text-green-400">{profile.full_name || 'you'}</span>
                </h3>
                <p className="text-xs text-[#71717a] mt-0.5">Ranked by AI match score · Click any card to write your essay</p>
              </div>
              <button
                onClick={() => setModal({ open: true, reason: 'full-results' })}
                className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
              >
                See all results →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scholarships.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'bg-[#111111] border rounded-xl p-5 transition-all cursor-pointer hover:border-green-600/40 hover:bg-[#141414]',
                    selectedScholarship?.id === s.id ? 'border-green-600/50' : 'border-[#1f1f1f]'
                  )}
                  onClick={() => setSelectedScholarship(s)}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold', scoreRing(s.match_score))}>
                      <Trophy className="h-3 w-3" />
                      <span className={scoreColor(s.match_score)}>{s.match_score}% match</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setModal({ open: true, reason: 'save' }) }}
                      className="text-[#71717a] hover:text-green-400 transition-colors"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  <h4 className="font-semibold text-white text-sm leading-snug mb-1">{s.title}</h4>
                  <p className="text-xs text-[#71717a] mb-3">{s.provider}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs text-[#a1a1aa]">
                      <MapPin className="h-3 w-3" /> {s.country}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      💰 {s.amount}
                    </span>
                    <Badge variant={urgencyColor(s.deadline) as 'danger' | 'warning' | 'secondary'} className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {daysUntil(s.deadline)}d left
                    </Badge>
                  </div>

                  <p className="text-xs text-[#71717a] leading-relaxed mb-4 line-clamp-2">{s.match_reason}</p>

                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={e => { e.stopPropagation(); handleGenerateEssay(s) }}
                  >
                    <PenLine className="h-3 w-3" />
                    Write My Essay
                  </Button>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => { setStep(1); setScholarships([]); setError('') }}
                className="text-xs text-[#71717a] hover:text-white underline underline-offset-2 transition-colors"
              >
                ← Start over
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Essay ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Essay for <span className="text-green-400">{selectedScholarship?.title}</span>
                </h3>
                <p className="text-xs text-[#71717a] mt-0.5">Written by Claude AI · Tailored to your profile</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-[#71717a] hover:text-white transition-colors"
              >
                ← Back to results
              </button>
            </div>

            <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              {/* Essay header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Scholarship Essay Draft</span>
                  {essayLoading && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Writing…
                    </span>
                  )}
                  {!essayLoading && essay && (
                    <Badge variant="success" className="text-xs">Complete</Badge>
                  )}
                </div>
                {essay && (
                  <span className="text-xs text-[#71717a]">{essay.trim().split(/\s+/).length} words</span>
                )}
              </div>

              {/* Essay content */}
              <div className="p-6 min-h-[280px]">
                {essay ? (
                  <p className="text-[#e4e4e7] text-sm leading-relaxed whitespace-pre-wrap">{essay}</p>
                ) : (
                  <div className="flex items-center gap-3 text-[#71717a]">
                    <Loader2 className="h-5 w-5 animate-spin text-green-400" />
                    <span className="text-sm">Claude is writing your essay…</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!essayLoading && essay && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => window.location.href = '/register'}
                >
                  <Sparkles className="h-4 w-4" />
                  Save & Apply with Full Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => { setModal({ open: true, reason: 'second-essay' }) }}
                >
                  <PenLine className="h-4 w-4" />
                  Improve This Essay
                </Button>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}
      </div>

      {/* Sign-up modal */}
      <SignUpModal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        reason={modal.reason}
      />
    </section>
  )
}
