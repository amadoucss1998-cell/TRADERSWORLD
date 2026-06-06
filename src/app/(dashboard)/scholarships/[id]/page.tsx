'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, DollarSign, Globe, GraduationCap,
  ExternalLink, PenLine, Loader2, CheckCircle, BookOpen, ClipboardList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { daysUntil, formatDate } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

const HOW_TO_APPLY_STEPS = [
  { icon: BookOpen, title: 'Read the requirements', desc: 'Review eligibility criteria, required documents, and deadlines carefully.' },
  { icon: ClipboardList, title: 'Gather documents', desc: 'Prepare transcripts, recommendation letters, CV, and proof of nationality.' },
  { icon: PenLine, title: 'Write your essay', desc: 'Use ScholarPath to generate and refine a personalized application essay.' },
  { icon: ExternalLink, title: 'Submit your application', desc: 'Apply through the official scholarship website before the deadline.' },
]

export default function ScholarshipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [scholarship, setScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingApp, setCreatingApp] = useState(false)

  useEffect(() => {
    // 1. Check sessionStorage first (set when viewing from search results)
    const cached = sessionStorage.getItem(`sp_scholarship_${id}`)
    if (cached) {
      try {
        setScholarship(JSON.parse(cached))
        setLoading(false)
        return
      } catch {}
    }

    // 2. Fall back to saved scholarships API
    fetch('/api/saved-scholarships')
      .then(r => r.json())
      .then(data => {
        const found = (data.scholarships || []).find((s: Scholarship) => s.id === id)
        if (found) {
          setScholarship(found)
          // Cache it for next time
          sessionStorage.setItem(`sp_scholarship_${id}`, JSON.stringify(found))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function handleStartApplication() {
    if (!scholarship) return
    setCreatingApp(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scholarship_id: scholarship.id,
          scholarship_title: scholarship.title,
          deadline: scholarship.deadline,
          essay_prompt: `Why do you deserve the ${scholarship.title} and how will it help you achieve your goals?`,
          word_limit: 500,
        }),
      })
      const data = await res.json()
      const appId = data.application?.id
      if (appId) router.push(`/applications/${appId}`)
      else router.push('/applications')
    } catch {
      router.push('/applications')
    } finally {
      setCreatingApp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    )
  }

  if (!scholarship) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-white font-medium mb-2">Scholarship not found</p>
        <p className="text-[#71717a] text-sm mb-6">Go back to search and click View on a scholarship.</p>
        <Button onClick={() => router.push('/search')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
        </Button>
      </div>
    )
  }

  const days = daysUntil(scholarship.deadline)

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{scholarship.title}</h1>
          <p className="text-[#a1a1aa] text-sm">{scholarship.provider} · {scholarship.country}</p>
        </div>
        {scholarship.match_score != null && (
          <Badge variant={scholarship.match_score >= 70 ? 'success' : 'warning'} className="text-base px-4 py-1.5 shrink-0">
            {scholarship.match_score}% Match
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-3">About This Scholarship</h2>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{scholarship.description}</p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-3">Eligibility Requirements</h2>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{scholarship.eligibility}</p>
            </CardContent>
          </Card>

          {/* Why you match */}
          {scholarship.match_reason && (
            <Card className="border-green-600/20 bg-green-600/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <h2 className="font-semibold text-green-400">Why You Match</h2>
                </div>
                <p className="text-sm text-[#a1a1aa]">{scholarship.match_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* How to Apply */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-5">How to Apply</h2>
              <div className="space-y-4">
                {HOW_TO_APPLY_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-400">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white mb-0.5">{step.title}</p>
                      <p className="text-xs text-[#a1a1aa]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#1f1f1f] flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 gap-2" onClick={handleStartApplication} disabled={creatingApp}>
                  {creatingApp
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                    : <><PenLine className="h-4 w-4" /> Write My Essay with AI</>
                  }
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(scholarship.url, '_blank')}>
                  <ExternalLink className="h-4 w-4" /> Official Application Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick facts */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-[#71717a]">Award Amount</p>
                  <p className="text-sm font-semibold text-green-400">{scholarship.amount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-xs text-[#71717a]">Deadline</p>
                  <p className="text-sm font-semibold text-white">{formatDate(scholarship.deadline)}</p>
                  <p className={`text-xs ${days < 30 ? 'text-red-400' : 'text-[#a1a1aa]'}`}>{days} days left</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-[#71717a]">Study Country</p>
                  <p className="text-sm font-semibold text-white">{scholarship.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-purple-500 shrink-0" />
                <div>
                  <p className="text-xs text-[#71717a]">Degree Levels</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scholarship.degree_levels.map(d => (
                      <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deadline countdown */}
          <Card className={days < 30 ? 'border-red-500/30 bg-red-500/5' : 'border-green-600/20 bg-green-600/5'}>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-[#71717a] mb-1">Application closes in</p>
              <p className={`text-4xl font-bold mb-1 ${days < 30 ? 'text-red-400' : 'text-green-400'}`}>{days}</p>
              <p className="text-xs text-[#71717a]">days</p>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Button className="w-full gap-2" onClick={handleStartApplication} disabled={creatingApp}>
            <PenLine className="h-4 w-4" />
            Write My Essay with AI
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => window.open(scholarship.url, '_blank')}>
            <ExternalLink className="h-4 w-4" />
            Official Website
          </Button>
        </div>
      </div>
    </div>
  )
}
