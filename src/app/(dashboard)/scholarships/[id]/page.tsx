'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, Globe, GraduationCap, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { daysUntil, formatDate } from '@/lib/utils'
import type { Scholarship } from '@/types/scholarship'

export default function ScholarshipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [scholarship, setScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch('/api/saved-scholarships')
      .then(r => r.json())
      .then(data => {
        const found = (data.scholarships || []).find((s: Scholarship) => s.id === id)
        if (found) setScholarship(found)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStartApplication() {
    if (!scholarship) return
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scholarship_id: scholarship.id,
        scholarship_title: scholarship.title,
        deadline: scholarship.deadline,
        essay_prompt: '',
        word_limit: 650,
      }),
    })
    router.push('/applications')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    )
  }

  if (notFound || !scholarship) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-white font-medium mb-2">Scholarship not found</p>
        <p className="text-[#71717a] text-sm mb-6">This scholarship may have been removed from your saved list.</p>
        <Button onClick={() => router.push('/scholarships')}>
          <ArrowLeft className="h-4 w-4" /> Back to Saved
        </Button>
      </div>
    )
  }

  const days = daysUntil(scholarship.deadline)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/scholarships')}>
          <ArrowLeft className="h-4 w-4" /> Back to Saved
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{scholarship.title}</h1>
            <div className="flex items-center gap-3 text-sm text-[#a1a1aa]">
              <span>{scholarship.provider}</span>
              <span>·</span>
              <span>{scholarship.country}</span>
            </div>
          </div>
          {scholarship.match_score != null && (
            <Badge variant={scholarship.match_score >= 70 ? 'success' : 'warning'} className="text-lg px-4 py-1.5">
              {scholarship.match_score}% Match
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-3">About This Scholarship</h2>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{scholarship.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-3">Eligibility Requirements</h2>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{scholarship.eligibility}</p>
            </CardContent>
          </Card>

          {scholarship.match_reason && (
            <Card className="border-green-600/20 bg-green-600/5">
              <CardContent className="p-6">
                <h2 className="font-semibold text-green-400 mb-2">Why You Match</h2>
                <p className="text-sm text-[#a1a1aa]">{scholarship.match_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-[#71717a]">Award Amount</p>
                  <p className="text-sm font-semibold text-green-400">{scholarship.amount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-[#71717a]">Deadline</p>
                  <p className="text-sm font-semibold text-white">{formatDate(scholarship.deadline)}</p>
                  <p className={`text-xs ${days < 30 ? 'text-red-400' : 'text-[#a1a1aa]'}`}>{days} days remaining</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-[#71717a]">Study Country</p>
                  <p className="text-sm font-semibold text-white">{scholarship.country}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-purple-500" />
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

          {/* Countdown */}
          <Card className={days < 30 ? 'border-red-500/30' : 'border-green-600/20'}>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-[#71717a] mb-1">Application closes in</p>
              <p className={`text-3xl font-bold mb-1 ${days < 30 ? 'text-red-400' : 'text-green-400'}`}>{days}</p>
              <p className="text-xs text-[#71717a]">days</p>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" onClick={handleStartApplication}>
            Start Application <ArrowRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="w-full" onClick={() => window.open(scholarship.url, '_blank')}>
            Visit Official Website
          </Button>
        </div>
      </div>
    </div>
  )
}
