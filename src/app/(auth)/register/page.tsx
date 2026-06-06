'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, User, FileText, Search, PenLine, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const STEPS = [
  {
    icon: User,
    title: 'Complete your profile',
    desc: 'Add your name, field of study, GPA, achievements, work experience, and personal statement. The more detail you provide, the better your AI-generated documents will be.',
    cta: 'Go to Profile',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    icon: FileText,
    title: 'Upload your documents',
    desc: 'Upload your academic transcripts, proof of nationality, and any other supporting documents. These are required for most scholarship applications.',
    cta: null,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Search,
    title: 'Search for scholarships',
    desc: 'Browse available scholarships and save the ones you want to apply for. Use filters to find opportunities that match your field and degree level.',
    cta: null,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: PenLine,
    title: 'Generate your application package',
    desc: 'Inside each application, use AI to write your essay, cover letter, personal statement, and CV — all tailored to the specific scholarship.',
    cta: null,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
]

function OnboardingSteps({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 mb-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold text-white">Account created!</h2>
        <p className="text-sm text-[#a1a1aa] mt-1">Here's how to get the most out of ScholarPath:</p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className={`flex gap-3 p-3 rounded-xl border ${step.bg} ${step.border}`}>
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${step.bg} border ${step.border}`}>
                <Icon className={`h-4 w-4 ${step.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#71717a]">STEP {i + 1}</span>
                </div>
                <p className={`text-sm font-semibold ${step.color}`}>{step.title}</p>
                <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <Button className="w-full gap-2 mt-2" onClick={onContinue}>
        Start with my Profile <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(decodeURIComponent(emailParam))
  }, [searchParams])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      // Sign in immediately so the session cookie is set
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <OnboardingSteps onContinue={() => router.push('/profile')} />
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Amara Kamara"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : 'Create Free Account'}
      </Button>

      <p className="text-xs text-center text-[#71717a]">
        No credit card · No limits · Always free
      </p>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-2">
            <span>🎓</span> ScholarPath
          </Link>
          <p className="text-[#a1a1aa] text-sm">Create your free account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Create an account to find scholarships</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 animate-pulse bg-[#111] rounded" />}>
              <RegisterForm />
            </Suspense>
            <div className="mt-6 text-center">
              <p className="text-sm text-[#a1a1aa]">
                Already have an account?{' '}
                <Link href="/login" className="text-green-500 hover:text-green-400 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
