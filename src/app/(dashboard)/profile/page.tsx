'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile } from '@/types/profile'

const STEPS = [
  { title: 'Personal Info', desc: 'Basic personal information' },
  { title: 'Academic Background', desc: 'Your education history' },
  { title: 'Experience & Achievements', desc: 'Activities and accomplishments' },
  { title: 'Goals & Statement', desc: 'Your aspirations and financial need' },
]

const DEFAULT_PROFILE: Partial<Profile> = {
  full_name: '',
  email: '',
  nationality: 'Liberian',
  date_of_birth: '',
  gender: '',
  gpa: 3.0,
  degree_level: 'undergraduate',
  field_of_study: '',
  current_institution: '',
  graduation_year: 2025,
  english_proficiency: 'fluent',
  financial_need: false,
  extracurriculars: [],
  work_experience: '',
  achievements: '',
  personal_statement: '',
}

export default function ProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Partial<Profile>>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [extracurricularsText, setExtracurricularsText] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    // Load from localStorage first (instant, survives serverless cold starts)
    const local = localStorage.getItem('sp_profile')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        setProfile({ ...DEFAULT_PROFILE, ...parsed })
        setExtracurricularsText((parsed.extracurriculars || []).join(', '))
        setLoading(false)
        return
      } catch {}
    }
    // Fallback: try API
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setProfile({ ...DEFAULT_PROFILE, ...data.profile })
          setExtracurricularsText((data.profile.extracurriculars || []).join(', '))
          localStorage.setItem('sp_profile', JSON.stringify(data.profile))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(key: keyof Profile, value: unknown) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  async function saveProfile() {
    setSaving(true)
    const updated = { ...profile, extracurriculars: extracurricularsText.split(',').map(s => s.trim()).filter(Boolean) }
    // Always save to localStorage first — this is the reliable store
    localStorage.setItem('sp_profile', JSON.stringify(updated))
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      // API save failed but localStorage succeeded — still works
    }
    setToast('Profile saved successfully!')
    setSaved(true)
    setTimeout(() => { setSaved(false); setToast(null) }, 3000)
    setSaving(false)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-8 w-48 bg-[#1f1f1f] rounded animate-pulse mb-4" />
        <div className="h-64 bg-[#111111] border border-[#1f1f1f] rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          toast.includes('Failed') ? 'bg-red-600/20 border border-red-600/30 text-red-400' : 'bg-green-600/20 border border-green-600/30 text-green-400'
        }`}>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Complete Your Profile</h1>
        <p className="text-[#a1a1aa] text-sm">AI uses your profile to find matching scholarships and write personalized essays.</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-[#a1a1aa] mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} />
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`text-xs transition-colors ${i <= step ? 'text-green-500' : 'text-[#71717a]'}`}
            >
              {i < step ? <CheckCircle className="h-4 w-4 inline" /> : `${i + 1}.`} {s.title}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={profile.email || ''} onChange={e => update('email', e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={profile.nationality || ''} onChange={e => update('nationality', e.target.value)} placeholder="e.g. Liberian" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={profile.date_of_birth || ''} onChange={e => update('date_of_birth', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={profile.gender || ''} onValueChange={v => update('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Degree Level</Label>
                <Select value={profile.degree_level || ''} onValueChange={v => update('degree_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Masters</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input value={profile.field_of_study || ''} onChange={e => update('field_of_study', e.target.value)} placeholder="e.g. Computer Science, Medicine, Engineering" />
              </div>
              <div className="space-y-2">
                <Label>Current Institution</Label>
                <Input value={profile.current_institution || ''} onChange={e => update('current_institution', e.target.value)} placeholder="e.g. University of Liberia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GPA (0.0 - 4.0)</Label>
                  <Input type="number" min="0" max="4" step="0.1" value={profile.gpa || 0} onChange={e => update('gpa', parseFloat(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input type="number" min="2024" max="2030" value={profile.graduation_year || 2025} onChange={e => update('graduation_year', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>English Proficiency</Label>
                <Select value={profile.english_proficiency || ''} onValueChange={v => update('english_proficiency', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native</SelectItem>
                    <SelectItem value="fluent">Fluent</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Extracurricular Activities</Label>
                <Input
                  value={extracurricularsText}
                  onChange={e => setExtracurricularsText(e.target.value)}
                  placeholder="e.g. Student council, Chess club, Debate team (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <Label>Work Experience</Label>
                <Textarea
                  value={profile.work_experience || ''}
                  onChange={e => update('work_experience', e.target.value)}
                  placeholder="Describe any internships, part-time jobs, or volunteer work..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Achievements & Awards</Label>
                <Textarea
                  value={profile.achievements || ''}
                  onChange={e => update('achievements', e.target.value)}
                  placeholder="List your awards, honors, publications, competitions won..."
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Personal Statement (Notes)</Label>
                <Textarea
                  value={profile.personal_statement || ''}
                  onChange={e => update('personal_statement', e.target.value)}
                  placeholder="Describe your goals, why you want to study abroad, what you want to achieve, your story..."
                  className="min-h-[160px]"
                />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f]">
                <input
                  type="checkbox"
                  id="financial_need"
                  checked={profile.financial_need || false}
                  onChange={e => update('financial_need', e.target.checked)}
                  className="h-4 w-4 accent-green-600"
                />
                <div>
                  <label htmlFor="financial_need" className="text-sm font-medium text-white cursor-pointer">
                    I have financial need
                  </label>
                  <p className="text-xs text-[#71717a]">This helps match you with need-based scholarships</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-[#1f1f1f]">
            <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4" />
                {saved ? 'Saved!' : 'Save Progress'}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={async () => { await saveProfile(); router.push('/search') }}>
                  Find Scholarships <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
