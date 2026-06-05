'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/tracker/KanbanBoard'
import type { Application } from '@/types/application'

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    user_id: 'user1',
    scholarship_id: '1',
    scholarship: {
      id: '1',
      title: 'MasterCard Foundation Scholars Program',
      provider: 'MasterCard Foundation',
      country: 'Various',
      amount: 'Full Funding',
      deadline: '2026-03-15',
      degree_levels: ['undergraduate', 'masters'],
      fields_of_study: ['All Fields'],
      eligibility: 'African students',
      description: 'MasterCard Foundation scholarship',
      url: 'https://mastercardfdn.org',
      source: 'Mock',
      match_score: 92,
      created_at: new Date().toISOString(),
    },
    status: 'drafting',
    deadline: '2026-03-15',
    essay_prompt: 'How will this scholarship help you achieve your goals and give back to Africa?',
    essay_draft: 'Growing up in Liberia, I witnessed firsthand the transformative power of education...',
    essay_version: 2,
    word_limit: 650,
    notes: 'Strong application, need to refine leadership section',
    documents: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user1',
    scholarship_id: '4',
    scholarship: {
      id: '4',
      title: 'Chevening Scholarships',
      provider: 'UK Foreign Commonwealth Office',
      country: 'United Kingdom',
      amount: 'Full Funding',
      deadline: '2026-11-05',
      degree_levels: ['masters'],
      fields_of_study: ['All Fields'],
      eligibility: 'Liberian citizens',
      description: 'Chevening scholarship',
      url: 'https://chevening.org',
      source: 'Mock',
      match_score: 85,
      created_at: new Date().toISOString(),
    },
    status: 'submitted',
    deadline: '2026-11-05',
    essay_prompt: 'Describe your leadership experience and vision for Liberia.',
    essay_draft: 'As the founder of the Monrovia Youth Tech Initiative, I have dedicated the past three years...',
    essay_version: 3,
    word_limit: 500,
    notes: 'Submitted on Oct 28. Waiting for response.',
    documents: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'user1',
    scholarship_id: '2',
    scholarship: {
      id: '2',
      title: 'Commonwealth Scholarship Commission',
      provider: 'UK Government',
      country: 'United Kingdom',
      amount: '$25,000/year',
      deadline: '2026-04-10',
      degree_levels: ['masters', 'phd'],
      fields_of_study: ['All Fields'],
      eligibility: 'Commonwealth citizens',
      description: 'Commonwealth scholarship',
      url: 'https://cscuk.fcdo.gov.uk',
      source: 'Mock',
      match_score: 87,
      created_at: new Date().toISOString(),
    },
    status: 'interview',
    deadline: '2026-04-10',
    essay_prompt: 'How will your studies contribute to the development of your home country?',
    essay_draft: 'Liberia stands at a critical juncture in its development journey...',
    essay_version: 4,
    word_limit: 750,
    notes: 'Interview scheduled for Feb 15th. Preparing for panel questions.',
    documents: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS)

  function handleStatusChange(id: string, status: Application['status']) {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  function handleCardClick(id: string) {
    window.location.href = `/applications/${id}`
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Application Tracker</h1>
          <p className="text-[#a1a1aa] text-sm">Manage all your scholarship applications. Drag cards to update status.</p>
        </div>
        <Button onClick={() => window.location.href = '/search'}>
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </div>

      <KanbanBoard
        applications={applications}
        onStatusChange={handleStatusChange}
        onCardClick={handleCardClick}
      />
    </div>
  )
}
