'use client'

import React from 'react'
import { use } from 'react'
import { ArrowLeft, Calendar, DollarSign, Globe, GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { daysUntil, formatDate } from '@/lib/utils'

// Mock data for demo
const MOCK_SCHOLARSHIPS: Record<string, {
  id: string; title: string; provider: string; country: string; amount: string;
  deadline: string; degree_levels: string[]; fields_of_study: string[]; eligibility: string;
  description: string; url: string; match_score: number; match_reason: string;
}> = {
  '1': {
    id: '1',
    title: 'MasterCard Foundation Scholars Program',
    provider: 'MasterCard Foundation',
    country: 'Various Countries',
    amount: 'Full Funding (tuition + living + travel)',
    deadline: '2026-03-15',
    degree_levels: ['undergraduate', 'masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'African students with demonstrated leadership potential, financial need, and commitment to giving back to Africa.',
    description: 'The Mastercard Foundation Scholars Program partners with leading universities globally to provide scholarships to young Africans who demonstrate academic excellence, leadership potential, and financial need. Scholars receive comprehensive support including academic mentoring, leadership development, and career services.',
    url: 'https://mastercardfdn.org/scholars',
    match_score: 92,
    match_reason: 'Excellent match: open to West African students including Liberia, aligns with financial need and leadership criteria.',
  },
  '4': {
    id: '4',
    title: 'Chevening Scholarships',
    provider: 'UK Foreign Commonwealth Office',
    country: 'United Kingdom',
    amount: 'Full Funding (tuition + living + flights + visa)',
    deadline: '2026-11-05',
    degree_levels: ['masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'Liberian citizens with at least 2 years of work experience, leadership qualities, and commitment to return to Liberia.',
    description: 'Chevening is the UK government\'s international awards programme aimed at developing global leaders. Funded by the UK Foreign, Commonwealth and Development Office, Chevening Scholarships are awarded to individuals who demonstrate strong academic backgrounds, leadership skills, and the potential to become future leaders.',
    url: 'https://chevening.org',
    match_score: 85,
    match_reason: 'Excellent match: specifically open to Liberian citizens with leadership potential.',
  },
}

export default function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const scholarship = MOCK_SCHOLARSHIPS[id] || MOCK_SCHOLARSHIPS['1']
  const days = daysUntil(scholarship.deadline)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/scholarships">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Saved
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{scholarship.title}</h1>
            <div className="flex items-center gap-3 text-sm text-[#a1a1aa]">
              <span>{scholarship.provider}</span>
              <span>·</span>
              <span>🌍 {scholarship.country}</span>
            </div>
          </div>
          <Badge variant={scholarship.match_score >= 70 ? 'success' : 'warning'} className="text-lg px-4 py-1.5">
            {scholarship.match_score}% Match
          </Badge>
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

          <Button className="w-full gap-2" onClick={() => window.location.href = `/applications`}>
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
