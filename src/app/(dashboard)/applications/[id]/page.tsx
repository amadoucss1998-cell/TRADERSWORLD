'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, Save, Clock, ChevronDown, Loader2, Copy, Download,
  CheckCircle, ExternalLink, FileText, PenLine, User, ClipboardList,
  Send, X, Trophy, XCircle, RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EssayEditor } from '@/components/editor/EssayEditor'
import { AIPanel } from '@/components/editor/AIPanel'
import { formatDate, daysUntil } from '@/lib/utils'
import type { Application, EssayVersion } from '@/types/application'
import type { Profile } from '@/types/profile'

type AppStatus = 'draft' | 'submitted' | 'accepted' | 'rejected'

const STATUS_OPTIONS: { value: AppStatus; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { value: 'draft',     label: 'Draft',     icon: PenLine,   color: 'text-[#a1a1aa]', bg: 'bg-[#1f1f1f]',      border: 'border-[#2a2a2a]' },
  { value: 'submitted', label: 'Submitted', icon: Send,      color: 'text-blue-400',  bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  { value: 'accepted',  label: 'Accepted',  icon: Trophy,    color: 'text-green-400', bg: 'bg-green-500/10',   border: 'border-green-500/30' },
  { value: 'rejected',  label: 'Rejected',  icon: XCircle,   color: 'text-red-400',   bg: 'bg-red-500/10',     border: 'border-red-500/30' },
]

type Tab = 'essay' | 'cv' | 'cover_letter' | 'personal_statement' | 'checklist'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'essay', label: 'Essay', icon: PenLine },
  { id: 'cover_letter', label: 'Cover Letter', icon: FileText },
  { id: 'personal_statement', label: 'Personal Statement', icon: User },
  { id: 'cv', label: 'CV', icon: FileText },
  { id: 'checklist', label: 'Apply Checklist', icon: ClipboardList },
]

const CHECKLIST_ITEMS = [
  { doc: 'Application Essay', desc: 'Write using the Essay tab, then copy to the application portal' },
  { doc: 'Cover Letter', desc: 'Generate in the Cover Letter tab, download as .txt' },
  { doc: 'Personal Statement', desc: 'Generate in the Personal Statement tab, download as .txt' },
  { doc: 'Curriculum Vitae (CV)', desc: 'Generate in the CV tab or upload your own from Documents' },
  { doc: 'Academic Transcripts', desc: 'Official transcripts from your institution — upload in Documents' },
  { doc: 'Proof of Nationality', desc: 'Liberian passport or national ID — upload in Documents' },
  { doc: 'Recommendation Letters', desc: 'Request from professors or employers — upload in Documents' },
  { doc: 'Financial Need Statement', desc: 'Bank statement or financial need letter if required' },
]

export default function ApplicationEditorPage() {
  const params = useParams()
  const id = params.id as string
  const [app, setApp] = useState<Application | null>(null)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [essay, setEssay] = useState('')
  const [versions, setVersions] = useState<EssayVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('essay')
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, string>>({})
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [submittedDate, setSubmittedDate] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Load profile from localStorage first
    const localProfile = localStorage.getItem('sp_profile')
    if (localProfile) {
      try { setProfile(JSON.parse(localProfile)) } catch {}
    }

    fetch(`/api/applications/${id}`)
      .then(r => r.json())
      .then(appData => {
        if (appData.error) { setError('Application not found.'); return }
        const a = appData.application as Application
        setApp(a)
        setEssay(a.essay_draft || '')
        if (a.essay_draft) {
          setVersions([{ id: '1', application_id: a.id, version: 1, content: a.essay_draft, saved_at: a.updated_at }])
        }
      })
      .catch(() => setError('Failed to load application.'))
      .finally(() => setLoading(false))
  }, [id])

  // Auto-save essay every 30s
  useEffect(() => {
    if (!app) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => patchApplication({ essay_draft: essay }), 30000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [essay, app])

  async function patchApplication(fields: Record<string, unknown>) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  }

  async function updateStatus(newStatus: AppStatus) {
    if (!app) return
    setUpdatingStatus(true)
    const fields: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'submitted' && submittedDate) fields.deadline = submittedDate
    if (statusNote) fields.notes = statusNote
    await patchApplication(fields)
    setApp(prev => prev ? { ...prev, status: newStatus } : prev)
    setShowStatusModal(false)
    setStatusNote('')
    setSubmittedDate('')
    setUpdatingStatus(false)
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

  async function generateDocument(type: 'cv' | 'cover_letter' | 'personal_statement') {
    if (!app) return
    setGeneratingDoc(type)
    setGeneratedDocs(prev => ({ ...prev, [type]: '' }))

    const scholarship = {
      title: app.scholarship?.title || app.scholarship_title || '',
      provider: app.scholarship?.provider || '',
      description: app.scholarship?.description || '',
    }

    try {
      let res: Response
      if (type === 'cv') {
        res = await fetch('/api/cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, target_field: profile.field_of_study }),
        })
      } else {
        res = await fetch(`/api/applications/${id}/package`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, profile, scholarship }),
        })
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setGeneratedDocs(prev => ({ ...prev, [type]: (prev[type] || '') + chunk }))
      }
    } catch {
      setGeneratedDocs(prev => ({ ...prev, [type]: 'Failed to generate. Please check your API key.' }))
    } finally {
      setGeneratingDoc(null)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopySuccess(key)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  function downloadAsText(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleCheck(item: string) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#71717a]" /></div>
  if (error || !app) return (
    <div className="p-6 text-center py-20">
      <p className="text-white font-medium mb-4">{error || 'Application not found'}</p>
      <Link href="/applications"><Button><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
    </div>
  )

  const days = daysUntil(app.deadline)
  const scholarshipTitle = app.scholarship?.title || app.scholarship_title || 'Scholarship'
  const scholarshipUrl = app.scholarship?.url

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] px-4 py-3 flex items-center justify-between bg-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/applications">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white line-clamp-1">{scholarshipTitle}</h1>
            <p className={`text-xs ${days < 30 ? 'text-red-400' : 'text-[#71717a]'}`}>
              Due {formatDate(app.deadline)} · {days} days left
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80 ${
              app.status === 'accepted' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
              app.status === 'rejected' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
              app.status === 'submitted' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
              'text-[#a1a1aa] bg-[#1f1f1f] border-[#2a2a2a]'
            }`}
          >
            {app.status === 'accepted' && <Trophy className="h-3 w-3" />}
            {app.status === 'rejected' && <XCircle className="h-3 w-3" />}
            {app.status === 'submitted' && <Send className="h-3 w-3" />}
            {app.status === 'draft' && <PenLine className="h-3 w-3" />}
            {app.status}
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </button>
          {scholarshipUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(scholarshipUrl, '_blank')} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Apply on Website
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-4 shrink-0">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-[#71717a] hover:text-white'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">

        {/* Essay tab */}
        {activeTab === 'essay' && (
          <>
            <div className="w-64 border-r border-[#1f1f1f] overflow-y-auto p-4 space-y-4 bg-[#0d0d0d] shrink-0">
              <div>
                <p className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Essay Prompt</p>
                <div className="bg-[#111111] rounded-md p-3 border border-[#1f1f1f]">
                  <p className="text-xs text-white leading-relaxed">{app.essay_prompt || 'No prompt specified.'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#71717a] uppercase tracking-wider mb-2">Word Limit</p>
                <p className="text-sm text-white font-medium">{app.word_limit} words</p>
              </div>
              <div>
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="flex items-center justify-between w-full text-xs text-[#71717a] uppercase tracking-wider mb-2"
                >
                  <span>Versions ({versions.length})</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showVersions ? 'rotate-180' : ''}`} />
                </button>
                {showVersions && versions.map(v => (
                  <button key={v.id} onClick={() => setEssay(v.content)}
                    className="w-full text-left bg-[#111111] rounded p-2 border border-[#1f1f1f] hover:border-green-600/40 mb-1 transition-colors"
                  >
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[#71717a]" /><span className="text-xs text-white">v{v.version}</span></div>
                    <p className="text-xs text-[#71717a]">{new Date(v.saved_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
              <Button size="sm" className="w-full" onClick={handleSaveDraft} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" />{saving ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <EssayEditor content={essay} onChange={setEssay} wordLimit={app.word_limit} autoSave />
              <AIPanel
                profile={profile as Record<string, unknown>}
                scholarshipName={scholarshipTitle}
                provider={app.scholarship?.provider || ''}
                scholarshipDescription={app.scholarship?.description || ''}
                essayPrompt={app.essay_prompt}
                wordLimit={app.word_limit}
                currentEssay={essay}
                onUseEssay={setEssay}
              />
            </div>
          </>
        )}

        {/* CV / Cover Letter / Personal Statement tabs */}
        {(activeTab === 'cv' || activeTab === 'cover_letter' || activeTab === 'personal_statement') && (
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white capitalize">
                  {activeTab === 'cv' ? 'Curriculum Vitae' : activeTab === 'cover_letter' ? 'Cover Letter' : 'Personal Statement'}
                </h2>
                <p className="text-xs text-[#71717a] mt-0.5">
                  {activeTab === 'cv' ? 'A professional CV tailored for scholarship applications'
                    : activeTab === 'cover_letter' ? 'A formal letter addressed to the scholarship committee'
                    : 'A personal narrative highlighting your background and goals'}
                </p>
              </div>
              <Button onClick={() => generateDocument(activeTab as 'cv' | 'cover_letter' | 'personal_statement')} disabled={!!generatingDoc} className="gap-2">
                {generatingDoc === activeTab
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : generatedDocs[activeTab] ? '🔄 Regenerate' : '✨ Generate with AI'}
              </Button>
            </div>

            {!generatedDocs[activeTab] && !generatingDoc && (
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
                <div className="w-12 h-12 rounded-full bg-green-600/10 border border-green-600/20 flex items-center justify-center mx-auto mb-4">
                  <PenLine className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-white font-medium mb-2">Ready to generate</p>
                <p className="text-sm text-[#71717a] mb-4">Claude will write this based on your profile and the scholarship details.</p>
                <Button onClick={() => generateDocument(activeTab as 'cv' | 'cover_letter' | 'personal_statement')}>
                  ✨ Generate with AI
                </Button>
              </div>
            )}

            {(generatedDocs[activeTab] || generatingDoc === activeTab) && (
              <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
                  <span className="text-xs text-[#71717a]">
                    {generatingDoc === activeTab ? 'Writing…' : `${generatedDocs[activeTab]?.trim().split(/\s+/).length ?? 0} words`}
                  </span>
                  {generatedDocs[activeTab] && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(generatedDocs[activeTab], activeTab)}>
                        {copySuccess === activeTab ? <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => downloadAsText(generatedDocs[activeTab], `${activeTab}_${scholarshipTitle.replace(/\s+/g, '_')}.txt`)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <pre className="text-sm text-[#e4e4e7] whitespace-pre-wrap leading-relaxed font-sans">
                    {generatedDocs[activeTab] || ''}
                    {generatingDoc === activeTab && <span className="animate-pulse text-green-400">▍</span>}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist tab */}
        {activeTab === 'checklist' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">Application Checklist</h2>
              <p className="text-sm text-[#a1a1aa]">Track everything you need to submit. Check off items as you complete them.</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(checkedItems.size / CHECKLIST_ITEMS.length) * 100}%` }} />
                </div>
                <span className="text-xs text-[#71717a]">{checkedItems.size}/{CHECKLIST_ITEMS.length} done</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item.doc}
                  onClick={() => toggleCheck(item.doc)}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    checkedItems.has(item.doc)
                      ? 'border-green-600/40 bg-green-600/5'
                      : 'border-[#1f1f1f] bg-[#111111] hover:border-[#2a2a2a]'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checkedItems.has(item.doc) ? 'border-green-500 bg-green-500' : 'border-[#3a3a3a]'
                  }`}>
                    {checkedItems.has(item.doc) && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium transition-colors ${checkedItems.has(item.doc) ? 'text-[#71717a] line-through' : 'text-white'}`}>
                      {item.doc}
                    </p>
                    <p className="text-xs text-[#71717a] mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Submit section */}
            <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-6">
              <h3 className="font-semibold text-green-400 mb-2">Ready to Submit?</h3>
              <p className="text-sm text-[#a1a1aa] mb-4">
                Once all documents are prepared, submit your complete application package through the official scholarship portal.
              </p>
              {scholarshipUrl ? (
                <Button className="gap-2" onClick={() => window.open(scholarshipUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" /> Open Official Application Portal
                </Button>
              ) : (
                <p className="text-xs text-[#71717a]">Visit the scholarship's official website to find the application link.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <h2 className="text-sm font-semibold text-white">Update Application Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-[#71717a] hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status options */}
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const isSelected = app.status === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !updatingStatus && updateStatus(opt.value)}
                      disabled={updatingStatus}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${opt.bg} ${opt.border} ${opt.color}`
                          : 'border-[#1f1f1f] bg-[#0d0d0d] text-[#71717a] hover:border-[#2a2a2a] hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{opt.label}</span>
                      {isSelected && <span className="text-[10px] opacity-70">Current</span>}
                    </button>
                  )
                })}
              </div>

              {/* Submitted date picker */}
              {app.status !== 'draft' && (
                <div>
                  <label className="text-xs text-[#71717a] block mb-1.5">
                    {app.status === 'submitted' ? 'Date Submitted' : app.status === 'accepted' || app.status === 'rejected' ? 'Decision Date' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={submittedDate}
                    onChange={e => setSubmittedDate(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-600"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-[#71717a] block mb-1.5">Notes (optional)</label>
                <textarea
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder={
                    app.status === 'submitted' ? 'e.g. Submitted via online portal, reference #12345'
                    : app.status === 'accepted' ? 'e.g. Award amount, conditions, next steps...'
                    : app.status === 'rejected' ? 'e.g. Reason given, reapply next year...'
                    : 'Any notes about this application...'
                  }
                  rows={3}
                  className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3a3a3a] focus:outline-none focus:border-green-600 resize-none"
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 pt-1">
                {app.status === 'draft' && (
                  <Button className="flex-1 gap-2" onClick={() => updateStatus('submitted')} disabled={updatingStatus}>
                    {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Mark as Submitted
                  </Button>
                )}
                {app.status === 'submitted' && (
                  <>
                    <Button className="flex-1 gap-2 bg-green-700 hover:bg-green-600" onClick={() => updateStatus('accepted')} disabled={updatingStatus}>
                      <Trophy className="h-4 w-4" /> Accepted!
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => updateStatus('rejected')} disabled={updatingStatus}>
                      <XCircle className="h-4 w-4" /> Rejected
                    </Button>
                  </>
                )}
                {(app.status === 'accepted' || app.status === 'rejected') && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => updateStatus('draft')} disabled={updatingStatus}>
                    <RotateCcw className="h-4 w-4" /> Reset to Draft
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
