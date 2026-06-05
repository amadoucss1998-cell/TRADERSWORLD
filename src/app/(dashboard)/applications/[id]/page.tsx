'use client'

import React, { useState, useEffect, use } from 'react'
import { ArrowLeft, Save, Clock, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EssayEditor } from '@/components/editor/EssayEditor'
import { AIPanel } from '@/components/editor/AIPanel'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Application } from '@/types/application'
import type { EssayVersion } from '@/types/application'
import type { Profile } from '@/types/profile'

const MOCK_APPLICATIONS: Record<string, Application> = {
  '1': {
    id: '1',
    user_id: 'user1',
    scholarship_id: '1',
    scholarship: {
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
      created_at: new Date().toISOString(),
    },
    status: 'drafting',
    deadline: '2026-03-15',
    essay_prompt: 'How will this scholarship help you achieve your academic and professional goals, and how do you plan to give back to your community in Africa?',
    essay_draft: 'Growing up in Monrovia, Liberia, I witnessed firsthand the transformative power of education. As the first in my family to pursue higher education, every textbook, every lecture, every examination has been a stepping stone toward a larger dream — to return home as a catalyst for change.\n\nThe MasterCard Foundation Scholars Program represents more than financial support; it is an investment in the future of West Africa. My goal to study Computer Science at a world-class institution is not merely personal ambition. It is a commitment to bridge the digital divide that continues to widen across the African continent.\n\nDuring my time at the University of Liberia, I co-founded the Monrovia Code Academy, a free after-school program that has taught basic programming to over 200 students from underprivileged backgrounds. This experience solidified my belief that technology education is the most powerful equalizer in our time.\n\nWith this scholarship, I will pursue a Masters in Computer Science, specializing in AI applications for development challenges. Upon completing my studies, I am committed to returning to Liberia to establish a technology hub that connects young Liberian developers with global opportunities while solving local problems.\n\nThe Foundation\'s commitment to developing ethical leaders who give back aligns perfectly with my values. I am not seeking an escape from Liberia — I am seeking the tools to transform it.',
    essay_version: 2,
    word_limit: 650,
    notes: '',
    documents: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const DEFAULT_PROFILE: Partial<Profile> = {
  full_name: 'John Student',
  email: 'john@example.com',
  nationality: 'Liberian',
  gpa: 3.7,
  degree_level: 'undergraduate',
  field_of_study: 'Computer Science',
  current_institution: 'University of Liberia',
  graduation_year: 2025,
  english_proficiency: 'fluent',
  achievements: 'Founded Monrovia Code Academy, Dean\'s List 3 consecutive semesters',
  work_experience: 'Software intern at Liberia Telecom, 6 months',
  extracurriculars: ['Chess Club', 'Student Council', 'Tech Mentorship Program'],
  personal_statement: 'I want to use technology to develop Liberia and solve African challenges.',
  financial_need: true,
}

export default function ApplicationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const app = MOCK_APPLICATIONS[id] || MOCK_APPLICATIONS['1']
  const [essay, setEssay] = useState(app.essay_draft)
  const [profile, setProfile] = useState<Partial<Profile>>(DEFAULT_PROFILE)
  const [versions, setVersions] = useState<EssayVersion[]>([
    { id: '1', application_id: app.id, version: 1, content: 'First draft...', saved_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', application_id: app.id, version: 2, content: app.essay_draft, saved_at: new Date().toISOString() },
  ])
  const [showVersions, setShowVersions] = useState(false)
  const [saving, setSaving] = useState(false)
  const days = daysUntil(app.deadline)

  useEffect(() => {
    const saved = localStorage.getItem('scholarpath_profile')
    if (saved) setProfile(JSON.parse(saved))
  }, [])

  function handleSaveDraft() {
    setSaving(true)
    const newVersion: EssayVersion = {
      id: crypto.randomUUID(),
      application_id: app.id,
      version: versions.length + 1,
      content: essay,
      saved_at: new Date().toISOString(),
    }
    setVersions(prev => [...prev, newVersion])
    setTimeout(() => setSaving(false), 1000)
  }

  function handleUseEssay(text: string) {
    setEssay(text)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] p-4 flex items-center justify-between bg-[#111111]">
        <div className="flex items-center gap-4">
          <Link href="/applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white line-clamp-1">{app.scholarship?.title}</h1>
            <div className="flex items-center gap-2 text-xs text-[#71717a]">
              <span>{app.scholarship?.provider}</span>
              <span>·</span>
              <span className={days < 30 ? 'text-red-400' : 'text-[#a1a1aa]'}>
                Due {formatDate(app.deadline)} ({days}d)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'secondary'}>
            {app.status}
          </Badge>
          <Button size="sm" onClick={handleSaveDraft} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Scholarship info */}
        <div className="w-72 border-r border-[#1f1f1f] overflow-y-auto p-4 space-y-4 bg-[#0d0d0d]">
          <div>
            <p className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Essay Prompt</p>
            <div className="bg-[#111111] rounded-md p-3 border border-[#1f1f1f]">
              <p className="text-xs text-white leading-relaxed">{app.essay_prompt}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Requirements</p>
            <div className="space-y-2 text-xs text-[#a1a1aa]">
              <div className="flex justify-between">
                <span>Word limit</span>
                <span className="text-white">{app.word_limit}</span>
              </div>
              <div className="flex justify-between">
                <span>Deadline</span>
                <span className={days < 30 ? 'text-red-400' : 'text-white'}>{formatDate(app.deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-white capitalize">{app.status}</span>
              </div>
            </div>
          </div>

          {/* Version history */}
          <div>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center justify-between w-full text-xs text-[#71717a] uppercase tracking-wider mb-2"
            >
              <span>Version History ({versions.length})</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showVersions ? 'rotate-180' : ''}`} />
            </button>
            {showVersions && (
              <div className="space-y-2">
                {versions.slice().reverse().map(v => (
                  <button
                    key={v.id}
                    onClick={() => setEssay(v.content)}
                    className="w-full text-left bg-[#111111] rounded p-2 border border-[#1f1f1f] hover:border-green-600/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[#71717a]" />
                      <span className="text-xs text-white">Version {v.version}</span>
                    </div>
                    <p className="text-xs text-[#71717a] mt-1">
                      {new Date(v.saved_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Essay editor + AI panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <EssayEditor
            content={essay}
            onChange={setEssay}
            wordLimit={app.word_limit}
            autoSave={true}
          />

          <AIPanel
            profile={profile as Record<string, unknown>}
            scholarshipName={app.scholarship?.title || ''}
            provider={app.scholarship?.provider || ''}
            scholarshipDescription={app.scholarship?.description || ''}
            essayPrompt={app.essay_prompt}
            wordLimit={app.word_limit}
            currentEssay={essay}
            onUseEssay={handleUseEssay}
          />
        </div>
      </div>
    </div>
  )
}
