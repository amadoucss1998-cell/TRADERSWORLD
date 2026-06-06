'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
      setSuccess(true)
      setTimeout(() => router.push('/profile'), 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
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
            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="font-medium text-white">Account created!</p>
                <p className="text-sm text-[#a1a1aa]">Redirecting to your profile…</p>
              </div>
            ) : (
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
            )}

            {!success && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#a1a1aa]">
                  Already have an account?{' '}
                  <Link href="/login" className="text-green-500 hover:text-green-400 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
