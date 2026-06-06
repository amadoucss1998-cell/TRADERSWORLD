'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { ArrowLeft, Save, Clock, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EssayEditor } from '@/components/editor/EssayEditor'
import { AIPanel } from '@/components/editor/AIPanel'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Application } from '@/types/application'
import type { EssayVersion } from '@/types/application'
import type { Profile } from '@/types/profile'

export default function ApplicationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [app, setApp] = useState<Application | null>(null)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [essay, setEssay] = useState('')
  const [versions, setVersions] = useState<EssayVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/applications/${id}`).then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([appData, profileData]) => {
      if (appData.error) { setError('Application not found.'); return }
      const a = appData.application as Application
      setApp(a)
      setEssay(a.essay_draft || '')
      if (a.essay_draft) {
        setVersions([{ id: '1', application_id: a.id, version: 1, content: a.essay_draft, saved_at: a.updated_at }])
      }
      if (profileData.profile) setProfile(profileData.profile)
    }).catch(() => setError('Failed to load application.')).finally(() => setLoading(false))
  }, [id])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!app) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      patchApplication({ essay_draft: essay })
    }, 30000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [essay, app])

  async function patchApplication(fields: Record<string, unknown>) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  }

  async function handleSaveDraft() {
    if (!app) return
    setSaving(true)
    await patchApplication({ essay_draft: essay })
    const newVersion: EssayVersion = {
      id: crypto.randomUUID(),
      application_id: app.id,
      version: versions.length + 1,
      content: essay,
      saved_at: new Date().toISOString(),
    }
    setVersions(prev => [newVersion, ...prev])
    setSaving(false)
  }

  function handleUseEssay(text: string) {
    setEssay(text)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-white font-medium mb-4">{error || 'Application not found'}</p>
        <Link href="/applications"><Button><ArrowLeft className="h-4 w-4" /> Back to Applications</Button></Link>
      </div>
    )
  }

  const days = daysUntil(app.deadline)

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
            <h1 className="text-sm font-semibold text-white line-clamp-1">{app.scholarship?.title || app.scholarship_title}</h1>
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
              <p className="text-xs text-white leading-relaxed">{app.essay_prompt || 'No prompt specified.'}</p>
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
                {versions.length === 0 && (
                  <p className="text-xs text-[#71717a]">No saved versions yet. Save a draft to create a version.</p>
                )}
                {versions.map(v => (
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
            scholarshipName={app.scholarship?.title || app.scholarship_title || ''}
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
