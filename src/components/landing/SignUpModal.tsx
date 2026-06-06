'use client'

import { useState } from 'react'
import { X, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignUpModalProps {
  open: boolean
  onClose: () => void
  reason: 'save' | 'second-essay' | 'full-results'
}

const COPY: Record<SignUpModalProps['reason'], { headline: string; sub: string; benefit: string }> = {
  save: {
    headline: 'Save this scholarship',
    sub: 'Create a free account to bookmark scholarships, track deadlines, and apply with AI-written essays.',
    benefit: '✓ Completely free · No credit card needed',
  },
  'second-essay': {
    headline: 'Write unlimited essays',
    sub: 'Create a free account to write essays for every scholarship you apply to — no limits.',
    benefit: '✓ Unlimited essays · Always free',
  },
  'full-results': {
    headline: 'See all your matches',
    sub: 'Your demo shows 4 scholarships. Sign up free to run a full search — 500+ opportunities for Liberian students.',
    benefit: '✓ Full search · Match scoring · Deadline alerts · Free',
  },
}

export function SignUpModal({ open, onClose, reason }: SignUpModalProps) {
  const [email, setEmail] = useState('')
  const copy = COPY[reason]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600/20 border border-green-600/30 mb-6">
          <Sparkles className="h-6 w-6 text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{copy.headline}</h2>
        <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">{copy.sub}</p>

        {/* Email form */}
        <div className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-11 px-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#71717a] text-sm focus:outline-none focus:border-green-600 transition-colors"
          />
          <Button
            className="w-full gap-2"
            onClick={() => { window.location.href = `/register${email ? `?email=${encodeURIComponent(email)}` : ''}` }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-[#71717a] mt-4">{copy.benefit}</p>
      </div>
    </div>
  )
}
